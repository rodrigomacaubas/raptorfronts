import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { SteamService, UserSteamID } from '../../../services/steam-auth.service';

@Component({
  selector: 'app-steam-profile-widget',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatButtonModule, 
    MatIconModule, MatListModule, MatChipsModule, 
    MatProgressSpinnerModule, MatSnackBarModule
  ],
  template: `
    <mat-card class="steam-widget">
      <mat-card-header>
        <mat-icon mat-card-avatar>videogame_asset</mat-icon>
        <mat-card-title>Contas Steam</mat-card-title>
        <mat-card-subtitle>{{ getSubtitle() }}</mat-card-subtitle>
      </mat-card-header>
      
      <mat-card-content>
        <!-- Loading state -->
        <div *ngIf="isLoading" class="loading-state">
          <mat-progress-spinner mode="indeterminate" diameter="32"></mat-progress-spinner>
          <span>Carregando...</span>
        </div>

        <!-- No accounts associated -->
        <div *ngIf="!isLoading && steamIds.length === 0" class="empty-state">
          <mat-icon>steam</mat-icon>
          <span>Nenhuma conta Steam associada</span>
        </div>

        <!-- Steam accounts list -->
        <div *ngIf="!isLoading && steamIds.length > 0" class="steam-accounts">
          <div *ngFor="let steamId of steamIds; trackBy: trackBySteamId" class="steam-account-item">
            <div class="account-info">
              <span class="steam-id">{{ formatSteamId(steamId.steamid64) }}</span>
              <mat-chip *ngIf="steamId.is_default" class="default-chip">Padrão</mat-chip>
            </div>
            <span class="account-date">{{ formatDate(steamId.linked_at) }}</span>
          </div>
        </div>

        <!-- Error state -->
        <div *ngIf="error" class="error-state">
          <mat-icon>error</mat-icon>
          <span>Erro ao carregar contas Steam</span>
          <p class="error-details">{{ errorMessage }}</p>
        </div>
      </mat-card-content>
      
      <mat-card-actions>
        <button mat-button routerLink="/steam-association">
          <mat-icon>{{ steamIds.length > 0 ? 'settings' : 'add' }}</mat-icon>
          {{ steamIds.length > 0 ? 'Gerenciar' : 'Associar' }}
        </button>
        <button 
          *ngIf="steamIds.length > 0" 
          mat-button 
          (click)="refresh()"
          [disabled]="isLoading">
          <mat-icon>refresh</mat-icon>
          Atualizar
        </button>
        <button 
          mat-button 
          color="warn"
          routerLink="/debug-auth">
          <mat-icon>bug_report</mat-icon>
          Debug
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .steam-widget {
      width: 100%;
    }
    
    .loading-state {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 0;
      color: #666;
    }
    
    .empty-state {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 0;
      color: #999;
    }
    
    .empty-state mat-icon {
      color: #ccc;
    }
    
    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 16px 0;
      color: #f44336;
      text-align: center;
    }
    
    .error-details {
      font-size: 12px;
      opacity: 0.8;
      margin: 0;
    }
    
    .steam-accounts {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .steam-account-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    
    .steam-account-item:last-child {
      border-bottom: none;
    }
    
    .account-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .steam-id {
      font-family: 'Courier New', monospace;
      font-size: 13px;
      font-weight: 500;
      color: #1976d2;
    }
    
    .default-chip {
      background-color: #ffd700;
      color: #333;
      font-size: 10px;
      font-weight: 500;
      height: 20px;
      line-height: 20px;
    }
    
    .account-date {
      font-size: 11px;
      color: #999;
    }
    
    @media (max-width: 600px) {
      .steam-id {
        font-size: 12px;
      }
      
      .account-date {
        font-size: 10px;
      }
    }
  `]
})
export class SteamProfileWidgetComponent implements OnInit, OnDestroy {
  steamIds: UserSteamID[] = [];
  isLoading = false;
  error = false;
  errorMessage = '';
  
  private subscriptions = new Subscription();

  constructor(
    private steamService: SteamService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadSteamIds();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  /**
   * Carrega os SteamIDs do usuário
   */
  loadSteamIds() {
    this.isLoading = true;
    this.error = false;
    this.errorMessage = '';

    const sub = this.steamService.getUserSteamIDs().subscribe({
      next: (steamIds) => {
        console.log('✅ SteamIDs carregados:', steamIds);
        this.steamIds = steamIds;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Erro ao carregar SteamIDs:', error);
        this.error = true;
        this.isLoading = false;
        
        // Melhora a mensagem de erro para o usuário
        if (error.status === 401) {
          this.errorMessage = 'Sessão expirada. Faça login novamente.';
        } else if (error.status === 0) {
          this.errorMessage = 'Erro de conexão. Verifique sua internet.';
        } else {
          this.errorMessage = error.error?.message || error.message || 'Erro desconhecido';
        }
      }
    });

    this.subscriptions.add(sub);
  }

  /**
   * Atualiza a lista de SteamIDs
   */
  refresh() {
    this.loadSteamIds();
    this.snackBar.open('Lista atualizada', 'Fechar', { duration: 2000 });
  }

  /**
   * Retorna o subtítulo baseado no número de contas
   */
  getSubtitle(): string {
    if (this.isLoading) return 'Carregando...';
    if (this.error) return 'Erro ao carregar';
    
    const count = this.steamIds.length;
    if (count === 0) return 'Nenhuma conta associada';
    if (count === 1) return '1 conta associada';
    return `${count} contas associadas`;
  }

  /**
   * Formata SteamID para exibição (mostra apenas parte do ID)
   */
  formatSteamId(steamId: string): string {
    if (steamId.length > 12) {
      return steamId.substring(0, 8) + '...' + steamId.substring(steamId.length - 4);
    }
    return steamId;
  }

  /**
   * Formata data de forma compacta
   */
  formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      });
    } catch {
      return 'Data inválida';
    }
  }

  /**
   * TrackBy function para otimizar renderização
   */
  trackBySteamId(index: number, item: UserSteamID): string {
    return item.steamid64;
  }
}