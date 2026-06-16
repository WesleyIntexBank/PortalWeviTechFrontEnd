import { Component, inject, signal, computed, effect, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import * as L from 'leaflet';
import { ThemeService } from '../../core/services/theme.service';
import {
  AppInsightsService,
  RequestLogRow,
  SummaryResponse,
  TopRouteRow,
  LocationRow,
} from '../../core/services/app-insights.service';

@Component({
  selector: 'app-access-logs',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatTooltipModule, MatChipsModule,
  ],
  template: `
    <div class="page-container">

      <!-- ── Header ──────────────────────────────────────────────── -->
      <div class="page-header">
        <mat-icon>monitoring</mat-icon>
        <div>
          <h1>Logs de Acesso</h1>
          <span class="subtitle">Application Insights — requisições em tempo real</span>
        </div>
        <div class="header-actions">
          <mat-form-field appearance="outline" class="hours-field">
            <mat-label>Período</mat-label>
            <mat-select [value]="selectedHours()" (selectionChange)="onHoursChange($event.value)">
              <mat-option [value]="1">Última 1h</mat-option>
              <mat-option [value]="6">Últimas 6h</mat-option>
              <mat-option [value]="24">Últimas 24h</mat-option>
              <mat-option [value]="72">Últimos 3 dias</mat-option>
              <mat-option [value]="168">Última semana</mat-option>
            </mat-select>
          </mat-form-field>
          <button mat-icon-button (click)="refresh()" [disabled]="loadingLogs()" matTooltip="Atualizar">
            <mat-icon>refresh</mat-icon>
          </button>
        </div>
      </div>

      <!-- ── Summary cards ────────────────────────────────────────── -->
      @if (loadingSummary()) {
        <div class="loading-row"><mat-spinner diameter="28"></mat-spinner></div>
      } @else if (summary()) {
        <div class="summary-grid">
          <div class="s-card primary">
            <div class="s-icon"><mat-icon>http</mat-icon></div>
            <div class="s-info">
              <span class="s-val">{{ summary()!.totalRequests | number }}</span>
              <span class="s-label">Total de Requisições</span>
            </div>
          </div>
          <div class="s-card success">
            <div class="s-icon"><mat-icon>check_circle</mat-icon></div>
            <div class="s-info">
              <span class="s-val">{{ summary()!.successCount | number }}</span>
              <span class="s-label">Sucessos</span>
            </div>
          </div>
          <div class="s-card error">
            <div class="s-icon"><mat-icon>error</mat-icon></div>
            <div class="s-info">
              <span class="s-val">{{ summary()!.failureCount | number }}</span>
              <span class="s-label">Falhas</span>
            </div>
          </div>
          <div class="s-card perf">
            <div class="s-icon"><mat-icon>speed</mat-icon></div>
            <div class="s-info">
              <span class="s-val">{{ summary()!.avgDurationMs | number:'1.0-0' }} ms</span>
              <span class="s-label">Duração média</span>
            </div>
          </div>
          <div class="s-card perf2">
            <div class="s-icon"><mat-icon>timer</mat-icon></div>
            <div class="s-info">
              <span class="s-val">{{ summary()!.p95DurationMs | number:'1.0-0' }} ms</span>
              <span class="s-label">P95 Duração</span>
            </div>
          </div>
        </div>
      }

      <!-- ── Mapa de acessos ─────────────────────────────────────── -->
      <div class="map-card">
        <h3 class="card-title">
          <mat-icon>public</mat-icon>
          Mapa de Acessos
          @if (loadingLocations()) {
            <mat-spinner diameter="16" class="title-spinner"></mat-spinner>
          }
        </h3>
        @if (!loadingLocations() && !locations().length) {
          <div class="empty-small">Sem dados de localização para o período selecionado.</div>
        }
        <div class="map-container" [class.map-hidden]="!locations().length" #mapEl></div>
      </div>

      <!-- ── Layout: tabela + top rotas ──────────────────────────── -->
      <div class="main-layout">

        <!-- Tabela principal -->
        <div class="logs-card">

          <!-- Filtros -->
          <form [formGroup]="filterForm" class="filter-bar" (ngSubmit)="applyFilters()">
            <mat-form-field appearance="outline" class="f-ip">
              <mat-label>IP do cliente</mat-label>
              <mat-icon matPrefix>router</mat-icon>
              <input matInput formControlName="ip" placeholder="ex: 200.168">
            </mat-form-field>
            <mat-form-field appearance="outline" class="f-route">
              <mat-label>Rota / URL</mat-label>
              <mat-icon matPrefix>route</mat-icon>
              <input matInput formControlName="route" placeholder="ex: /api/User">
            </mat-form-field>
            <mat-form-field appearance="outline" class="f-status">
              <mat-label>Status HTTP</mat-label>
              <mat-select formControlName="statusCode">
                <mat-option value="">Todos</mat-option>
                <mat-option value="200">200 OK</mat-option>
                <mat-option value="201">201 Created</mat-option>
                <mat-option value="400">400 Bad Request</mat-option>
                <mat-option value="401">401 Unauthorized</mat-option>
                <mat-option value="403">403 Forbidden</mat-option>
                <mat-option value="404">404 Not Found</mat-option>
                <mat-option value="500">500 Server Error</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="f-from">
              <mat-label>De</mat-label>
              <input matInput type="datetime-local" formControlName="from">
            </mat-form-field>
            <mat-form-field appearance="outline" class="f-to">
              <mat-label>Até</mat-label>
              <input matInput type="datetime-local" formControlName="to">
            </mat-form-field>
            <mat-form-field appearance="outline" class="f-max">
              <mat-label>Máx. linhas</mat-label>
              <mat-select formControlName="maxRows">
                <mat-option [value]="100">100</mat-option>
                <mat-option [value]="250">250</mat-option>
                <mat-option [value]="500">500</mat-option>
                <mat-option [value]="1000">1000</mat-option>
              </mat-select>
            </mat-form-field>
            <div class="filter-actions">
              <button mat-flat-button color="primary" type="submit" [disabled]="loadingLogs()">
                <mat-icon>search</mat-icon> Buscar
              </button>
              <button mat-stroked-button type="button" (click)="clearFilters()">
                <mat-icon>clear</mat-icon>
              </button>
              <button mat-stroked-button type="button" (click)="exportCsv()" [disabled]="!rows().length" matTooltip="Exportar CSV">
                <mat-icon>download</mat-icon>
              </button>
            </div>
          </form>

          <!-- Resultado -->
          @if (loadingLogs()) {
            <div class="loading-center"><mat-spinner diameter="36"></mat-spinner></div>
          } @else if (errorMsg()) {
            <div class="error-banner">
              <mat-icon>warning</mat-icon>
              <span>{{ errorMsg() }}</span>
            </div>
          } @else if (!rows().length) {
            <div class="empty-state">
              <mat-icon>inbox</mat-icon>
              <p>Nenhum log encontrado para os filtros aplicados.</p>
            </div>
          } @else {
            <div class="table-meta">
              <span>{{ rows().length }} registros</span>
              <span class="last-updated">Atualizado: {{ lastUpdated() }}</span>
            </div>
            <div class="table-scroll">
              <table class="log-table">
                <thead>
                  <tr>
                    <th (click)="sortBy('timestamp')" class="sortable">
                      Timestamp <mat-icon class="sort-icon">{{ sortIcon('timestamp') }}</mat-icon>
                    </th>
                    <th (click)="sortBy('clientIp')" class="sortable">
                      IP <mat-icon class="sort-icon">{{ sortIcon('clientIp') }}</mat-icon>
                    </th>
                    <th (click)="sortBy('name')" class="sortable">
                      Rota <mat-icon class="sort-icon">{{ sortIcon('name') }}</mat-icon>
                    </th>
                    <th (click)="sortBy('resultCode')" class="sortable">
                      Status <mat-icon class="sort-icon">{{ sortIcon('resultCode') }}</mat-icon>
                    </th>
                    <th (click)="sortBy('durationMs')" class="sortable">
                      Duração <mat-icon class="sort-icon">{{ sortIcon('durationMs') }}</mat-icon>
                    </th>
                    <th>URL</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of sortedRows(); track row.operationId + row.timestamp) {
                    <tr [class.row-error]="isError(row.resultCode)" [class.row-success]="isSuccess(row.resultCode)">
                      <td class="col-ts">{{ formatTs(row.timestamp) }}</td>
                      <td class="col-ip">
                        <span class="ip-chip" (click)="filterByIp(row.clientIp)" matTooltip="Filtrar por este IP">
                          {{ row.clientIp }}
                        </span>
                      </td>
                      <td class="col-name">{{ row.name }}</td>
                      <td class="col-status">
                        <span class="status-badge" [class]="statusClass(row.resultCode)">
                          {{ row.resultCode }}
                        </span>
                      </td>
                      <td class="col-dur">
                        <span [class.slow]="row.durationMs > 1000">
                          {{ row.durationMs | number:'1.0-0' }} ms
                        </span>
                      </td>
                      <td class="col-url" [matTooltip]="row.url">{{ truncate(row.url, 60) }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

        <!-- Top rotas -->
        <div class="top-routes-card">
          <h3 class="card-title">
            <mat-icon>bar_chart</mat-icon>
            Top Rotas
          </h3>
          @if (loadingTopRoutes()) {
            <div class="loading-center"><mat-spinner diameter="28"></mat-spinner></div>
          } @else if (!topRoutes().length) {
            <div class="empty-small">Sem dados</div>
          } @else {
            @for (r of topRoutes(); track r.name) {
              <div class="route-row">
                <div class="route-info">
                  <span class="route-name">{{ r.name }}</span>
                  <div class="route-meta">
                    <span class="r-count">{{ r.count | number }} req</span>
                    <span class="r-avg">{{ r.avgMs | number:'1.0-0' }} ms</span>
                    @if (r.errors > 0) {
                      <span class="r-err">{{ r.errors }} erros</span>
                    }
                  </div>
                </div>
                <div class="route-bar-wrap">
                  <div class="route-bar" [style.width.%]="routeBarPct(r.count)"></div>
                </div>
              </div>
            }
          }
        </div>

      </div>
    </div>
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 20px; }

    /* ── Header ── */
    .page-header {
      display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
      mat-icon { font-size: 30px; width: 30px; height: 30px; color: var(--primary); flex-shrink: 0; }
      h1 { margin: 0; font-size: 22px; font-weight: 700; color: var(--text); }
      .subtitle { font-size: 13px; color: var(--text-sec); }
    }
    .header-actions { margin-left: auto; display: flex; align-items: center; gap: 8px; }
    .hours-field { width: 160px; }

    /* ── Summary ── */
    .loading-row { display: flex; justify-content: center; padding: 20px; }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 14px;
    }
    .s-card {
      background: var(--surface); border-radius: 10px;
      border: 1px solid var(--border); padding: 16px;
      display: flex; align-items: center; gap: 14px;
      box-shadow: var(--card-shadow);
      border-left: 4px solid;
    }
    .s-card.primary  { border-left-color: var(--primary); }
    .s-card.success  { border-left-color: var(--active-color); }
    .s-card.error    { border-left-color: var(--inactive-color); }
    .s-card.perf     { border-left-color: #ff9800; }
    .s-card.perf2    { border-left-color: #9c27b0; }

    .s-icon {
      width: 44px; height: 44px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      background: var(--input-bg);
      mat-icon { font-size: 22px; }
    }
    .s-card.primary  .s-icon mat-icon { color: var(--primary); }
    .s-card.success  .s-icon mat-icon { color: var(--active-color); }
    .s-card.error    .s-icon mat-icon { color: var(--inactive-color); }
    .s-card.perf     .s-icon mat-icon { color: #ff9800; }
    .s-card.perf2    .s-icon mat-icon { color: #9c27b0; }

    .s-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .s-val  { font-size: 22px; font-weight: 700; color: var(--text); }
    .s-label { font-size: 12px; color: var(--text-sec); }

    /* ── Mapa ── */
    .map-card {
      background: var(--surface); border-radius: 12px;
      border: 1px solid var(--border); padding: 20px;
      box-shadow: var(--card-shadow);
    }
    .title-spinner { margin-left: 6px; }
    .map-container {
      height: 380px; border-radius: 8px; overflow: hidden;
      border: 1px solid var(--border);
    }
    .map-hidden { display: none; }

    /* ── Layout ── */
    .main-layout {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 16px;
      align-items: start;
    }

    /* ── Logs card ── */
    .logs-card {
      background: var(--surface); border-radius: 12px;
      border: 1px solid var(--border); padding: 20px;
      box-shadow: var(--card-shadow); overflow: hidden;
    }

    /* ── Filtros ── */
    .filter-bar {
      display: flex; flex-wrap: wrap; gap: 10px; align-items: flex-start;
      margin-bottom: 16px;
    }
    .f-ip    { min-width: 150px; flex: 1; }
    .f-route { min-width: 160px; flex: 2; }
    .f-status { min-width: 150px; flex: 1; }
    .f-from, .f-to { min-width: 170px; flex: 1.5; }
    .f-max   { min-width: 100px; flex: 0 0 100px; }
    .filter-actions { display: flex; align-items: flex-start; gap: 6px; padding-top: 4px; }

    /* ── Table meta ── */
    .table-meta {
      display: flex; justify-content: space-between; align-items: center;
      font-size: 13px; color: var(--text-sec); margin-bottom: 10px;
    }
    .last-updated { font-size: 12px; color: var(--text-ter); }

    /* ── Table ── */
    .table-scroll { overflow-x: auto; }

    .log-table {
      width: 100%; border-collapse: collapse; font-size: 13px;
    }
    .log-table th {
      background: var(--input-bg); color: var(--text-sec);
      padding: 10px 12px; text-align: left; font-weight: 600;
      white-space: nowrap; border-bottom: 1px solid var(--border);
      user-select: none;
    }
    .log-table th.sortable { cursor: pointer; }
    .log-table th.sortable:hover { background: var(--row-hover); color: var(--text); }

    .sort-icon { font-size: 14px; width: 14px; height: 14px; vertical-align: middle; opacity: 0.6; }

    .log-table td {
      padding: 9px 12px; border-bottom: 1px solid var(--border);
      color: var(--text); vertical-align: middle;
    }
    .log-table tr:last-child td { border-bottom: none; }
    .log-table tr:hover td { background: var(--row-hover); }

    .row-error td  { border-left: 3px solid var(--inactive-color); }
    .row-success td { border-left: 3px solid transparent; }

    .col-ts   { white-space: nowrap; font-size: 12px; color: var(--text-sec); min-width: 150px; }
    .col-ip   { white-space: nowrap; min-width: 120px; }
    .col-name { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .col-status { white-space: nowrap; }
    .col-dur  { white-space: nowrap; text-align: right; }
    .col-url  { max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                font-size: 12px; color: var(--text-sec); cursor: default; }

    .ip-chip {
      background: var(--input-bg); border: 1px solid var(--border);
      border-radius: 4px; padding: 2px 6px; font-size: 12px;
      cursor: pointer; font-family: monospace;
      transition: background 0.15s;
    }
    .ip-chip:hover { background: var(--row-hover); border-color: var(--primary); }

    .status-badge {
      font-size: 12px; font-weight: 600; padding: 2px 8px;
      border-radius: 10px; white-space: nowrap;
    }
    .badge-2xx { background: var(--active-bg);   color: var(--active-color); }
    .badge-3xx { background: rgba(255,152,0,.12); color: #ff9800; }
    .badge-4xx { background: rgba(244,67,54,.12); color: #ef5350; }
    .badge-5xx { background: var(--inactive-bg);  color: var(--inactive-color); }
    .badge-unk { background: var(--input-bg);     color: var(--text-sec); }

    .slow { color: #ff9800; font-weight: 600; }

    /* ── Empty / error ── */
    .loading-center { display: flex; justify-content: center; padding: 40px; }
    .error-banner {
      display: flex; align-items: center; gap: 10px;
      padding: 14px 16px; border-radius: 8px; margin: 8px 0;
      background: rgba(244,67,54,.10); border: 1px solid rgba(244,67,54,.25);
      color: #ef9a9a; font-size: 14px;
      mat-icon { color: #ef5350; flex-shrink: 0; }
    }
    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      gap: 8px; padding: 48px; color: var(--text-sec);
      mat-icon { font-size: 48px; width: 48px; height: 48px; color: var(--text-ter); }
    }

    /* ── Top Routes card ── */
    .top-routes-card {
      background: var(--surface); border-radius: 12px;
      border: 1px solid var(--border); padding: 20px;
      box-shadow: var(--card-shadow);
    }
    .card-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 15px; font-weight: 600; color: var(--text);
      margin: 0 0 16px;
      mat-icon { color: var(--primary); font-size: 20px; width: 20px; height: 20px; }
    }
    .route-row { margin-bottom: 14px; }
    .route-info { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; gap: 6px; }
    .route-name {
      font-size: 12px; color: var(--text); flex: 1;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .route-meta { display: flex; gap: 8px; flex-shrink: 0; font-size: 11px; }
    .r-count { color: var(--primary); font-weight: 600; }
    .r-avg   { color: var(--text-sec); }
    .r-err   { color: var(--inactive-color); font-weight: 600; }

    .route-bar-wrap {
      height: 5px; background: var(--input-bg);
      border-radius: 3px; overflow: hidden;
    }
    .route-bar {
      height: 100%; background: var(--primary);
      border-radius: 3px; transition: width 0.5s ease;
      min-width: 2px;
    }
    .empty-small { color: var(--text-ter); font-size: 13px; text-align: center; padding: 24px; }

    /* ── Responsive ── */
    @media (max-width: 960px) {
      .main-layout { grid-template-columns: 1fr; }
      .top-routes-card { display: none; }
    }
    @media (max-width: 600px) {
      .f-from, .f-to { display: none; }
      .summary-grid { grid-template-columns: 1fr 1fr; }
    }

    /* ── MDC overrides ── */
    ::ng-deep .mat-mdc-form-field .mat-mdc-text-field-wrapper { background: var(--input-bg) !important; }
    ::ng-deep .mdc-text-field__input, ::ng-deep input, ::ng-deep textarea { color: var(--text) !important; }
    ::ng-deep .mdc-floating-label { color: var(--text-sec) !important; }
    ::ng-deep .mdc-notched-outline__leading,
    ::ng-deep .mdc-notched-outline__notch,
    ::ng-deep .mdc-notched-outline__trailing { border-color: var(--border) !important; }
    ::ng-deep .mat-mdc-select-value-text { color: var(--text) !important; }
    ::ng-deep .mat-mdc-select-panel { background: var(--surface) !important; }
    ::ng-deep .mat-mdc-option { color: var(--text) !important; }
  `]
})
export class AccessLogsComponent implements OnInit, AfterViewInit, OnDestroy {
  private svc = inject(AppInsightsService);
  private fb = inject(FormBuilder);
  private themeService = inject(ThemeService);

  @ViewChild('mapEl') mapEl!: ElementRef<HTMLDivElement>;
  private map?: L.Map;
  private markersLayer?: L.LayerGroup;
  private tileLayer?: L.TileLayer;

  constructor() {
    effect(() => {
      this.themeService.isDark();
      if (this.map) {
        this.setTileLayer();
        this.renderMarkers();
      }
    });
  }

  filterForm: FormGroup = this.fb.group({
    ip: [''],
    route: [''],
    statusCode: [''],
    from: [''],
    to: [''],
    maxRows: [500],
  });

  selectedHours = signal(24);
  loadingSummary = signal(false);
  loadingLogs = signal(false);
  loadingTopRoutes = signal(false);
  loadingLocations = signal(false);

  summary = signal<SummaryResponse | null>(null);
  rows = signal<RequestLogRow[]>([]);
  topRoutes = signal<TopRouteRow[]>([]);
  locations = signal<LocationRow[]>([]);
  errorMsg = signal('');
  lastUpdated = signal('');

  sortCol = signal<keyof RequestLogRow>('timestamp');
  sortDir = signal<'asc' | 'desc'>('desc');

  sortedRows = computed(() => {
    const col = this.sortCol();
    const dir = this.sortDir();
    return [...this.rows()].sort((a, b) => {
      const av = a[col] ?? '';
      const bv = b[col] ?? '';
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return dir === 'asc' ? cmp : -cmp;
    });
  });

  ngOnInit() { this.refresh(); }

  ngAfterViewInit() {
    this.map = L.map(this.mapEl.nativeElement, { scrollWheelZoom: false }).setView([-14.235, -51.9253], 4);
    this.setTileLayer();
    this.markersLayer = L.layerGroup().addTo(this.map);
    this.renderMarkers();
  }

  ngOnDestroy() {
    this.map?.remove();
  }

  private setTileLayer() {
    if (!this.map) return;
    if (this.tileLayer) this.map.removeLayer(this.tileLayer);

    const dark = this.themeService.isDark();
    const url = dark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const attribution = dark
      ? '&copy; OpenStreetMap contributors &copy; CARTO'
      : '&copy; OpenStreetMap contributors';

    this.tileLayer = L.tileLayer(url, { attribution, maxZoom: 19 }).addTo(this.map);
  }

  refresh() {
    this.loadSummary();
    this.loadLogs();
    this.loadTopRoutes();
    this.loadLocations();
  }

  onHoursChange(h: number) {
    this.selectedHours.set(h);
    this.loadSummary();
    this.loadTopRoutes();
    this.loadLocations();
  }

  private loadLocations() {
    this.loadingLocations.set(true);
    this.svc.getLocations(this.selectedHours()).subscribe({
      next: locs => {
        this.locations.set(locs);
        this.loadingLocations.set(false);
        this.renderMarkers();
      },
      error: () => { this.loadingLocations.set(false); }
    });
  }

  private renderMarkers() {
    if (!this.markersLayer) return;
    this.markersLayer.clearLayers();
    const dark = this.themeService.isDark();
    const markerColor = dark ? '#29b6f6' : '#1976d2';
    for (const loc of this.locations()) {
      const radius = Math.min(8 + Math.log(loc.count + 1) * 5, 35);
      L.circleMarker([loc.lat, loc.lon], {
        radius,
        color: markerColor,
        fillColor: markerColor,
        fillOpacity: dark ? 0.55 : 0.45,
        weight: 1.5,
      })
        .bindPopup(
          `<strong>${loc.city}${loc.country ? ', ' + loc.country : ''}</strong><br>` +
          `${loc.count.toLocaleString('pt-BR')} requisições<br>` +
          `${loc.avgMs.toFixed(0)} ms (média)`
        )
        .addTo(this.markersLayer);
    }
  }

  private loadSummary() {
    this.loadingSummary.set(true);
    this.svc.getSummary(this.selectedHours()).subscribe({
      next: s => { this.summary.set(s); this.loadingSummary.set(false); },
      error: () => { this.loadingSummary.set(false); }
    });
  }

  private loadTopRoutes() {
    this.loadingTopRoutes.set(true);
    this.svc.getTopRoutes(this.selectedHours(), 10).subscribe({
      next: r => { this.topRoutes.set(r); this.loadingTopRoutes.set(false); },
      error: () => { this.loadingTopRoutes.set(false); }
    });
  }

  applyFilters() { this.loadLogs(); }

  private loadLogs() {
    this.loadingLogs.set(true);
    this.errorMsg.set('');
    const v = this.filterForm.value;
    this.svc.getRequests({
      ip: v.ip || undefined,
      route: v.route || undefined,
      statusCode: v.statusCode || undefined,
      from: v.from ? new Date(v.from).toISOString() : undefined,
      to: v.to ? new Date(v.to).toISOString() : undefined,
      maxRows: v.maxRows,
    }).subscribe({
      next: res => {
        this.rows.set(res.rows);
        this.lastUpdated.set(new Date().toLocaleTimeString('pt-BR'));
        this.loadingLogs.set(false);
      },
      error: err => {
        this.errorMsg.set(err?.error?.error ?? 'Erro ao carregar logs. Verifique se o App Insights está configurado.');
        this.loadingLogs.set(false);
      }
    });
  }

  clearFilters() {
    this.filterForm.reset({ maxRows: 500 });
    this.loadLogs();
  }

  sortBy(col: keyof RequestLogRow) {
    if (this.sortCol() === col) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortCol.set(col);
      this.sortDir.set('desc');
    }
  }

  sortIcon(col: string): string {
    if (this.sortCol() !== col) return 'unfold_more';
    return this.sortDir() === 'asc' ? 'expand_less' : 'expand_more';
  }

  filterByIp(ip: string) {
    if (!ip) return;
    this.filterForm.patchValue({ ip });
    this.loadLogs();
  }

  formatTs(ts: string): string {
    if (!ts) return '';
    return new Date(ts).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  }

  truncate(s: string, max: number): string {
    return s?.length > max ? s.substring(0, max) + '…' : (s ?? '');
  }

  isError(code: string): boolean { return parseInt(code) >= 400; }
  isSuccess(code: string): boolean { const n = parseInt(code); return n >= 200 && n < 400; }

  statusClass(code: string): string {
    const n = parseInt(code);
    if (n >= 200 && n < 300) return 'status-badge badge-2xx';
    if (n >= 300 && n < 400) return 'status-badge badge-3xx';
    if (n >= 400 && n < 500) return 'status-badge badge-4xx';
    if (n >= 500)             return 'status-badge badge-5xx';
    return 'status-badge badge-unk';
  }

  routeBarPct(count: number): number {
    const max = Math.max(...this.topRoutes().map(r => r.count), 1);
    return (count / max) * 100;
  }

  exportCsv() {
    const cols = ['Timestamp', 'IP', 'Rota', 'Status', 'Duração (ms)', 'URL'];
    const rows = this.sortedRows().map(r =>
      [this.formatTs(r.timestamp), r.clientIp, r.name, r.resultCode, r.durationMs.toFixed(0), r.url]
        .map(v => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    const csv = [cols.join(','), ...rows].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `access-logs-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }
}
