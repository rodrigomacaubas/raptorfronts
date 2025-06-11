// src/app/components/profile/profile.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { KeycloakService } from 'keycloak-angular';
import { SteamAuthService } from '../../../services/steam-auth.service';

interface UserAddress {
  id?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state?: string;
  postal_code?: string;
  country?: string;
  is_active: boolean;
}

interface UserPhone {
  id?: string;
  phone_number: string;
  phone_type?: string;
  is_active: boolean;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatCardModule, 
    MatIconModule, 
    MatButtonModule, 
    MatListModule, 
    MatTabsModule, 
    MatFormFieldModule,
    MatInputModule, 
    MatSelectModule, 
    MatDialogModule, 
    MatSnackBarModule,
    MatTableModule, 
    MatChipsModule
  ],
  template: `
    <div class="profile-container">
      <h1>Perfil do Usuário</h1>
      
      <mat-tab-group class="profile-tabs">
        <!-- Tab Dados Básicos -->
        <mat-tab label="Dados Básicos">
          <div class="tab-content">
            <mat-card class="profile-card">
              <mat-card-header>
                <div mat-card-avatar class="profile-avatar">
                  {{ getInitials() }}
                </div>
                <mat-card-title>{{ userProfile.firstName }} {{ userProfile.lastName }}</mat-card-title>
                <mat-card-subtitle>{{ userProfile.email }}</mat-card-subtitle>
              </mat-card-header>
              
              <mat-card-content>
                <mat-list>
                  <mat-list-item>
                    <mat-icon matListItemIcon>person</mat-icon>
                    <div matListItemTitle>Nome de usuário</div>
                    <div matListItemLine>{{ userProfile.username }}</div>
                  </mat-list-item>
                  
                  <mat-list-item>
                    <mat-icon matListItemIcon>email</mat-icon>
                    <div matListItemTitle>Email</div>
                    <div matListItemLine>{{ userProfile.email }}</div>
                  </mat-list-item>
                  
                  <mat-list-item>
                    <mat-icon matListItemIcon>verified</mat-icon>
                    <div matListItemTitle>Email verificado</div>
                    <div matListItemLine>{{ userProfile.emailVerified ? 'Sim' : 'Não' }}</div>
                  </mat-list-item>
                </mat-list>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Tab Steam -->
        <mat-tab label="Steam">
          <div class="tab-content">
            <mat-card class="steam-card">
              <mat-card-header>
                <mat-icon mat-card-avatar class="steam-avatar">sports_esports</mat-icon>
                <mat-card-title>Steam Integration</mat-card-title>
                <mat-card-subtitle>Conecte sua conta Steam</mat-card-subtitle>
              </mat-card-header>
              
              <mat-card-content>
                <p class="steam-description">
                  Conecte sua conta Steam para acessar recursos do jogo e sincronizar dados.
                </p>
                
                <div class="steam-status" *ngIf="!connectingSteam">
                  <mat-icon class="status-icon">info</mat-icon>
                  <span>Nenhuma conta Steam conectada</span>
                </div>
                
                <div class="steam-status connecting" *ngIf="connectingSteam">
                  <mat-icon class="status-icon loading">sync</mat-icon>
                  <span>Conectando com Steam...</span>
                </div>
              </mat-card-content>
              
              <mat-card-actions>
                <button mat-raised-button 
                        class="steam-connect-btn"
                        (click)="connectSteam()" 
                        [disabled]="connectingSteam">
                  <mat-icon>{{ connectingSteam ? 'sync' : 'link' }}</mat-icon>
                  {{ connectingSteam ? 'Conectando...' : 'Conectar Steam' }}
                </button>
                
                <button mat-button color="primary">
                  <mat-icon>help</mat-icon>
                  Como funciona?
                </button>
              </mat-card-actions>
            </mat-card>
            
            <!-- Informações sobre Steam -->
            <mat-card class="info-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>info</mat-icon>
                <mat-card-title>Sobre a Integração Steam</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <ul>
                  <li>Conecte sua conta Steam de forma segura via OpenID</li>
                  <li>Sincronize automaticamente dados do jogo</li>
                  <li>Acesse recursos exclusivos para jogadores</li>
                  <li>Você pode desconectar a qualquer momento</li>
                </ul>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Tab Endereços -->
        <mat-tab label="Endereços">
          <div class="tab-content">
            <div class="section-header">
              <h2>Meus Endereços</h2>
              <button mat-raised-button color="primary" (click)="addAddress()">
                <mat-icon>add</mat-icon>
                Adicionar Endereço
              </button>
            </div>

            <div class="addresses-grid" *ngIf="addresses.length > 0; else noAddresses">
              <mat-card *ngFor="let address of addresses; trackBy: trackByAddressId" class="address-card">
                <mat-card-header>
                  <mat-icon mat-card-avatar>location_on</mat-icon>
                  <mat-card-title>{{ address.address_line1 }}</mat-card-title>
                  <mat-card-subtitle>{{ address.city }}, {{ address.state }}</mat-card-subtitle>
                </mat-card-header>
                
                <mat-card-content>
                  <div class="address-details">
                    <p><strong>Endereço:</strong> {{ address.address_line1 }}</p>
                    <p *ngIf="address.address_line2"><strong>Complemento:</strong> {{ address.address_line2 }}</p>
                    <p><strong>Cidade:</strong> {{ address.city }}</p>
                    <p *ngIf="address.state"><strong>Estado:</strong> {{ address.state }}</p>
                    <p *ngIf="address.postal_code"><strong>CEP:</strong> {{ address.postal_code }}</p>
                    <p *ngIf="address.country"><strong>País:</strong> {{ address.country }}</p>
                  </div>
                  <mat-chip [class]="address.is_active ? 'active-chip' : 'inactive-chip'">
                    {{ address.is_active ? 'Ativo' : 'Inativo' }}
                  </mat-chip>
                </mat-card-content>
                
                <mat-card-actions>
                  <button mat-button (click)="editAddress(address)">
                    <mat-icon>edit</mat-icon>
                    Editar
                  </button>
                  <button mat-button color="warn" (click)="deleteAddress(address.id!)">
                    <mat-icon>delete</mat-icon>
                    Excluir
                  </button>
                </mat-card-actions>
              </mat-card>
            </div>

            <ng-template #noAddresses>
              <div class="empty-state">
                <mat-icon>location_off</mat-icon>
                <h3>Nenhum endereço cadastrado</h3>
                <p>Adicione seu primeiro endereço clicando no botão acima.</p>
              </div>
            </ng-template>

            <!-- Formulário de Endereço -->
            <mat-card *ngIf="showAddressForm" class="form-card">
              <mat-card-header>
                <mat-card-title>{{ editingAddress ? 'Editar' : 'Adicionar' }} Endereço</mat-card-title>
              </mat-card-header>
              
              <mat-card-content>
                <form [formGroup]="addressForm" class="address-form">
                  <mat-form-field appearance="outline">
                    <mat-label>Endereço *</mat-label>
                    <input matInput formControlName="address_line1" placeholder="Rua, número">
                    <mat-error *ngIf="addressForm.get('address_line1')?.hasError('required')">
                      Endereço é obrigatório
                    </mat-error>
                  </mat-form-field>
                  
                  <mat-form-field appearance="outline">
                    <mat-label>Complemento</mat-label>
                    <input matInput formControlName="address_line2" placeholder="Apartamento, bloco, etc.">
                  </mat-form-field>
                  
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Cidade *</mat-label>
                      <input matInput formControlName="city">
                      <mat-error *ngIf="addressForm.get('city')?.hasError('required')">
                        Cidade é obrigatória
                      </mat-error>
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline">
                      <mat-label>Estado</mat-label>
                      <input matInput formControlName="state">
                    </mat-form-field>
                  </div>
                  
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>CEP</mat-label>
                      <input matInput formControlName="postal_code">
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline">
                      <mat-label>País</mat-label>
                      <input matInput formControlName="country">
                    </mat-form-field>
                  </div>
                </form>
              </mat-card-content>
              
              <mat-card-actions>
                <button mat-raised-button color="primary" (click)="saveAddress()" [disabled]="addressForm.invalid">
                  <mat-icon>save</mat-icon>
                  {{ editingAddress ? 'Atualizar' : 'Salvar' }}
                </button>
                <button mat-button (click)="cancelAddressForm()">Cancelar</button>
              </mat-card-actions>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Tab Telefones -->
        <mat-tab label="Telefones">
          <div class="tab-content">
            <div class="section-header">
              <h2>Meus Telefones</h2>
              <button mat-raised-button color="primary" (click)="addPhone()">
                <mat-icon>add</mat-icon>
                Adicionar Telefone
              </button>
            </div>

            <div class="phones-grid" *ngIf="phones.length > 0; else noPhones">
              <mat-card *ngFor="let phone of phones; trackBy: trackByPhoneId" class="phone-card">
                <mat-card-header>
                  <mat-icon mat-card-avatar>{{ getPhoneIcon(phone.phone_type) }}</mat-icon>
                  <mat-card-title>{{ phone.phone_number }}</mat-card-title>
                  <mat-card-subtitle>{{ getPhoneTypeLabel(phone.phone_type) }}</mat-card-subtitle>
                </mat-card-header>
                
                <mat-card-content>
                  <mat-chip [class]="phone.is_active ? 'active-chip' : 'inactive-chip'">
                    {{ phone.is_active ? 'Ativo' : 'Inativo' }}
                  </mat-chip>
                </mat-card-content>
                
                <mat-card-actions>
                  <button mat-button (click)="editPhone(phone)">
                    <mat-icon>edit</mat-icon>
                    Editar
                  </button>
                  <button mat-button color="warn" (click)="deletePhone(phone.id!)">
                    <mat-icon>delete</mat-icon>
                    Excluir
                  </button>
                </mat-card-actions>
              </mat-card>
            </div>

            <ng-template #noPhones>
              <div class="empty-state">
                <mat-icon>phone_disabled</mat-icon>
                <h3>Nenhum telefone cadastrado</h3>
                <p>Adicione seu primeiro telefone clicando no botão acima.</p>
              </div>
            </ng-template>

            <!-- Formulário de Telefone -->
            <mat-card *ngIf="showPhoneForm" class="form-card">
              <mat-card-header>
                <mat-card-title>{{ editingPhone ? 'Editar' : 'Adicionar' }} Telefone</mat-card-title>
              </mat-card-header>
              
              <mat-card-content>
                <form [formGroup]="phoneForm" class="phone-form">
                  <mat-form-field appearance="outline">
                    <mat-label>Número do Telefone *</mat-label>
                    <input matInput formControlName="phone_number" placeholder="(11) 99999-9999">
                    <mat-error *ngIf="phoneForm.get('phone_number')?.hasError('required')">
                      Número é obrigatório
                    </mat-error>
                  </mat-form-field>
                  
                  <mat-form-field appearance="outline">
                    <mat-label>Tipo</mat-label>
                    <mat-select formControlName="phone_type">
                      <mat-option value="mobile">Celular</mat-option>
                      <mat-option value="home">Residencial</mat-option>
                      <mat-option value="work">Comercial</mat-option>
                    </mat-select>
                  </mat-form-field>
                </form>
              </mat-card-content>
              
              <mat-card-actions>
                <button mat-raised-button color="primary" (click)="savePhone()" [disabled]="phoneForm.invalid">
                  <mat-icon>save</mat-icon>
                  {{ editingPhone ? 'Atualizar' : 'Salvar' }}
                </button>
                <button mat-button (click)="cancelPhoneForm()">Cancelar</button>
              </mat-card-actions>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .profile-container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .profile-tabs {
      margin-top: 24px;
    }
    
    .tab-content {
      padding: 24px 0;
    }
    
    .profile-card {
      margin-bottom: 24px;
    }
    
    .profile-avatar {
      background: linear-gradient(45deg, #ff6600, #b71c1c);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 500;
      width: 40px;
      height: 40px;
      border-radius: 50%;
    }
    
    /* Estilos Steam */
    .steam-card {
      background: linear-gradient(135deg, #1b2838, #2a475e);
      color: white;
      margin-bottom: 24px;
    }
    
    .steam-card mat-card-title {
      color: white;
    }
    
    .steam-card mat-card-subtitle {
      color: #c7d5e0;
    }
    
    .steam-avatar {
      background: #66c0f4;
      color: #1b2838;
    }
    
    .steam-description {
      color: #c7d5e0;
      margin-bottom: 16px;
    }
    
    .steam-status {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      margin-bottom: 16px;
    }
    
    .steam-status.connecting {
      background: rgba(102, 192, 244, 0.2);
    }
    
    .status-icon {
      color: #c7d5e0;
    }
    
    .status-icon.loading {
      animation: spin 1s linear infinite;
      color: #66c0f4;
    }
    
    .steam-connect-btn {
      background: #66c0f4;
      color: #1b2838;
    }
    
    .steam-connect-btn:hover {
      background: #4a9eff;
    }
    
    .info-card {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
    }
    
    .info-card ul {
      margin: 0;
      padding-left: 20px;
    }
    
    .info-card li {
      margin: 8px 0;
      color: #666;
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    h1 {
      background: linear-gradient(45deg, #ff6600, #b71c1c);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 24px;
    }
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    
    .section-header h2 {
      margin: 0;
      color: #333;
    }
    
    .addresses-grid, .phones-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    
    .address-card, .phone-card {
      height: fit-content;
    }
    
    .address-details p {
      margin: 4px 0;
      font-size: 14px;
    }
    
    .form-card {
      margin-top: 24px;
    }
    
    .address-form, .phone-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .form-row {
      display: flex;
      gap: 16px;
    }
    
    .form-row mat-form-field {
      flex: 1;
    }
    
    .empty-state {
      text-align: center;
      padding: 48px;
      color: #666;
    }
    
    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #ccc;
      margin-bottom: 16px;
    }
    
    .active-chip {
      background-color: #e8f5e8;
      color: #2e7d32;
    }
    
    .inactive-chip {
      background-color: #ffebee;
      color: #c62828;
    }
    
    @media (max-width: 768px) {
      .section-header {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
      }
      
      .addresses-grid, .phones-grid {
        grid-template-columns: 1fr;
        gap: 12px;
      }
      
      .form-row {
        flex-direction: column;
      }

      .tab-content {
        padding: 16px 0;
      }

      .profile-card, .steam-card {
        margin-bottom: 16px;
      }
    }

    @media (max-width: 600px) {
      h1 {
        font-size: 24px;
        margin-bottom: 16px;
      }

      .section-header h2 {
        font-size: 18px;
      }

      .tab-content {
        padding: 16px 0;
      }

      .addresses-grid, .phones-grid {
        gap: 12px;
      }
    }
  `]
})
export class ProfileComponent implements OnInit {
  userProfile: any = {};
  connectingSteam = false;
  
  addresses: UserAddress[] = [
    {
      id: '1',
      address_line1: 'Rua das Flores, 123',
      address_line2: 'Apto 45',
      city: 'São Paulo',
      state: 'SP',
      postal_code: '01234-567',
      country: 'Brasil',
      is_active: true
    }
  ];
  
  phones: UserPhone[] = [
    {
      id: '1',
      phone_number: '(11) 99999-9999',
      phone_type: 'mobile',
      is_active: true
    }
  ];
  
  addressForm: FormGroup;
  phoneForm: FormGroup;
  
  showAddressForm = false;
  showPhoneForm = false;
  editingAddress: UserAddress | null = null;
  editingPhone: UserPhone | null = null;

  constructor(
    private keycloakService: KeycloakService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private steamAuthService: SteamAuthService
  ) {
    this.addressForm = this.fb.group({
      address_line1: ['', Validators.required],
      address_line2: [''],
      city: ['', Validators.required],
      state: [''],
      postal_code: [''],
      country: ['']
    });

    this.phoneForm = this.fb.group({
      phone_number: ['', Validators.required],
      phone_type: ['mobile']
    });
  }

  async ngOnInit() {
    if (this.keycloakService.isLoggedIn()) {
      this.userProfile = await this.keycloakService.loadUserProfile();
    }
  }

  getInitials(): string {
    const firstName = this.userProfile.firstName || '';
    const lastName = this.userProfile.lastName || '';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  }

  // Steam Methods
  async connectSteam() {
    if (this.connectingSteam) return;
    
    try {
      this.connectingSteam = true;
      console.log('🚀 Iniciando conexão Steam...');
      
      await this.steamAuthService.startSteamLogin();
      
    } catch (error: any) {
      this.connectingSteam = false;
      console.error('❌ Erro ao conectar Steam:', error);
      
      this.snackBar.open(error.message || 'Erro ao conectar Steam', 'Fechar', {
        duration: 5000
      });
    }
  }

  // Address Methods
  addAddress() {
    this.editingAddress = null;
    this.addressForm.reset();
    this.showAddressForm = true;
  }

  editAddress(address: UserAddress) {
    this.editingAddress = address;
    this.addressForm.patchValue(address);
    this.showAddressForm = true;
  }

  saveAddress() {
    if (this.addressForm.valid) {
      const addressData = { ...this.addressForm.value, is_active: true };
      
      if (this.editingAddress) {
        const index = this.addresses.findIndex(a => a.id === this.editingAddress!.id);
        this.addresses[index] = { ...this.editingAddress, ...addressData };
        this.snackBar.open('Endereço atualizado com sucesso!', 'Fechar', { duration: 3000 });
      } else {
        const newAddress = { ...addressData, id: Date.now().toString() };
        this.addresses.push(newAddress);
        this.snackBar.open('Endereço adicionado com sucesso!', 'Fechar', { duration: 3000 });
      }
      
      this.cancelAddressForm();
    }
  }

  deleteAddress(id: string) {
    if (confirm('Tem certeza que deseja excluir este endereço?')) {
      this.addresses = this.addresses.filter(a => a.id !== id);
      this.snackBar.open('Endereço excluído com sucesso!', 'Fechar', { duration: 3000 });
    }
  }

  cancelAddressForm() {
    this.showAddressForm = false;
    this.editingAddress = null;
    this.addressForm.reset();
  }

  // Phone Methods
  addPhone() {
    this.editingPhone = null;
    this.phoneForm.reset({ phone_type: 'mobile' });
    this.showPhoneForm = true;
  }

  editPhone(phone: UserPhone) {
    this.editingPhone = phone;
    this.phoneForm.patchValue(phone);
    this.showPhoneForm = true;
  }

  savePhone() {
    if (this.phoneForm.valid) {
      const phoneData = { ...this.phoneForm.value, is_active: true };
      
      if (this.editingPhone) {
        const index = this.phones.findIndex(p => p.id === this.editingPhone!.id);
        this.phones[index] = { ...this.editingPhone, ...phoneData };
        this.snackBar.open('Telefone atualizado com sucesso!', 'Fechar', { duration: 3000 });
      } else {
        const newPhone = { ...phoneData, id: Date.now().toString() };
        this.phones.push(newPhone);
        this.snackBar.open('Telefone adicionado com sucesso!', 'Fechar', { duration: 3000 });
      }
      
      this.cancelPhoneForm();
    }
  }

  deletePhone(id: string) {
    if (confirm('Tem certeza que deseja excluir este telefone?')) {
      this.phones = this.phones.filter(p => p.id !== id);
      this.snackBar.open('Telefone excluído com sucesso!', 'Fechar', { duration: 3000 });
    }
  }

  cancelPhoneForm() {
    this.showPhoneForm = false;
    this.editingPhone = null;
    this.phoneForm.reset({ phone_type: 'mobile' });
  }

  // Utility Methods
  getPhoneIcon(type: string | undefined): string {
    switch (type) {
      case 'mobile': return 'smartphone';
      case 'home': return 'home';
      case 'work': return 'business';
      default: return 'phone';
    }
  }

  getPhoneTypeLabel(type: string | undefined): string {
    switch (type) {
      case 'mobile': return 'Celular';
      case 'home': return 'Residencial';
      case 'work': return 'Comercial';
      default: return 'Telefone';
    }
  }

  trackByAddressId(index: number, address: UserAddress): string {
    return address.id || index.toString();
  }

  trackByPhoneId(index: number, phone: UserPhone): string {
    return phone.id || index.toString();
  }
}