import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  {
    path: 'home',
    loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'steam-association',
    loadComponent: () => import('./components/steam-association/steam-association.component').then(m => m.SteamAssociationComponent)
  },
  {
    path: 'slotslegacy',
    loadComponent: () => import('./components/slots/slots-legacy/slots-legacy.component').then(m => m.SlotsLegacyComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'slotsevrima',
    loadComponent: () => import('./components/slots/slots-evrima/slots-evrima.component').then(m => m.SlotsEvrimaComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'transfer',
    loadComponent: () => import('./components/economy/transfer/transfer.component').then(m => m.TransferComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'storelegacy',
    loadComponent: () => import('./components/economy/store-legacy/store-legacy.component').then(m => m.StoreLegacyComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'storeevrima',
    loadComponent: () => import('./components/economy/store-evrima/store-evrima.component').then(m => m.StoreEvrimaComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'transactionhistory',
    loadComponent: () => import('./components/economy/transaction-history/transaction-history.component').then(m => m.TransactionHistoryComponent),
    canActivate: [AuthGuard]
  }
];