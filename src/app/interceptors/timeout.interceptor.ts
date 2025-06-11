// src/app/interceptors/timeout.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, timeout, catchError, throwError } from 'rxjs';

@Injectable()
export class TimeoutInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Define timeout baseado na URL ou configuração
    const timeoutValue = this.getTimeoutForRequest(req);
    
    return next.handle(req).pipe(
      timeout(timeoutValue),
      catchError(err => {
        if (err.name === 'TimeoutError') {
          console.error(`⏱️ Timeout na requisição: ${req.url}`);
          return throwError(() => ({
            name: 'TimeoutError',
            message: 'Tempo limite da requisição excedido',
            status: 0,
            error: { error: 'Tempo limite excedido. Servidor pode estar sobrecarregado.' }
          }));
        }
        return throwError(() => err);
      })
    );
  }

  private getTimeoutForRequest(req: HttpRequest<any>): number {
    // Steam verification pode demorar mais
    if (req.url.includes('/api/auth/steam_verify')) {
      return 15000; // 15 segundos
    }
    
    // Steam URL generation é mais rápido
    if (req.url.includes('/api/auth/steam_url')) {
      return 10000; // 10 segundos
    }
    
    // Default timeout para outras requisições
    return 8000; // 8 segundos
  }
}