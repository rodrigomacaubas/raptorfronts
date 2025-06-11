// src/app/services/steam-auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { KeycloakService } from 'keycloak-angular';
import { Observable } from 'rxjs';
import { timeout, catchError, throwError } from 'rxjs';

export interface SteamLoginResponse {
  steam_login_url: string;
}

export interface SteamVerifyRequest {
  openid_params: {
    'openid.ns'?: string;
    'openid.mode'?: string;
    'openid.op_endpoint'?: string;
    'openid.claimed_id'?: string;
    'openid.identity'?: string;
    'openid.return_to'?: string;
    'openid.response_nonce'?: string;
    'openid.assoc_handle'?: string;
    'openid.signed'?: string;
    'openid.sig'?: string;
  };
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
export class SteamAuthService {
  private readonly baseUrl = 'http://localhost:5000'; // ← AJUSTE CONFORME SEU BACKEND

  constructor(
    private http: HttpClient,
    private keycloakService: KeycloakService
  ) {}

  /**
   * 1️⃣ PRIMEIRA CHAMADA: Solicita URL de login do Steam
   */
  async getSteamLoginUrl(): Promise<Observable<SteamLoginResponse>> {
    console.log('🚀 [1/2] Solicitando URL de login Steam...');
    
    const headers = await this.getAuthHeaders();
    const redirectUri = `${window.location.origin}/steam-callback`;
    
    console.log('📍 Redirect URI configurado:', redirectUri);
    console.log('🔗 Chamando:', `${this.baseUrl}/api/auth/steam_url`);
    
    return this.http.get<SteamLoginResponse>(
      `${this.baseUrl}/api/auth/steam_url?redirect_uri=${encodeURIComponent(redirectUri)}`,
      { headers }
    ).pipe(
      timeout(10000), // 10 segundos timeout
      catchError(error => {
        console.error('❌ Erro ao obter URL Steam:', error);
        return throwError(() => this.handleHttpError(error));
      })
    );
  }

  /**
   * 2️⃣ SEGUNDA CHAMADA: Verifica dados Steam e associa à conta
   */
  async verifySteamLogin(openidParams: any): Promise<Observable<SteamVerifyResponse>> {
    console.log('🔄 [2/2] Verificando dados Steam no backend...');
    
    const headers = await this.getAuthHeaders();
    const body: SteamVerifyRequest = {
      openid_params: openidParams
    };

    console.log('📤 Enviando dados para:', `${this.baseUrl}/api/auth/steam_verify`);
    console.log('📋 Parâmetros OpenID:', Object.keys(openidParams).length, 'parâmetros');
    console.log('🔑 Parâmetros principais:', {
      mode: openidParams['openid.mode'],
      identity: openidParams['openid.identity'] ? 'presente' : 'ausente',
      sig: openidParams['openid.sig'] ? 'presente' : 'ausente'
    });

    return this.http.post<SteamVerifyResponse>(
      `${this.baseUrl}/api/auth/steam_verify`,
      body,
      { 
        headers,
        timeout: 15000 // 15 segundos timeout
      }
    ).pipe(
      catchError(error => {
        console.error('❌ Erro na verificação Steam:', error);
        return throwError(() => this.handleHttpError(error));
      })
    );
  }

  /**
   * Extrai parâmetros OpenID da URL
   */
  extractOpenIDParams(url: string): any {
    console.log('🔍 Extraindo parâmetros OpenID da URL...');
    
    const urlObj = new URL(url);
    const params: any = {};
    
    urlObj.searchParams.forEach((value, key) => {
      if (key.startsWith('openid.')) {
        params[key] = value;
      }
    });
    
    console.log('📋 Parâmetros OpenID extraídos:', {
      total: Object.keys(params).length,
      params: Object.keys(params),
      hasIdentity: !!params['openid.identity'],
      hasMode: !!params['openid.mode'],
      hasSig: !!params['openid.sig']
    });
    
    return params;
  }

  /**
   * Inicia o processo de login do Steam
   */
  async startSteamLogin(): Promise<void> {
    console.log('🚀 Iniciando processo de login Steam...');
    
    try {
      const response = await this.getSteamLoginUrl();
      
      return new Promise((resolve, reject) => {
        const subscription = response.subscribe({
          next: (data) => {
            console.log('✅ [1/2] URL de login Steam recebida!');
            console.log('🔗 URL Steam:', data.steam_login_url);
            console.log('🔄 Redirecionando para Steam...');
            
            // Redireciona para a URL do Steam
            window.location.href = data.steam_login_url;
            subscription.unsubscribe();
            resolve();
          },
          error: (error) => {
            console.error('❌ [1/2] Erro ao obter URL de login:', error);
            subscription.unsubscribe();
            reject(error);
          }
        });
      });
    } catch (error) {
      console.error('❌ Erro no login Steam:', error);
      throw error;
    }
  }

  /**
   * Processa o callback do Steam (chamado pelo SteamCallbackComponent)
   */
  async processSteamCallback(currentUrl: string): Promise<SteamVerifyResponse> {
    console.log('🔄 Processando callback Steam...');
    
    const openidParams = this.extractOpenIDParams(currentUrl);
    
    if (Object.keys(openidParams).length === 0) {
      console.error('❌ Nenhum parâmetro OpenID encontrado na URL');
      throw new Error('Parâmetros OpenID não encontrados na URL');
    }

    // Validar parâmetros obrigatórios
    const requiredParams = ['openid.mode', 'openid.identity', 'openid.sig'];
    const missingParams = requiredParams.filter(param => !openidParams[param]);
    
    if (missingParams.length > 0) {
      console.error('❌ Parâmetros OpenID obrigatórios ausentes:', missingParams);
      throw new Error(`Parâmetros OpenID obrigatórios ausentes: ${missingParams.join(', ')}`);
    }

    try {
      console.log('📤 [2/2] Enviando parâmetros para verificação no backend...');
      const response = await this.verifySteamLogin(openidParams);
      
      return new Promise((resolve, reject) => {
        const subscription = response.subscribe({
          next: (data) => {
            console.log('✅ [2/2] Verificação Steam concluída com sucesso!');
            console.log('🎉 Resultado:', data);
            subscription.unsubscribe();
            resolve(data);
          },
          error: (error) => {
            console.error('❌ [2/2] Erro na verificação Steam:', error);
            subscription.unsubscribe();
            reject(error);
          }
        });
      });
    } catch (error) {
      console.error('❌ Erro ao verificar login Steam:', error);
      throw error;
    }
  }

  private async getAuthHeaders(): Promise<HttpHeaders> {
    try {
      const token = await this.keycloakService.getToken();
      console.log('🎫 Token obtido para autenticação');
      
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
    } catch (error) {
      console.error('❌ Erro ao obter token de autenticação:', error);
      throw new Error('Falha na autenticação');
    }
  }

  private handleHttpError(error: any): Error {
    let friendlyMessage = 'Erro desconhecido';
    
    if (error.status === 0) {
      friendlyMessage = 'Servidor não está respondendo. Verifique se o backend está rodando.';
    } else if (error.status === 404) {
      friendlyMessage = 'Serviço de autenticação Steam não encontrado (404).';
    } else if (error.status === 401) {
      friendlyMessage = 'Não autorizado. Faça login novamente.';
    } else if (error.status === 409) {
      friendlyMessage = 'Este Steam ID já está vinculado a outra conta.';
    } else if (error.status === 503) {
      friendlyMessage = 'Falha na comunicação com servidores Steam.';
    } else if (error.status >= 500) {
      friendlyMessage = 'Erro interno do servidor. Tente novamente.';
    } else if (error.name === 'TimeoutError') {
      friendlyMessage = 'Tempo limite excedido. Servidor pode estar sobrecarregado.';
    } else if (error.error?.error) {
      friendlyMessage = error.error.error;
    } else if (error.message) {
      friendlyMessage = error.message;
    }
    
    return new Error(friendlyMessage);
  }
}