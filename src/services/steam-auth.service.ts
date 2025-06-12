import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { KeycloakService } from 'keycloak-angular';

export interface UserSteamID {
  steamid64: string;
  is_default: boolean;
  linked_at: string;
}

export interface SteamIDsResponse {
  steam_ids: UserSteamID[];
  message?: string;
}

export interface SteamLoginResponse {
  steam_login_url: string;
}

export interface SteamVerifyResponse {
  message: string;
  steamid64?: string;
  is_default?: boolean;
  status: 'created' | 'existing' | 'conflict';
}

@Injectable({
  providedIn: 'root'
})
export class SteamService {
  private apiUrl = '/api';

  constructor(
    private http: HttpClient,
    private keycloakService: KeycloakService
  ) {}

  /**
   * Obtém headers de autenticação de forma assíncrona
   */
  private async getAuthHeaders(): Promise<HttpHeaders> {
    try {
      const isLoggedIn = await this.keycloakService.isLoggedIn();
      if (!isLoggedIn) {
        throw new Error('Usuário não autenticado');
      }

      const token = await this.keycloakService.getToken();
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      return new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
    } catch (error) {
      console.error('❌ Erro ao obter headers de autenticação:', error);
      throw error;
    }
  }

  /**
   * Método helper para fazer requisições autenticadas
   */
  private makeAuthenticatedRequest<T>(
    requestFn: (headers: HttpHeaders) => Observable<T>
  ): Observable<T> {
    return from(this.getAuthHeaders()).pipe(
      switchMap(headers => requestFn(headers)),
      catchError(error => {
        console.error('❌ Erro na requisição autenticada:', error);
        
        if (error.status === 401) {
          console.log('🔄 Tentando renovar token...');
          return from(this.keycloakService.updateToken(30)).pipe(
            switchMap(() => from(this.getAuthHeaders())),
            switchMap(headers => requestFn(headers)),
            catchError(renewError => {
              console.error('❌ Falha ao renovar token:', renewError);
              this.keycloakService.login();
              return throwError(renewError);
            })
          );
        }
        
        return throwError(error);
      })
    );
  }

  /**
   * Obtém a URL de login do Steam
   */
  getSteamLoginUrl(redirectUri: string): Observable<SteamLoginResponse> {
    const params = new URLSearchParams({
      redirect_uri: redirectUri
    });
    
    return this.http.get<SteamLoginResponse>(
      `${this.apiUrl}/auth/steam_url?${params.toString()}`
    );
  }

  /**
   * Verifica os dados de retorno do Steam e associa à conta do usuário
   */
  verifySteamLogin(openidParams: any): Observable<SteamVerifyResponse> {
    const request = {
      openid_params: openidParams
    };

    return this.makeAuthenticatedRequest<SteamVerifyResponse>(
      (headers) => this.http.post<SteamVerifyResponse>(
        `${this.apiUrl}/auth/steam_verify`,
        request,
        { headers }
      )
    );
  }

  /**
   * Processa o callback completo do Steam
   */
  processSteamCallback(fullUrl: string): Observable<SteamVerifyResponse> {
    const openidParams = this.extractOpenIDParamsFromUrl(fullUrl);
    if (!openidParams) {
      return throwError(new Error('Parâmetros OpenID não encontrados na URL'));
    }
    return this.verifySteamLogin(openidParams);
  }

  /**
   * Lista os SteamIDs associados ao usuário atual
   */
  getUserSteamIDs(): Observable<UserSteamID[]> {
    console.log('🔍 Buscando SteamIDs do usuário...');
    
    return this.makeAuthenticatedRequest<SteamIDsResponse>(
      (headers) => {
        console.log('📤 Fazendo requisição para /user/steam_ids');
        return this.http.get<SteamIDsResponse>(
          `${this.apiUrl}/user/steam_ids`,
          { headers }
        );
      }
    ).pipe(
      map(response => {
        console.log('✅ Resposta recebida:', response);
        return response.steam_ids || [];
      }),
      catchError(error => {
        console.error('❌ Erro ao buscar SteamIDs:', error);
        return throwError(error);
      })
    );
  }

  /**
   * Remove a associação de um SteamID
   */
  removeSteamID(steamId: string): Observable<{ message: string }> {
    return this.makeAuthenticatedRequest<{ message: string }>(
      (headers) => this.http.delete<{ message: string }>(
        `${this.apiUrl}/user/steam_ids/${steamId}`,
        { headers }
      )
    );
  }

  /**
   * Define um SteamID como padrão
   */
  setDefaultSteamID(steamId: string): Observable<{ message: string }> {
    return this.makeAuthenticatedRequest<{ message: string }>(
      (headers) => this.http.get<{ message: string }>(
        `${this.apiUrl}/user/steamid/${steamId}/set_default`,
        { headers }
      )
    );
  }

  /**
   * Extrai parâmetros OpenID da URL atual
   */
  extractOpenIDParams(): any | null {
    return this.extractOpenIDParamsFromUrl(window.location.href);
  }

  /**
   * Extrai parâmetros OpenID de uma URL específica
   */
  extractOpenIDParamsFromUrl(url: string): any | null {
    try {
      const urlObj = new URL(url);
      const urlParams = urlObj.searchParams;
      
      if (!urlParams.has('openid.mode')) {
        return null;
      }

      const openidParams: any = {};
      const expectedParams = [
        'openid.ns', 'openid.mode', 'openid.op_endpoint',
        'openid.claimed_id', 'openid.identity', 'openid.return_to',
        'openid.response_nonce', 'openid.assoc_handle', 'openid.signed', 'openid.sig'
      ];

      expectedParams.forEach(param => {
        const value = urlParams.get(param);
        if (value) {
          openidParams[param] = value;
        }
      });

      return Object.keys(openidParams).length > 0 ? openidParams : null;
    } catch (error) {
      console.error('Erro ao extrair parâmetros OpenID:', error);
      return null;
    }
  }

  /**
   * Limpa parâmetros OpenID da URL
   */
  clearUrlParams(): void {
    const url = new URL(window.location.href);
    const searchParams = new URLSearchParams(url.search);
    
    for (const [key] of searchParams.entries()) {
      if (key.startsWith('openid.')) {
        searchParams.delete(key);
      }
    }
    
    const newUrl = url.pathname + (searchParams.toString() ? '?' + searchParams.toString() : '');
    window.history.replaceState({}, '', newUrl);
  }

  /**
   * Método para debug - verifica se o usuário está autenticado
   */
  async checkAuthStatus(): Promise<void> {
    try {
      const isLoggedIn = await this.keycloakService.isLoggedIn();
      const token = await this.keycloakService.getToken();
      const userProfile = await this.keycloakService.loadUserProfile();
      
      console.log('🔍 Status de Autenticação:');
      console.log('  - Logado:', isLoggedIn);
      console.log('  - Token existe:', !!token);
      console.log('  - Username:', userProfile.username);
      console.log('  - Token (primeiros 50 chars):', token?.substring(0, 50) + '...');
    } catch (error) {
      console.error('❌ Erro ao verificar status de autenticação:', error);
    }
  }
}