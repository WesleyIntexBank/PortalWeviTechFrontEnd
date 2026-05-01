import { Component, inject, OnInit, signal } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { MenuService } from '../core/services/menu.service';
import { ThemeService } from '../core/services/theme.service';
import { Menu } from '../core/models/menu.model';

interface NavItem {
  id: number;
  title: string;
  icon: string;
  route: string;
  children?: NavItem[];
  expanded?: boolean;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  template: `
    <mat-sidenav-container class="sidenav-container">

      <!-- ─── Sidebar ─────────────────────────────────────────────────── -->
      <mat-sidenav #sidenav [mode]="isMobile() ? 'over' : 'side'" [opened]="sidenavOpen()" (openedChange)="sidenavOpen.set($event)" class="sidenav">

        <!-- Logo -->
        <div class="sidenav-header">
          <div class="logo-row">
            <img src="/assets/logo.png" alt="WeviTech" class="logo-img">
            <div class="logo-text">
              <span class="logo-wevi">Wevi</span><span class="logo-tech">Tech</span>
            </div>
          </div>
        </div>

        <!-- Perfil -->
        <div class="user-profile">
          <div class="avatar-circle">
            <img src="/assets/photo.jpg" alt="User">
          </div>
          <div class="user-info">
            <p class="name">WESLEY AZEVEDO BEZERRA</p>
            <p class="company">INTEX BANCO DE CAMBIO S.A</p>
          </div>
        </div>

        <!-- Navegação -->
        <div class="nav-wrapper">
          <p class="section-title">APLICAÇÕES</p>
          <nav class="sidebar-nav">
            @for (item of navItems(); track item.id) {
              @if (item.children && item.children.length > 0) {
                <div class="nav-group">
                  <div class="nav-item group-header" (click)="toggle(item)">
                    <i [class]="item.icon" class="nav-icon"></i>
                    <span class="nav-label">{{ item.title }}</span>
                    <mat-icon class="arrow">{{ item.expanded ? 'expand_less' : 'expand_more' }}</mat-icon>
                  </div>
                  @if (item.expanded) {
                    <div class="submenu">
                      @for (child of item.children; track child.id) {
                        <a [routerLink]="child.route" class="nav-item child" routerLinkActive="active-link">
                          <i class='bx bx-chevron-right child-icon'></i>
                          <span class="nav-label">{{ child.title }}</span>
                        </a>
                      }
                    </div>
                  }
                </div>
              } @else {
                <a [routerLink]="item.route" class="nav-item" routerLinkActive="active-link">
                  <i [class]="item.icon" class="nav-icon"></i>
                  <span class="nav-label">{{ item.title }}</span>
                </a>
              }
            }
          </nav>
        </div>

        <!-- Rodapé: tema + sair -->
        <div class="sidebar-footer">
          <button
            mat-icon-button
            class="theme-btn"
            [matTooltip]="themeService.isDark() ? 'Tema Claro' : 'Tema Escuro'"
            (click)="themeService.toggle()"
          >
            <mat-icon>{{ themeService.isDark() ? 'light_mode' : 'dark_mode' }}</mat-icon>
          </button>

          <button mat-button class="btn-sair">
            <mat-icon>logout</mat-icon>
            <span>Sair</span>
          </button>
        </div>
      </mat-sidenav>

      <!-- ─── Conteúdo ──────────────────────────────────────────────── -->
      <mat-sidenav-content class="content-wrapper">
        <mat-toolbar class="top-toolbar">
          @if (isMobile()) {
            <button mat-icon-button class="menu-toggle" (click)="sidenavOpen.set(!sidenavOpen())">
              <mat-icon>menu</mat-icon>
            </button>
          }
          <span class="toolbar-spacer"></span>
          <div class="toolbar-actions">
            <span class="clock">{{ clock() }}</span>
            <button
              mat-icon-button
              class="theme-toggle-toolbar"
              [matTooltip]="themeService.isDark() ? 'Tema Claro' : 'Tema Escuro'"
              (click)="themeService.toggle()"
            >
              <mat-icon>{{ themeService.isDark() ? 'light_mode' : 'dark_mode' }}</mat-icon>
            </button>
          </div>
        </mat-toolbar>

        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
      </mat-sidenav-content>

    </mat-sidenav-container>
  `,
  styles: [`
    /* ─── Container ───────────────────────────────────────────── */
    .sidenav-container { height: 100vh; }

    /* ─── Sidebar ─────────────────────────────────────────────── */
    .sidenav {
      width: 272px;
      background: #1C1F26;
      display: flex;
      flex-direction: column;
      border: none;
      border-right: 1px solid rgba(255,255,255,0.05);
    }

    /* Logo */
    .sidenav-header {
      background: #13161b;
      padding: 20px 0px 20px 20px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }

    .logo-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-img { height: 50px; }

    .logo-text {
      display: flex;
      align-items: baseline;
    }

    .logo-wevi {
      color: #e8eaf6;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.3px;
    }

    .logo-tech {
      color: #70c73c;
      font-size: 22px;
      font-weight: 700;
    }

    /* Perfil */
    .user-profile {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }

    .avatar-circle {
      width: 46px;
      height: 46px;
      border-radius: 50%;
      overflow: hidden;
      border: 2px solid #3d5afe;
      flex-shrink: 0;
    }

    .avatar-circle img { width: 100%; height: 100%; object-fit: cover; }

    .user-info { flex: 1; min-width: 0; }
    .name {
      font-weight: 600;
      font-size: 13px;
      color: #e8eaf6;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .company {
      font-size: 11px;
      color: rgba(255,255,255,0.45);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 2px;
    }

    /* Nav */
    .nav-wrapper { flex: 1; overflow-y: auto; padding: 8px 0; }

    .section-title {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 1.2px;
      color: rgba(255,255,255,0.3);
      padding: 8px 20px;
      margin: 0;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 11px 12px 11px 20px;
      margin: 1px 8px;
      border-radius: 8px;
      color: rgba(255,255,255,0.6);
      text-decoration: none;
      font-size: 14px;
      cursor: pointer;
      transition: background 0.2s, color 0.2s;
    }

    .nav-icon { font-size: 18px; width: 20px; text-align: center; flex-shrink: 0; }
    .child-icon { font-size: 14px; }
    .nav-label { flex: 1; }
    .arrow { margin-left: auto; font-size: 18px; color: rgba(255,255,255,0.3); }

    .nav-item:hover {
      background: rgba(255,255,255,0.06);
      color: #e8eaf6;
    }

    .active-link {
      background: #2a2e39;
      color: #e8eaf6;
      border-left: 3px solid #3d5afe;
      padding-left: 17px;
    }

    .submenu {
      background: rgba(0,0,0,0.15);
    }

    .nav-item.child {
      padding-left: 44px;
      font-size: 13px;
    }

    /* Footer */
    .sidebar-footer {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      border-top: 1px solid rgba(255,255,255,0.07);
      gap: 4px;
    }

    .theme-btn {
      color: rgba(255,255,255,0.5) !important;
      flex-shrink: 0;
      transition: color 0.2s;
    }

    .theme-btn:hover { color: #70c73c !important; }

    .btn-sair {
      color: rgba(255,255,255,0.5) !important;
      flex: 1;
      justify-content: flex-start;
      font-size: 14px;
      font-weight: 500;
      gap: 8px;
    }

    .btn-sair:hover { color: #ef9a9a !important; }

    /* ─── Toolbar ───────────────────────────────────────────────── */
    .content-wrapper { display: flex; flex-direction: column; }

    .top-toolbar {
      background: var(--toolbar);
      border-bottom: 1px solid var(--toolbar-border);
      min-height: 52px;
      box-shadow: var(--card-shadow);
      padding: 0 20px;
      transition: background 0.25s ease;
    }

    .toolbar-spacer { flex: 1; }

    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .clock {
      font-size: 14px;
      font-weight: 500;
      color: var(--body-label);
      font-variant-numeric: tabular-nums;
    }

    .theme-toggle-toolbar {
      color: var(--text-sec) !important;
      transition: color 0.2s;
    }

    .theme-toggle-toolbar:hover { color: var(--accent) !important; }

    /* ─── Main ──────────────────────────────────────────────────── */
    .main-content {
      background: var(--bg);
      flex: 1;
      padding: 20px;
      transition: background 0.25s ease;
      overflow-y: auto;
    }

    /* ─── Mobile ─────────────────────────────────────────────── */
    .menu-toggle {
      color: var(--text-sec) !important;
      margin-right: 4px;
      transition: color 0.2s;
    }

    .menu-toggle:hover { color: var(--accent) !important; }

    @media (max-width: 768px) {
      .main-content { padding: 12px; }
    }
  `]
})
export class LayoutComponent implements OnInit {
  private menuService = inject(MenuService);
  private breakpointObserver = inject(BreakpointObserver);
  themeService = inject(ThemeService);

  navItems = signal<NavItem[]>([]);
  clock = signal<string>('');
  isMobile = signal(false);
  sidenavOpen = signal(true);

  ngOnInit() {
    this.loadMenus();
    this.updateClock();
    setInterval(() => this.updateClock(), 1000);
    this.breakpointObserver.observe(['(max-width: 768px)']).subscribe(result => {
      this.isMobile.set(result.matches);
      this.sidenavOpen.set(!result.matches);
    });
  }

  private updateClock() {
    const now = new Date();
    this.clock.set(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
  }

  private loadMenus() {
    this.menuService.getAll().subscribe({
      next: (menus: any[]) => {
        const roots = menus.filter(m => m.menuId === 0);
        const navItems: NavItem[] = roots.map(root => ({
          id: root.id,
          title: root.title,
          icon: root.icon || 'bx bx-circle',
          route: root.url || '',
          expanded: false,
          children: menus
            .filter(child => child.menuId === root.id)
            .map(child => ({
              id: child.id,
              title: child.title,
              icon: child.icon || 'bx bx-chevron-right',
              route: child.url || ''
            }))
        }));
        this.navItems.set(navItems);
      }
    });
  }

  toggle(item: NavItem) {
    item.expanded = !item.expanded;
  }
}
