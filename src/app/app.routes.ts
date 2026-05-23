import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { authGuard } from './core/guards/auth.guard';

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
    canActivate: [authGuard],
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
      },
      {
        path: 'ai-chat',
        loadComponent: () => import('./features/ai-chat/ai-chat.component').then(m => m.AiChatComponent)
      },
      {
        path: 'api-tester',
        loadComponent: () => import('./features/api-tester/api-tester.component').then(m => m.ApiTesterComponent)
      },
      {
        path: 'cpf-consulta',
        loadComponent: () => import('./features/cpf-consulta/cpf-consulta.component').then(m => m.CpfConsultaComponent)
      },
      {
        path: 'cpf-estendida',
        loadComponent: () => import('./features/cpf-estendida/cpf-estendida.component').then(m => m.CpfEstendidaComponent)
      },
      {
        path: 'cnpj-consulta',
        loadComponent: () => import('./features/cnpj-consulta/cnpj-consulta.component').then(m => m.CnpjConsultaComponent)
      },
      {
        path: 'cnpj-estendida',
        loadComponent: () => import('./features/cnpj-estendida/cnpj-estendida.component').then(m => m.CnpjEstendidaComponent)
      },
      {
        path: 'documento',
        loadComponent: () => import('./features/documento/documento.component').then(m => m.DocumentoComponent)
      },
      {
        path: 'escavador-processos',
        loadComponent: () => import('./features/escavador-processos/escavador-processos.component').then(m => m.EscavadorProcessosComponent)
      }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
