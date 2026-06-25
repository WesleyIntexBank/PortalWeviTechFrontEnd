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
      },
      {
        path: 'metricas',
        loadComponent: () => import('./features/metricas/metricas.component').then(m => m.MetricasComponent)
      },
      {
        path: 'lista-restritiva',
        loadComponent: () => import('./features/lista-restritiva/lista-restritiva.component').then(m => m.ListaRestritivaComponent)
      },
      {
        path: 'notification-email',
        loadComponent: () => import('./features/notification-email/notification-email.component').then(m => m.NotificationEmailComponent)
      },
      {
        path: 'notification-sms',
        loadComponent: () => import('./features/notification-sms/notification-sms.component').then(m => m.NotificationSmsComponent)
      },
      { path: 'notification-whatsapp', redirectTo: 'notification-sms', pathMatch: 'full' },
      {
        path: 'ds160',
        loadComponent: () => import('./features/ds160/ds160.component').then(m => m.DS160Component)
      },
      {
        path: 'access-logs',
        loadComponent: () => import('./features/access-logs/access-logs.component').then(m => m.AccessLogsComponent)
      },
      {
        path: 'kafka-monitor',
        loadComponent: () => import('./features/kafka-monitor/kafka-monitor.component').then(m => m.KafkaMonitorComponent)
      },
      {
        path: 'kafka-tester',
        loadComponent: () => import('./features/kafka-tester/kafka-tester.component').then(m => m.KafkaTesterComponent)
      },
      {
        path: 'bank-consulta',
        loadComponent: () => import('./features/bank-consulta/bank-consulta.component').then(m => m.BankConsultaComponent)
      },
      { path: 'swift-consulta',          redirectTo: 'bank-consulta', pathMatch: 'full' },
      { path: 'iban-consulta',           redirectTo: 'bank-consulta', pathMatch: 'full' },
      { path: 'routing-number-consulta', redirectTo: 'bank-consulta', pathMatch: 'full' },
      {
        path: 'balanco-patrimonial',
        loadComponent: () => import('./features/balanco-patrimonial/balanco-patrimonial.component').then(m => m.BalancoPatrimonialComponent)
      },
      {
        path: 'azure-reader-document',
        loadComponent: () => import('./features/azure-reader-document/azure-reader-document.component').then(m => m.AzureReaderDocumentComponent)
      },
      {
        path: 'configuracoes-parametros',
        loadComponent: () => import('./features/configuracoes-parametros/configuracoes-parametros.component').then(m => m.ConfiguracoesParametrosComponent)
      },
      {
        path: 'cvm-corretoras',
        loadComponent: () => import('./features/cvm-corretoras/cvm-corretoras.component').then(m => m.CvmCorretorasComponent)
      },
      {
        path: 'taxas-brasil',
        loadComponent: () => import('./features/taxas-brasil/taxas-brasil.component').then(m => m.TaxasBrasilComponent)
      },
      {
        path: 'pix-participantes',
        loadComponent: () => import('./features/pix-participantes/pix-participantes.component').then(m => m.PixParticipantesComponent)
      },
      {
        path: 'acam204-validacao',
        loadComponent: () => import('./features/acam204-validacao/acam204-validacao.component').then(m => m.Acam204ValidacaoComponent)
      },
      {
        path: 'cdc-radar',
        loadComponent: () => import('./features/cdc-radar/cdc-radar.component').then(m => m.CdcRadarComponent)
      },
      {
        path: 'convera-envio',
        loadComponent: () => import('./features/convera-envio/convera-envio.component').then(m => m.ConveraEnvioComponent)
      },
      {
        path: 'bny-envio',
        loadComponent: () => import('./features/bny-envio/bny-envio.component').then(m => m.BnyEnvioComponent)
      },
      {
        path: 'visa-direct-envio',
        loadComponent: () => import('./features/visa-direct-envio/visa-direct-envio.component').then(m => m.VisaDirectEnvioComponent)
      },
      {
        path: 'moneygram-envio',
        loadComponent: () => import('./features/moneygram-envio/moneygram-envio.component').then(m => m.MoneyGramEnvioComponent)
      },
      {
        path: 'pixbtg-envio',
        loadComponent: () => import('./features/pixbtg-envio/pixbtg-envio.component').then(m => m.PixBtgEnvioComponent)
      },
      {
        path: 'ccme-envio',
        loadComponent: () => import('./features/ccme-envio/ccme-envio.component').then(m => m.CcmeEnvioComponent)
      },

    ]
  },
  { path: '**', redirectTo: 'login' }
];
