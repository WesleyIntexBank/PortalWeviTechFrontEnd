import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { UserService } from '../../core/services/user.service';
import { ProfileService } from '../../core/services/profile.service';
import { EnterpriseService } from '../../core/services/enterprise.service';
import { MenuService } from '../../core/services/menu.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatCardModule, MatButtonModule, RouterLink],
  template: `
    <div class="page-container">
      <div class="page-header">
        <mat-icon>dashboard</mat-icon>
        <h1>Dashboard</h1>
      </div>

      <div class="summary-cards">
        <div class="summary-card primary">
          <div class="icon-wrapper primary">
            <mat-icon>people</mat-icon>
          </div>
          <div class="info">
            <h3>{{ stats().users }}</h3>
            <p>Usuários</p>
          </div>
        </div>

        <div class="summary-card accent">
          <div class="icon-wrapper accent">
            <mat-icon>manage_accounts</mat-icon>
          </div>
          <div class="info">
            <h3>{{ stats().profiles }}</h3>
            <p>Perfis</p>
          </div>
        </div>

        <div class="summary-card success">
          <div class="icon-wrapper success">
            <mat-icon>business</mat-icon>
          </div>
          <div class="info">
            <h3>{{ stats().enterprises }}</h3>
            <p>Parceiros</p>
          </div>
        </div>

        <div class="summary-card warning">
          <div class="icon-wrapper warning">
            <mat-icon>menu_open</mat-icon>
          </div>
          <div class="info">
            <h3>{{ stats().menus }}</h3>
            <p>Menus</p>
          </div>
        </div>
      </div>

      <div class="quick-grid">
        <div class="quick-card" routerLink="/users">
          <div class="quick-icon" style="background: var(--quick-people-bg)">
            <mat-icon [style.color]="'var(--quick-people-icon)'">people</mat-icon>
          </div>
          <h3>Gerenciar Usuários</h3>
          <p>Crie, edite e gerencie os usuários do sistema</p>
        </div>

        <div class="quick-card" routerLink="/profiles">
          <div class="quick-icon" style="background: var(--quick-profiles-bg)">
            <mat-icon [style.color]="'var(--quick-profiles-icon)'">manage_accounts</mat-icon>
          </div>
          <h3>Perfis de Acesso</h3>
          <p>Configure perfis e permissões de acesso ao portal</p>
        </div>

        <div class="quick-card" routerLink="/enterprise">
          <div class="quick-icon" style="background: var(--quick-enterprise-bg)">
            <mat-icon [style.color]="'var(--quick-enterprise-icon)'">business</mat-icon>
          </div>
          <h3>Parceiros</h3>
          <p>Gerencie os parceiros e empresas cadastrados</p>
        </div>

        <div class="quick-card" routerLink="/profile-menus">
          <div class="quick-icon" style="background: var(--quick-menus-bg)">
            <mat-icon [style.color]="'var(--quick-menus-icon)'">assignment</mat-icon>
          </div>
          <h3>Perfil x Menu</h3>
          <p>Vincule menus aos perfis de acesso do sistema</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .quick-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }

    .quick-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      cursor: pointer;
      transition: box-shadow 0.2s, transform 0.2s, background 0.25s, border-color 0.2s;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .quick-card:hover {
      box-shadow: var(--card-shadow);
      transform: translateY(-2px);
      border-color: rgba(112, 199, 60, 0.3);
    }

    .quick-card h3 {
      font-size: 16px;
      font-weight: 600;
      color: var(--text);
      margin: 0;
    }

    .quick-card p {
      font-size: 13px;
      color: var(--text-sec);
      margin: 0;
    }

    .quick-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 4px;
      transition: background 0.25s;

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private userService = inject(UserService);
  private profileService = inject(ProfileService);
  private enterpriseService = inject(EnterpriseService);
  private menuService = inject(MenuService);

  stats = signal({ users: 0, profiles: 0, enterprises: 0, menus: 0 });

  ngOnInit() {
    forkJoin({
      users: this.userService.getAll(),
      profiles: this.profileService.getAll(),
      enterprises: this.enterpriseService.getAll(),
      menus: this.menuService.getAll(),
    }).subscribe({
      next: ({ users, profiles, enterprises, menus }) => {
        this.stats.set({
          users: users.length,
          profiles: profiles.length,
          enterprises: enterprises.length,
          menus: menus.length,
        });
      },
      error: () => {}
    });
  }
}
