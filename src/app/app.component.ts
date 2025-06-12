import { Component, OnInit, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
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

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  disabled?: boolean;
}

interface Currency {
  icon: string;
  value: number;
  label: string;
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
  isMobile = signal(false);
  isDrawerOpen = signal(false);
  userProfile: any = {};
  
  currencies: Currency[] = [
    { icon: 'toll', value: 1234, label: 'NP', class: 'np' },
    { icon: 'favorite', value: 5, label: 'Vidas', class: 'vidas' },
    { icon: 'science', value: 89, label: 'DNA', class: 'dna' }
  ];
  
  menuItems: MenuItem[] = [
    {
      label: 'Home',
      icon: 'home',
      children: [
        { label: 'Perfil', icon: 'person', route: '/profile' }
      ]
    },
    {
      label: 'Steam',
      icon: 'videogame_asset',
      children: [
        { label: 'Associar Conta', icon: 'link', route: '/steam-association' }
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

  constructor(
    private keycloakService: KeycloakService,
    private router: Router
  ) {
    this.checkScreenSize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    this.isMobile.set(window.innerWidth <= 768);
    if (this.isMobile()) {
      this.isDrawerOpen.set(false);
    }
  }

  async ngOnInit() {
    if (this.keycloakService.isLoggedIn()) {
      this.userProfile = await this.keycloakService.loadUserProfile();
    }
    this.router.navigate(['/home']);
  }

  toggleSidebar() {
    if (this.isMobile()) {
      this.isDrawerOpen.update(value => !value);
    } else {
      this.isMinimized.update(value => !value);
    }
  }

  closeMobileDrawer() {
    if (this.isMobile()) {
      this.isDrawerOpen.set(false);
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

  shouldShowCurrenciesInToolbar(): boolean {
    return !this.isMobile(); // Sempre mostra no desktop, nunca no mobile
  }
  
  shouldShowCurrenciesInSidebar(): boolean {
    return this.isMobile(); // Mostra na sidebar apenas no mobile
  }
  
  isDesktop(): boolean {
    return !this.isMobile();
  }
}