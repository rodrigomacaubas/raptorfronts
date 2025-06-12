import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { KeycloakService } from 'keycloak-angular';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private keycloakService: KeycloakService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // URLs que não precisam de autenticação
    const excludedUrls = [
      '/assets/',
      '/api/auth/steam_url',
      '/api/check/email',
      '/api/check/username',
      '/api/users', // POST para registro
      '/api/servers' // GET público para listar servidores
    ];

    // Verifica se a URL está excluída
    const isExcluded = excludedUrls.some(url => req.url.includes(url));
    
    // Se for uma requisição para API e não estiver na lista de exclusão
    if (req.url.startsWith('/api/') && !isExcluded) {
      console.log('🔐 Interceptando requisição para:', req.url);
      
      return from(this.addAuthHeader(req)).pipe(
        switchMap(authReq => next.handle(authReq)),
        catchError((error: HttpErrorResponse) => {
          console.error('❌ Erro na requisição interceptada:', error);
          
          // Se erro 401, tenta renovar token
          if (error.status === 401) {
            console.log('🔄 Tentando renovar token...');
            return from(this.keycloakService.updateToken(30)).pipe(
              switchMap(() => from(this.addAuthHeader(req))),
              switchMap(authReq => next.handle(authReq)),
              catchError(renewError => {
                console.error('❌ Falha ao renovar token, redirecionando para login');
                this.keycloakService.login();
                return throwError(renewError);
              })
            );
          }
          
          return throwError(error);
        })
      );
    }
    
    // Para requisições que não precisam de auth, passa direto
    return next.handle(req);
  }

  private async addAuthHeader(req: HttpRequest<any>): Promise<HttpRequest<any>> {
    try {
      const isLoggedIn = await this.keycloakService.isLoggedIn();
      
      if (!isLoggedIn) {
        console.warn('⚠️ Usuário não está logado');
        throw new Error('Usuário não autenticado');
      }

      const token = await this.keycloakService.getToken();
      
      if (!token) {
        console.warn('⚠️ Token não encontrado');
        throw new Error('Token não encontrado');
      }

      console.log('✅ Token adicionado à requisição:', token.substring(0, 20) + '...');

      return req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('❌ Erro ao adicionar header de auth:', error);
      throw error;
    }
  }
}