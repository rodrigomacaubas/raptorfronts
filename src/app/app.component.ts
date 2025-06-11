// src/app/app.component.ts
import { Component, OnInit, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { KeycloakService } from 'keycloak-angular';
import { RouterModule } from '@angular/router';
import { filter, take } from 'rxjs/operators';

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  disabled?: boolean;
}

interface Currency {
  label: string;
  icon: string;
  value: string;
  class: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatToolbarModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    MatTooltipModule,
    RouterModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'raptorfrontend';
  isMinimized = signal(false);
  userProfile: any = {};
  private drawerOpen = signal(false);
  
  menuItems: MenuItem[] = [
    {
      label: 'Home',
      icon: 'home',
      children: [
        { label: 'Perfil', icon: 'person', route: '/profile' }
      ]
    },
    {
      label: 'Sistema de Slots',
      icon: 'casino',
      children: [
        { label: 'Slots Legacy', icon: 'gamepad', route: '/slotslegacy' },
        { label: 'Slots Evrima', icon: 'games', route: '/slotsevrima', disabled: true }
      ]
    },
    {
      label: 'Economia',
      icon: 'attach_money',
      children: [
        { label: 'Transferir', icon: 'send', route: '/transfer' },
        { label: 'Loja Legacy', icon: 'store', route: '/storelegacy' },
        { label: 'Loja Evrima', icon: 'storefront', route: '/storeevrima', disabled: true },
        { label: 'Extrato da Conta', icon: 'receipt', route: '/transactionhistory' }
      ]
    }
  ];

  currencies: Currency[] = [
    { label: 'Dinheiro Legacy', icon: 'monetization_on', value: '1,234', class: 'legacy-currency' },
    { label: 'Dinheiro Evrima', icon: 'account_balance_wallet', value: '5,678', class: 'evrima-currency' },
    { label: 'Pontos', icon: 'stars', value: '91', class: 'points-currency' }
  ];

  constructor(
    private keycloakService: KeycloakService,
    private router: Router
  ) {}

  async ngOnInit() {
    console.log('🚀 AppComponent inicializado');
    
    if (this.keycloakService.isLoggedIn()) {
      this.userProfile = await this.keycloakService.loadUserProfile();
      console.log('👤 Usuário logado:', this.userProfile.username);
    }
    
    // ✅ CORREÇÃO CRÍTICA: Aguardar navegação inicial completar
    // Evita interferir com steam-callback
    setTimeout(() => {
      const currentUrl = this.router.url;
      console.log('📍 Verificando rota após inicialização:', currentUrl);
      
      // Só redireciona para /home se realmente estiver na rota raiz
      // E NÃO for steam-callback ou outras rotas especiais
      if (currentUrl === '/' || currentUrl === '') {
        console.log('🏠 Redirecionando para /home (rota raiz)');
        this.router.navigate(['/home']);
      } else {
        console.log('🎯 Mantendo rota atual:', currentUrl);
      }
    }, 100); // Pequeno delay para permitir navegação inicial
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    // Handle window resize if needed
  }

  isMobile(): boolean {
    return window.innerWidth <= 768;
  }

  isDesktop(): boolean {
    return window.innerWidth > 768;
  }

  isDrawerOpen(): boolean {
    return this.drawerOpen();
  }

  shouldShowCurrenciesInSidebar(): boolean {
    return this.isMobile();
  }

  shouldShowCurrenciesInToolbar(): boolean {
    return !this.isMobile();
  }

  toggleSidebar() {
    if (this.isMobile()) {
      this.drawerOpen.update(value => !value);
    } else {
      this.isMinimized.update(value => !value);
    }
  }

  closeMobileDrawer() {
    if (this.isMobile()) {
      this.drawerOpen.set(false);
    }
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
    this.closeMobileDrawer();
  }

  getInitials(): string {
    const firstName = this.userProfile.firstName || '';
    const lastName = this.userProfile.lastName || '';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  }

  logout() {
    this.keycloakService.logout();
  }
}