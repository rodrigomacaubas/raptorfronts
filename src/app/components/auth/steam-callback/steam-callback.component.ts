import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SteamService, SteamVerifyResponse } from '../../../../services/steam-auth.service';

@Component({
  selector: 'app-steam-callback',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule
  ],
  template: `
    <div class="callback-container">
      <mat-card class="callback-card">
        <mat-card-content>
          <!-- Loading State -->
          <div class="content-center" *ngIf="loading">
            <mat-spinner diameter="50"></mat-spinner>
            <h2>🔄 Processando autenticação Steam...</h2>
            <p>Validando dados com o servidor...</p>
            <div class="progress-info">
              <p><strong>URL atual:</strong></p>
              <code>{{ currentUrl | slice:0:100 }}{{ currentUrl.length > 100 ? '...' : '' }}</code>
              <p><strong>Parâmetros OpenID:</strong> {{ openidCount }} encontrados</p>
              <p><strong>Status:</strong> {{ currentStatus }}</p>
            </div>
          </div>

          <!-- Success State -->
          <div class="content-center" *ngIf="!loading && success">
            <mat-icon class="success-icon">check_circle</mat-icon>
            <h2>🎉 Steam conectado com sucesso!</h2>
            <p>{{ successMessage }}</p>
            
            <div class="steam-info" *ngIf="steamResult">
              <h3>📋 Informações da Conta:</h3>
              <p><strong>Steam ID:</strong> {{ steamResult.steamid64 }}</p>
              <p><strong>Status:</strong> {{ getStatusLabel(steamResult.status) }}</p>
              <p><strong>Conta Padrão:</strong> {{ steamResult.is_default ? 'Sim' : 'Não' }}</p>
            </div>
            
            <div class="action-buttons">
              <button mat-raised-button color="primary" (click)="redirectToProfile()">
                <mat-icon>person</mat-icon>
                Ir para o Perfil
              </button>
              <button mat-button (click)="redirectToHome()">
                <mat-icon>home</mat-icon>
                Voltar ao Início
              </button>
            </div>
          </div>

          <!-- Error State -->
          <div class="content-center" *ngIf="!loading && error">
            <mat-icon class="error-icon">error</mat-icon>
            <h2>❌ Erro na autenticação Steam</h2>
            <p>{{ errorMessage }}</p>
            
            <div class="debug-info" *ngIf="showDebugInfo">
              <h3>🔍 Informações de Debug:</h3>
              <p><strong>URL:</strong> {{ currentUrl }}</p>
              <p><strong>Parâmetros OpenID:</strong> {{ openidCount }}</p>
              <p><strong>Erro técnico:</strong> {{ technicalError }}</p>
            </div>
            
            <div class="action-buttons">
              <button mat-raised-button color="primary" (click)="retryAuth()">
                <mat-icon>refresh</mat-icon>
                Tentar Novamente
              </button>
              <button mat-button (click)="redirectToProfile()">
                <mat-icon>arrow_back</mat-icon>
                Voltar ao Perfil
              </button>
              <button mat-button (click)="toggleDebugInfo()">
                <mat-icon>bug_report</mat-icon>
                {{ showDebugInfo ? 'Ocultar' : 'Mostrar' }} Debug
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .callback-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 80vh;
      padding: 24px;
      background: linear-gradient(135deg, #1b2838, #2a475e);
    }

    .callback-card {
      max-width: 600px;
      width: 100%;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
    }

    .content-center {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 32px;
      text-align: center;
    }

    .success-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #4caf50;
    }

    .error-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #f44336;
    }

    h2 {
      margin: 0;
      color: #333;
      font-size: 24px;
    }

    p {
      margin: 8px 0;
      color: #666;
      text-align: center;
    }

    .progress-info {
      background: #f8f9fa;
      padding: 16px;
      border-radius: 8px;
      margin-top: 16px;
      text-align: left;
      width: 100%;
    }

    .progress-info code {
      background: #e9ecef;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      word-break: break-all;
      display: block;
      margin: 8px 0;
    }

    .steam-info {
      background: linear-gradient(135deg, #1b2838, #2a475e);
      color: white;
      padding: 20px;
      border-radius: 8px;
      margin: 16px 0;
      width: 100%;
    }

    .steam-info h3 {
      color: #66c0f4;
      margin-bottom: 12px;
    }

    .steam-info p {
      color: #c7d5e0;
      margin: 8px 0;
    }

    .debug-info {
      background: #fff3cd;
      color: #856404;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid #ffeaa7;
      margin: 16px 0;
      width: 100%;
      text-align: left;
    }

    .debug-info h3 {
      color: #d63384;
      margin-bottom: 12px;
    }

    .action-buttons {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      justify-content: center;
      margin-top: 20px;
    }

    @media (max-width: 600px) {
      .callback-container {
        padding: 16px;
        min-height: 70vh;
      }

      .content-center {
        padding: 24px 16px;
        gap: 12px;
      }

      .success-icon,
      .error-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
      }

      h2 {
        font-size: 20px;
      }

      .action-buttons {
        flex-direction: column;
        width: 100%;
      }

      .action-buttons button {
        width: 100%;
      }
    }
  `]
})
export class SteamCallbackComponent implements OnInit {
  loading = true;
  success = false;
  error = false;
  currentUrl = '';
  openidCount = 0;
  currentStatus = 'Inicializando...';
  successMessage = '';
  errorMessage = '';
  technicalError = '';
  showDebugInfo = false;
  steamResult: SteamVerifyResponse | null = null;

  constructor(
    private router: Router,
    private steamService: SteamService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    console.log('🎯 Steam Callback Component carregado!');
    
    this.currentUrl = window.location.href;
    console.log('📍 URL atual:', this.currentUrl);
    
    this.processCallback();
  }

  private async processCallback(): Promise<void> {
    try {
      this.currentStatus = 'Verificando URL...';
      
      if (!this.isSteamCallback(this.currentUrl)) {
        console.error('❌ URL não é um callback válido do Steam');
        this.showError(
          'URL de callback inválida',
          'Parâmetros Steam não encontrados na URL',
          'URL não contém parâmetros openid.*'
        );
        return;
      }

      console.log('✅ URL identificada como callback Steam válido');
      this.currentStatus = 'Extraindo parâmetros...';
      
      const urlObj = new URL(this.currentUrl);
      this.openidCount = Array.from(urlObj.searchParams.keys())
        .filter(key => key.startsWith('openid.')).length;
      
      console.log('📋 Total de parâmetros OpenID:', this.openidCount);
      
      this.currentStatus = 'Processando no backend...';

      this.steamService.processSteamCallback(this.currentUrl).subscribe({
        next: (result) => {
          console.log('✅ Callback processado com sucesso:', result);
          
          this.loading = false;
          this.success = true;
          this.steamResult = result;
          
          switch (result.status) {
            case 'created':
              this.successMessage = `Steam ID ${result.steamid64} foi associado à sua conta com sucesso!`;
              if (result.is_default) {
                this.successMessage += ' Este é agora seu Steam ID padrão.';
              }
              break;
            case 'existing':
              this.successMessage = `Steam ID ${result.steamid64} já estava associado à sua conta.`;
              break;
            case 'conflict':
              this.showError(
                'Steam ID já vinculado',
                'Este Steam ID já está vinculado a outra conta.',
                result.message
              );
              return;
          }

          this.snackBar.open(result.message, 'Fechar', {
            duration: 5000,
            panelClass: ['success-snackbar']
          });

          setTimeout(() => {
            this.redirectToProfile();
          }, 5000);
        },
        error: (error) => {
          console.error('❌ Erro no callback Steam:', error);
          
          let message = 'Erro desconhecido ao processar autenticação Steam';
          let technical = '';
          
          if (error?.message) {
            message = error.message;
            technical = error.message;
          } else if (error?.error?.error) {
            message = error.error.error;
            technical = JSON.stringify(error.error);
          }

          this.showError('Falha na autenticação Steam', message, technical);
        }
      });

    } catch (error: any) {
      console.error('❌ Erro no processamento:', error);
      this.showError('Erro interno', error.message || 'Erro desconhecido', error.toString());
    }
  }

  private isSteamCallback(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.has('openid.mode') && 
             urlObj.searchParams.has('openid.identity');
    } catch {
      return false;
    }
  }

  private showError(title: string, message: string, technical: string) {
    this.loading = false;
    this.error = true;
    this.errorMessage = message;
    this.technicalError = technical;
    
    this.snackBar.open(message, 'Fechar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  retryAuth() {
    this.loading = true;
    this.error = false;
    this.success = false;
    this.currentStatus = 'Tentando novamente...';
    this.processCallback();
  }

  toggleDebugInfo() {
    this.showDebugInfo = !this.showDebugInfo;
  }

  redirectToProfile() {
    this.router.navigate(['/profile']);
  }

  redirectToHome() {
    this.router.navigate(['/home']);
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'created': return 'Nova associação criada';
      case 'existing': return 'Já associado anteriormente';
      case 'conflict': return 'Conflito - já vinculado a outra conta';
      default: return status;
    }
  }
}