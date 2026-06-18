import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../core/services/profile.service';
import { MenuService } from '../../core/services/menu.service';
import { Profile } from '../../core/models/profile.model';
import { Menu } from '../../core/models/menu.model';

@Component({
  selector: 'app-profile-menus',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule, MatSelectModule,
    MatFormFieldModule, MatCardModule, MatCheckboxModule, MatSnackBarModule,
    MatProgressSpinnerModule, MatProgressBarModule, MatDividerModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <mat-icon>assignment</mat-icon>
        <h1>Perfil x Menu</h1>
        <span class="subtitle">Vincule menus aos perfis de acesso</span>
      </div>

      <div class="card-container">
        <div class="profile-selector">
          <mat-form-field appearance="outline" class="profile-field">
            <mat-label>Selecione o perfil</mat-label>
            <mat-icon matPrefix>manage_accounts</mat-icon>
            <mat-select [(ngModel)]="selectedProfileId" (ngModelChange)="onProfileChange($event)">
              @for (p of profiles(); track p.id) {
                <mat-option [value]="p.id">{{ p.description }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        @if (loadingMenus()) {
          <div class="loading-overlay"><mat-spinner diameter="48"></mat-spinner></div>
        } @else if (selectedProfileId) {
          @if (saving()) { <mat-progress-bar mode="indeterminate" style="margin-bottom: 16px"></mat-progress-bar> }

          <div class="menus-grid">
            @for (group of menuGroups(); track group.id) {
              <mat-card class="menu-group-card">
                <mat-card-header>
                  <mat-icon mat-card-avatar>{{ group.icon || 'folder' }}</mat-icon>
                  <mat-card-title>{{ group.title }}</mat-card-title>
                  <mat-card-subtitle>{{ group.children.length }} sub-menus</mat-card-subtitle>
                </mat-card-header>

                <mat-card-content>
                  <div class="menu-item">
                    <mat-checkbox
                      [checked]="isChecked(group.id!)"
                      (change)="toggle(group.id!, $event.checked)"
                      color="primary">
                      <div class="menu-item-content">
                        <mat-icon>{{ group.icon || 'circle' }}</mat-icon>
                        <span>{{ group.title }}</span>
                        <code class="route-mini">{{ group.url }}</code>
                      </div>
                    </mat-checkbox>
                  </div>

                  @if (group.children.length > 0) {
                    <mat-divider style="margin: 8px 0"></mat-divider>
                    @for (child of group.children; track child.id) {
                      <div class="menu-item child">
                        <mat-checkbox
                          [checked]="isChecked(child.id!)"
                          (change)="toggle(child.id!, $event.checked)"
                          color="primary">
                          <div class="menu-item-content">
                            <mat-icon>{{ child.icon || 'circle' }}</mat-icon>
                            <span>{{ child.title }}</span>
                            <code class="route-mini">{{ child.url }}</code>
                          </div>
                        </mat-checkbox>
                      </div>
                    }
                  }
                </mat-card-content>
              </mat-card>
            }

          </div>

          <div class="save-bar">
            <span class="selected-count">
              <mat-icon>check_circle</mat-icon>
              {{ selectedMenuIds().length }} menu(s) selecionado(s)
            </span>
            <button mat-flat-button color="primary" (click)="save()" [disabled]="saving()">
              <mat-icon>save</mat-icon> Salvar Configuração
            </button>
          </div>
        } @else {
          <div class="empty-state">
            <mat-icon>manage_accounts</mat-icon>
            <p>Selecione um perfil para gerenciar seus menus</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .profile-selector {
      margin-bottom: 24px;
    }

    .profile-field {
      min-width: 320px;
      width: 100%;
      max-width: 480px;
    }

    @media (max-width: 768px) {
      .profile-field { min-width: unset; max-width: 100%; }

      .save-bar {
        flex-direction: column;
        gap: 12px;
        align-items: stretch;

        button { width: 100%; }
      }
    }

    .menus-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .menu-group-card {
      border-radius: 8px !important;
      background: var(--surface) !important;
      border: 1px solid var(--border) !important;
      transition: background 0.25s, color 0.25s !important;
      color: var(--text) !important;
      --mat-card-title-text-color: var(--text);
      --mat-card-subtitle-text-color: var(--text-sec);
      --mat-checkbox-label-text-color: var(--text);
      mat-card-avatar { color: var(--text); background: var(--avatar-bg); border-radius: 8px; padding: 4px; }
    }

    .menu-item {
      padding: 6px 0;

      &.child {
        padding-left: 24px;
      }
    }

    .menu-item-content {
      display: flex;
      align-items: center;
      gap: 8px;

      span {
        color: var(--text);
      }

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: var(--label);
      }
    }

    .route-mini {
      font-size: 11px;
      color: var(--text-sec);
      background: var(--input-bg);
      padding: 1px 6px;
      border-radius: 4px;
      font-family: monospace;
      border: 1px solid var(--border);
      transition: background 0.25s, color 0.25s;
    }

    .save-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 0 0;
      border-top: 1px solid var(--border);
    }

    .selected-count {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--active-color);
      font-size: 14px;
      font-weight: 500;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
  `]
})
export class ProfileMenusComponent implements OnInit {
  private profileService = inject(ProfileService);
  private menuService    = inject(MenuService);
  private snackBar       = inject(MatSnackBar);

  profiles        = signal<Profile[]>([]);
  menuGroups      = signal<(Menu & { children: Menu[] })[]>([]);
  selectedMenuIds = signal<number[]>([]);
  loadingMenus    = signal(false);
  saving          = signal(false);
  selectedProfileId: number | null = null;

  ngOnInit() {
    // Carrega perfis (com profileMenus embutidos) e menus em paralelo
    this.profileService.getAll().subscribe(p => this.profiles.set(p));

    this.menuService.getAll().subscribe(menus => {
      const roots  = menus.filter(m => !m.isSubMenu);
      const groups = roots.map(r => ({
        ...r,
        children: menus.filter(c => c.isSubMenu && c.menuId === r.id)
      }));
      this.menuGroups.set(groups as (Menu & { children: Menu[] })[]);
    });
  }

  onProfileChange(profileId: number) {
    // Usa os profileMenus já carregados em getAll() — sem chamada extra ao backend
    const profile = this.profiles().find(p => p.id === profileId);
    const ids = (profile?.profileMenus ?? []).map(pm => pm.menuId);
    this.selectedMenuIds.set(ids);
  }

  isChecked(menuId: number): boolean {
    return this.selectedMenuIds().includes(menuId);
  }

  toggle(menuId: number, checked: boolean) {
    this.selectedMenuIds.update(ids =>
      checked ? [...ids, menuId] : ids.filter(id => id !== menuId)
    );
  }

  save() {
    if (!this.selectedProfileId) return;
    const profile = this.profiles().find(p => p.id === this.selectedProfileId);
    if (!profile) return;

    this.saving.set(true);

    const payload: Profile = {
      ...profile,
      profileMenus: this.selectedMenuIds().map(menuId => ({
        profileId: this.selectedProfileId!,
        menuId
      }))
    };

    this.profileService.update(payload).subscribe({
      next: () => {
        // Atualiza o cache local para que onProfileChange reflita a nova seleção
        this.profiles.update(list =>
          list.map(p => p.id === payload.id ? payload : p)
        );
        this.saving.set(false);
        this.snackBar.open('Configuração salva com sucesso!', 'OK', { duration: 3000 });
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Erro ao salvar configuração', 'OK', { duration: 3000 });
      }
    });
  }
}
