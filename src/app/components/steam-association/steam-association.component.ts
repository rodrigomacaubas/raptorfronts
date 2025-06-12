import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SteamService, UserSteamID } from '../../../services/steam-auth.service';

@Component({
  selector: 'app-steam-association',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatButtonModule, MatIconModule,
    MatSnackBarModule, MatProgressSpinnerModule, MatListModule, 
    MatChipsModule, MatTooltipModule
  ],
  template: `
    <div class="steam-container">
      <h1>Associar Conta Steam</h1>
      
      <!-- Mostrar SteamIDs existentes -->
      <mat-card *ngIf="steamIds.length > 0 && !isLoading">
        <mat-card-header>
          <mat-icon mat-card-avatar>videogame_asset</mat-icon>
          <mat-card-title>Contas Steam Associadas</mat-card-title>
          <mat-card-subtitle>{{ steamIds.length }} conta(s) associada(s)</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <mat-list>
            <mat-list-item *ngFor="let steamId of steamIds">
              <mat-icon matListItemIcon>account_circle</mat-icon>
              
              <div matListItemTitle class="steam-id-info">
                <span class="steam-id">{{ steamId.steamid64 }}</span>
                <mat-chip *ngIf="steamId.is_default" class="default-chip">Padrão</mat-chip>
              </div>
              
              <div matListItemLine class="steam-date">
                Associado em: {{ formatDate(steamId.linked_at) }}
              </div>

              <div matListItemMeta class="steam-actions">
                <button 
                  *ngIf="!steamId.is_default" 
                  mat-icon-button 
                  (click)="setAsDefault(steamId.steamid64)"
                  matTooltip="Definir como padrão">
                  <mat-icon>star_border</mat-icon>
                </button>
                <button 
                  mat-icon-button 
                  color="warn"
                  (click)="removeSteamId(steamId.steamid64)"
                  [disabled]="steamId.is_default"
                  [matTooltip]="steamId.is_default ? 'Não é possível remover a conta padrão' : 'Remover associação'">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </mat-list-item>
          </mat-list>
        </mat-card-content>
      </mat-card>
      
      <!-- Card principal -->
      <mat-card>
        <mat-card-header>
          <mat-icon mat-card-avatar>videogame_asset</mat-icon>
          <mat-card-title>Steam Integration</mat-card-title>
          <mat-card-subtitle>
            {{ steamIds.length > 0 ? 'Associar nova conta Steam' : 'Conecte sua conta Steam' }}
          </mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <div *ngIf="isLoading" class="loading">
            <mat-progress-spinner mode="indeterminate"></mat-progress-spinner>
            <p>{{ loadingMessage }}</p>
          </div>
          
          <div *ngIf="!isLoading">
            <p>Clique no botão abaixo para associar {{ steamIds.length > 0 ? 'uma nova' : 'sua' }} conta Steam.</p>
            <p>Você será redirecionado para o Steam e retornará automaticamente.</p>
          </div>
        </mat-card-content>
        
        <mat-card-actions>
          <button 
            mat-raised-button 
            color="primary" 
            (click)="startSteamAuth()"
            [disabled]="isLoading">
            <mat-icon>link</mat-icon>
            {{ isLoading ? 'Processando...' : 'Conectar Steam' }}
          </button>
          
          <button 
            *ngIf="steamIds.length > 0"
            mat-button 
            (click)="loadSteamIds()"
            [disabled]="isLoading">
            <mat-icon>refresh</mat-icon>
            Atualizar
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .steam-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 24px;
    }
    
    h1 {
      color: #ff6600;
      margin-bottom: 24px;
    }
    
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 24px;
    }
    
    .loading p {
      color: #666;
    }
    
    .steam-id-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .steam-id {
      font-family: 'Courier New', monospace;
      font-weight: 500;
      color: #1976d2;
    }
    
    .default-chip {
      background-color: #ffd700;
      color: #333;
      font-size: 11px;
      font-weight: 500;
    }
    
    .steam-date {
      font-size: 12px;
      color: #666;
    }
    
    .steam-actions {
      display: flex;
      gap: 8px;
    }
    
    mat-card + mat-card {
      margin-top: 24px;
    }
  `]
})
export class SteamAssociationComponent implements OnInit {
  isLoading = false;
  loadingMessage = '';
  steamIds: UserSteamID[] = [];

  constructor(
    private steamService: SteamService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadSteamIds();
    this.checkSteamCallback();
  }

  /**
   * Carrega os SteamIDs do usuário
   */
  loadSteamIds() {
    this.steamService.getUserSteamIDs().subscribe({
      next: (steamIds) => {
        this.steamIds = steamIds;
      },
      error: (error) => {
        console.error('Erro ao carregar SteamIDs:', error);
        // Não mostra erro se não conseguir carregar
      }
    });
  }

  /**
   * Inicia o processo de autenticação Steam
   */
  startSteamAuth() {
    this.isLoading = true;
    this.loadingMessage = 'Gerando link do Steam...';

    const redirectUri = window.location.href;
    
    this.steamService.getSteamLoginUrl(redirectUri).subscribe({
      next: (response) => {
        if (response.steam_login_url) {
          window.location.href = response.steam_login_url;
        } else {
          throw new Error('URL do Steam não recebida');
        }
      },
      error: (error) => {
        console.error('Erro ao gerar URL Steam:', error);
        this.snackBar.open('Erro ao conectar com Steam', 'Fechar', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  /**
   * Verifica se voltou do Steam e processa os parâmetros
   */
  checkSteamCallback() {
    const openidParams = this.steamService.extractOpenIDParams();
    
    if (openidParams) {
      this.isLoading = true;
      this.loadingMessage = 'Verificando autenticação Steam...';

      this.steamService.verifySteamLogin(openidParams).subscribe({
        next: (response) => {
          this.steamService.clearUrlParams();
          this.handleSuccess(response);
          this.loadSteamIds();
        },
        error: (error) => {
          console.error('Erro na verificação Steam:', error);
          this.steamService.clearUrlParams();
          
          let message = 'Erro ao verificar conta Steam';
          if (error.error?.error) {
            message = error.error.error;
          }
          
          this.snackBar.open(message, 'Fechar', { 
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          
          this.isLoading = false;
        }
      });
    }
  }

  /**
   * Define um SteamID como padrão
   */
  setAsDefault(steamId: string) {
    this.steamService.setDefaultSteamID(steamId).subscribe({
      next: (response) => {
        this.snackBar.open('Conta Steam definida como padrão', 'Fechar', { duration: 3000 });
        this.loadSteamIds();
      },
      error: (error) => {
        console.error('Erro ao definir SteamID padrão:', error);
        this.snackBar.open('Erro ao definir conta como padrão', 'Fechar', { duration: 3000 });
      }
    });
  }

  /**
   * Remove a associação de um SteamID
   */
  removeSteamId(steamId: string) {
    if (!confirm('Tem certeza que deseja remover esta associação?')) {
      return;
    }

    this.steamService.removeSteamID(steamId).subscribe({
      next: (response) => {
        this.snackBar.open('Associação removida com sucesso', 'Fechar', { duration: 3000 });
        this.loadSteamIds();
      },
      error: (error) => {
        console.error('Erro ao remover SteamID:', error);
        
        let message = 'Erro ao remover associação';
        if (error.error?.error) {
          message = error.error.error;
        }
        
        this.snackBar.open(message, 'Fechar', { duration: 3000 });
      }
    });
  }

  /**
   * Trata o sucesso da associação
   */
  private handleSuccess(response: any) {
    this.isLoading = false;

    let message = '';
    switch (response.status) {
      case 'created':
        message = `Steam associado com sucesso! SteamID: ${response.steamid64}`;
        break;
      case 'existing':
        message = 'Esta conta Steam já estava associada.';
        break;
      default:
        message = response.message || 'Operação realizada com sucesso!';
    }

    this.snackBar.open(message, 'Fechar', { 
      duration: 5000,
      panelClass: ['success-snackbar']
    });
  }

  /**
   * Formata data para exibição
   */
  formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Data inválida';
    }
  }
}