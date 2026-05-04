import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // 2. Rota de Login (fora do Layout)
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    component: LayoutComponent,
    children: [

      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'user',
        loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profiles/profiles.component').then(m => m.ProfilesComponent)
      },
      {
        path: 'enterprise',
        loadComponent: () => import('./features/enterprise/enterprise.component').then(m => m.EnterpriseComponent)
      },
      {
        path: 'menu',
        loadComponent: () => import('./features/menus/menus.component').then(m => m.MenusComponent)
      },
      {
        path: 'profile-menus',
        loadComponent: () => import('./features/profile-menus/profile-menus.component').then(m => m.ProfileMenusComponent)
      }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
