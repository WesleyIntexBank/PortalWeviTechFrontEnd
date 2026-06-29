import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { filter, catchError, of } from 'rxjs';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ActivityLog {
  id: number;
  userId?: number;
  userEmail?: string;
  userName?: string;
  ipAddress: string;
  serviceName: string;
  httpMethod: string;
  requestPath: string;
  responseStatusCode: number;
  durationMs: number;
  accessedAt: string;
  sessionId?: string;
  userAgent?: string;
}

export interface ScreenLog {
  id: number;
  userId?: number;
  userEmail?: string;
  userName?: string;
  sessionId: string;
  screenName: string;
  route: string;
  enteredAt: string;
  exitedAt?: string;
  durationMs?: number;
  ipAddress?: string;
}

export interface ClickLog {
  id: number;
  userId?: number;
  userEmail?: string;
  userName?: string;
  sessionId: string;
  screenName: string;
  route: string;
  elementId?: string;
  elementType?: string;
  elementText?: string;
  elementPath?: string;
  clickedAt: string;
  ipAddress?: string;
}

export interface TrackingSummary {
  totalApiCalls: number;
  uniqueUsers: number;
  averageDurationMs: number;
  topEndpoints: { path: string; calls: number }[];
  topScreens: { screen: string; views: number; avgDurationMs: number }[];
  topClickedElements: { screenName: string; elementText: string; clicks: number }[];
  errorRate: number;
}

const ROUTE_NAMES: Record<string, string> = {
  '/dashboard':                  'Dashboard',
  '/user':                       'Usuários',
  '/profile':                    'Perfis',
  '/enterprise':                 'Empresas',
  '/menu':                       'Menus',
  '/profile-menus':              'Menus do Perfil',
  '/ai-chat':                    'Chat IA',
  '/api-tester':                 'API Tester',
  '/cpf-consulta':               'Consulta CPF',
  '/cpf-estendida':              'CPF Estendida',
  '/cnpj-consulta':              'Consulta CNPJ',
  '/cnpj-estendida':             'CNPJ Estendida',
  '/documento':                  'Documento',
  '/escavador-processos':        'Escavador Processos',
  '/metricas':                   'Métricas',
  '/lista-restritiva':           'Lista Restritiva',
  '/notification-email':         'Notificação E-mail',
  '/notification-sms':           'Notificação SMS',
  '/ds160':                      'DS-160',
  '/access-logs':                'Logs de Acesso',
  '/kafka-monitor':              'Kafka Monitor',
  '/kafka-tester':               'Kafka Tester',
  '/bank-consulta':              'Consulta Banco',
  '/balanco-patrimonial':        'Balanço Patrimonial',
  '/azure-reader-document':      'Azure Reader',
  '/configuracoes-parametros':   'Configurações',
  '/cvm-corretoras':             'CVM Corretoras',
  '/taxas-brasil':               'Taxas Brasil',
  '/pix-participantes':          'PIX Participantes',
  '/acam204-validacao':          'ACAM204',
  '/cdc-radar':                  'CDC Radar',
  '/convera-envio':              'Convera Envio',
  '/bny-envio':                  'BNY Envio',
  '/visa-direct-envio':          'Visa Direct',
  '/moneygram-envio':            'MoneyGram',
  '/pixbtg-envio':               'PIX BTG',
  '/ccme-envio':                 'CCME Envio',
  '/monitoring':                 'Monitoramento',
};

@Injectable({ providedIn: 'root' })
export class TrackingService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private baseUrl = `${environment.apiUrl}/Tracking`;

  private sessionId = this.getOrCreateSession();
  private currentRoute = '';
  private currentScreen = '';
  private enteredAt = new Date();

  init() {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        const prev = this.currentRoute;
        const prevScreen = this.currentScreen;
        const prevEntered = this.enteredAt;

        this.currentRoute = e.urlAfterRedirects.split('?')[0];
        this.currentScreen = ROUTE_NAMES[this.currentRoute] ?? this.currentRoute;
        this.enteredAt = new Date();

        if (prev && prev !== '/login') {
          const exitedAt = new Date();
          this.postScreen({
            sessionId: this.sessionId,
            screenName: prevScreen,
            route: prev,
            enteredAt: prevEntered.toISOString(),
            exitedAt: exitedAt.toISOString(),
            durationMs: exitedAt.getTime() - prevEntered.getTime(),
          });
        }

        if (this.currentRoute !== '/login') {
          this.postScreen({
            sessionId: this.sessionId,
            screenName: this.currentScreen,
            route: this.currentRoute,
            enteredAt: this.enteredAt.toISOString(),
          });
        }
      });
  }

  trackClick(element: HTMLElement, screenName?: string, additionalData?: object) {
    const route = this.currentRoute;
    const screen = screenName ?? this.currentScreen;
    this.postClick({
      sessionId: this.sessionId,
      screenName: screen,
      route,
      elementId: element.id || undefined,
      elementType: element.tagName.toLowerCase(),
      elementText: (element.textContent ?? '').trim().substring(0, 200) || undefined,
      elementPath: this.getElementPath(element),
      clickedAt: new Date().toISOString(),
      additionalData: additionalData ? JSON.stringify(additionalData) : undefined,
    });
  }

  getActivityLogs(params: { from?: string; to?: string; userId?: number; service?: string; take?: number }): Observable<ActivityLog[]> {
    let p = new HttpParams();
    if (params.from)    p = p.set('from', params.from);
    if (params.to)      p = p.set('to', params.to);
    if (params.userId)  p = p.set('userId', params.userId.toString());
    if (params.service) p = p.set('service', params.service);
    if (params.take)    p = p.set('take', params.take.toString());
    return this.http.get<ActivityLog[]>(`${this.baseUrl}/activity`, { params: p });
  }

  getScreenLogs(params: { from?: string; to?: string; userId?: number; take?: number }): Observable<ScreenLog[]> {
    let p = new HttpParams();
    if (params.from)   p = p.set('from', params.from);
    if (params.to)     p = p.set('to', params.to);
    if (params.userId) p = p.set('userId', params.userId.toString());
    if (params.take)   p = p.set('take', params.take.toString());
    return this.http.get<ScreenLog[]>(`${this.baseUrl}/screens`, { params: p });
  }

  getClickLogs(params: { from?: string; to?: string; userId?: number; screen?: string; take?: number }): Observable<ClickLog[]> {
    let p = new HttpParams();
    if (params.from)   p = p.set('from', params.from);
    if (params.to)     p = p.set('to', params.to);
    if (params.userId) p = p.set('userId', params.userId.toString());
    if (params.screen) p = p.set('screen', params.screen);
    if (params.take)   p = p.set('take', params.take.toString());
    return this.http.get<ClickLog[]>(`${this.baseUrl}/clicks`, { params: p });
  }

  getSummary(params: { from?: string; to?: string }): Observable<TrackingSummary> {
    let p = new HttpParams();
    if (params.from) p = p.set('from', params.from);
    if (params.to)   p = p.set('to', params.to);
    return this.http.get<TrackingSummary>(`${this.baseUrl}/summary`, { params: p });
  }

  private postScreen(dto: object) {
    this.http.post(`${this.baseUrl}/screen`, dto, {
      headers: { 'X-Session-Id': this.sessionId }
    }).pipe(catchError(() => of(null))).subscribe();
  }

  private postClick(dto: object) {
    this.http.post(`${this.baseUrl}/click`, dto, {
      headers: { 'X-Session-Id': this.sessionId }
    }).pipe(catchError(() => of(null))).subscribe();
  }

  private getOrCreateSession(): string {
    let id = sessionStorage.getItem('tracking_session');
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem('tracking_session', id);
    }
    return id;
  }

  private getElementPath(el: HTMLElement): string {
    const parts: string[] = [];
    let node: HTMLElement | null = el;
    let depth = 0;
    while (node && depth < 5) {
      let part = node.tagName.toLowerCase();
      if (node.id) part += `#${node.id}`;
      else if (node.className && typeof node.className === 'string')
        part += `.${node.className.trim().split(/\s+/)[0]}`;
      parts.unshift(part);
      node = node.parentElement;
      depth++;
    }
    return parts.join(' > ').substring(0, 500);
  }
}
