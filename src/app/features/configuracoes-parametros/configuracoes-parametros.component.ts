import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { Clipboard } from '@angular/cdk/clipboard';
import { ConfigurationParamsService } from '../../core/services/configuration-params.service';
import { ConfigurationParams } from '../../core/models/configuration-params.model';
import { ConfigurationParamsFormComponent } from './configuration-params-form.component';

interface GroupedFonte {
  fonte: string;
  credentials: ConfigurationParams[];
  urls: ConfigurationParams[];
  total: number;
  collapsed: boolean;
}

const FONTE_ICONS: Record<string, string> = {
  AZURE: 'cloud', GROKIA: 'auto_awesome', OPENAI: 'smart_toy',
  EMAIL: 'email', ZENVIA: 'sms', ESCAVADOR: 'gavel',
  CONVERA: 'currency_exchange', SOA: 'account_balance',
  BARRAMENTO: 'hub', STARMONEY: 'star', RECEITAWS: 'receipt',
  ROUTINGNUMBER: 'route', CEP: 'location_on',
  GRAFANA: 'monitoring', APPINSIGHTS: 'analytics',
  DS160: 'flight', DEFAULT: 'settings'
};

function isUrl(value: string): boolean {
  return value?.startsWith('http://') || value?.startsWith('https://');
}

@Component({
  selector: 'app-configuracoes-parametros',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatSnackBarModule, MatDialogModule,
    MatProgressSpinnerModule, MatTooltipModule, MatButtonToggleModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <mat-icon>settings</mat-icon>
        <h1>Parâmetros de Configuração</h1>
        <span class="subtitle">Credenciais e URLs externas centralizadas</span>
      </div>

      <div class="card-container">

        <!-- ── Stats ── -->
        @if (!loading()) {
          <div class="stats-bar">
            <div class="stat-card">
              <mat-icon>folder</mat-icon>
              <div>
                <div class="stat-value">{{ fontes().length }}</div>
                <div class="stat-label">Fontes</div>
              </div>
            </div>
            <div class="stat-card">
              <mat-icon>tune</mat-icon>
              <div>
                <div class="stat-value">{{ all().length }}</div>
                <div class="stat-label">Parâmetros</div>
              </div>
            </div>
            <div class="stat-card credential-stat">
              <mat-icon>key</mat-icon>
              <div>
                <div class="stat-value">{{ countCredentials() }}</div>
                <div class="stat-label">Credenciais</div>
              </div>
            </div>
            <div class="stat-card url-stat">
              <mat-icon>link</mat-icon>
              <div>
                <div class="stat-value">{{ countUrls() }}</div>
                <div class="stat-label">URLs</div>
              </div>
            </div>
          </div>
        }

        <!-- ── Toolbar ── -->
        <div class="toolbar">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Pesquisar</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input matInput [(ngModel)]="search" (ngModelChange)="applyFilter()"
                   placeholder="Parâmetro, descrição ou valor...">
            @if (search) {
              <button matSuffix mat-icon-button (click)="search=''; applyFilter()">
                <mat-icon>close</mat-icon>
              </button>
            }
          </mat-form-field>

          <mat-button-toggle-group [(ngModel)]="tipoFiltro" (ngModelChange)="applyFilter()" class="tipo-toggle">
            <mat-button-toggle value="todos">
              <mat-icon>list</mat-icon> Todos
            </mat-button-toggle>
            <mat-button-toggle value="credencial">
              <mat-icon>key</mat-icon> Credenciais
            </mat-button-toggle>
            <mat-button-toggle value="url">
              <mat-icon>link</mat-icon> URLs
            </mat-button-toggle>
          </mat-button-toggle-group>

          <button mat-flat-button color="primary" (click)="openForm()">
            <mat-icon>add</mat-icon> Novo
          </button>
        </div>

        <!-- ── Fonte chips ── -->
        @if (!loading() && fontes().length > 0) {
          <div class="fonte-chips">
            <button class="fonte-chip" [class.active]="fonteAtiva === ''"
                    (click)="setFonte('')">
              <mat-icon>apps</mat-icon> Todos
              <span class="chip-badge">{{ all().length }}</span>
            </button>
            @for (f of fontes(); track f.name) {
              <button class="fonte-chip" [class.active]="fonteAtiva === f.name"
                      (click)="setFonte(f.name)">
                <mat-icon>{{ getFonteIcon(f.name) }}</mat-icon>
                {{ f.name }}
                <span class="chip-badge">{{ f.count }}</span>
              </button>
            }
          </div>
        }

        <!-- ── Loading ── -->
        @if (loading()) {
          <div class="loading-overlay"><mat-spinner diameter="48"></mat-spinner></div>
        }

        <!-- ── Grupos ── -->
        @if (!loading()) {
          <div class="groups-list">
            @for (group of filteredGroups(); track group.fonte) {
              <div class="group-card">
                <!-- Card Header -->
                <div class="group-header" (click)="group.collapsed = !group.collapsed">
                  <div class="group-title">
                    <div class="fonte-badge">
                      <mat-icon>{{ getFonteIcon(group.fonte) }}</mat-icon>
                    </div>
                    <div>
                      <h3>{{ group.fonte }}</h3>
                      <span class="group-meta">
                        @if (group.credentials.length) {
                          <span class="badge credential-badge">
                            <mat-icon>key</mat-icon>{{ group.credentials.length }} credencial(is)
                          </span>
                        }
                        @if (group.urls.length) {
                          <span class="badge url-badge">
                            <mat-icon>link</mat-icon>{{ group.urls.length }} URL(s)
                          </span>
                        }
                      </span>
                    </div>
                  </div>
                  <div class="group-actions" (click)="$event.stopPropagation()">
                    <button mat-icon-button matTooltip="Novo parâmetro nesta fonte"
                            (click)="openForm(undefined, group.fonte)">
                      <mat-icon>add</mat-icon>
                    </button>
                    <button mat-icon-button (click)="group.collapsed = !group.collapsed">
                      <mat-icon>{{ group.collapsed ? 'expand_more' : 'expand_less' }}</mat-icon>
                    </button>
                  </div>
                </div>

                @if (!group.collapsed) {
                  <div class="group-body">

                    <!-- Credenciais -->
                    @if (group.credentials.length > 0 && (tipoFiltro === 'todos' || tipoFiltro === 'credencial')) {
                      <div class="section-label">
                        <mat-icon>key</mat-icon> Credenciais
                      </div>
                      <table class="params-table">
                        <thead>
                          <tr>
                            <th>Parâmetro</th>
                            <th>Descrição</th>
                            <th>Valor</th>
                            <th>Status</th>
                            <th>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (row of group.credentials; track row.id) {
                            <tr [class.inactive]="!row.ativo">
                              <td>
                                <code class="param-code credential-code">{{ row.parametro }}</code>
                              </td>
                              <td class="desc-cell">{{ row.descricao }}</td>
                              <td class="valor-cell">
                                <div class="valor-row">
                                  <span class="valor-text">
                                    {{ revealed.has(row.id) ? row.valor : maskValue(row.valor) }}
                                  </span>
                                  <button mat-icon-button class="inline-btn"
                                          (click)="toggleReveal(row.id)"
                                          [matTooltip]="revealed.has(row.id) ? 'Ocultar' : 'Revelar'">
                                    <mat-icon>{{ revealed.has(row.id) ? 'visibility_off' : 'visibility' }}</mat-icon>
                                  </button>
                                  <button mat-icon-button class="inline-btn" matTooltip="Copiar"
                                          (click)="copyValue(row.valor)">
                                    <mat-icon>content_copy</mat-icon>
                                  </button>
                                </div>
                              </td>
                              <td>
                                <span class="status-chip" [class.active]="row.ativo" [class.inactive-chip]="!row.ativo">
                                  {{ row.ativo ? 'Ativo' : 'Inativo' }}
                                </span>
                              </td>
                              <td class="actions-cell">
                                <button mat-icon-button color="primary" (click)="openForm(row)" matTooltip="Editar">
                                  <mat-icon>edit</mat-icon>
                                </button>
                                <button mat-icon-button color="warn" (click)="confirmDelete(row)" matTooltip="Excluir">
                                  <mat-icon>delete</mat-icon>
                                </button>
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    }

                    <!-- Divider entre seções -->
                    @if (group.credentials.length > 0 && group.urls.length > 0
                        && tipoFiltro === 'todos') {
                      <div class="section-divider"></div>
                    }

                    <!-- URLs -->
                    @if (group.urls.length > 0 && (tipoFiltro === 'todos' || tipoFiltro === 'url')) {
                      <div class="section-label url-label">
                        <mat-icon>link</mat-icon> Endpoints / URLs
                      </div>
                      <table class="params-table">
                        <thead>
                          <tr>
                            <th>Parâmetro</th>
                            <th>Descrição</th>
                            <th>URL</th>
                            <th>Status</th>
                            <th>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (row of group.urls; track row.id) {
                            <tr [class.inactive]="!row.ativo">
                              <td>
                                <code class="param-code url-code">{{ row.parametro }}</code>
                              </td>
                              <td class="desc-cell">{{ row.descricao }}</td>
                              <td class="valor-cell">
                                <div class="valor-row">
                                  <a class="url-link" [href]="row.valor" target="_blank"
                                     rel="noopener noreferrer" matTooltip="{{ row.valor }}">
                                    <mat-icon class="url-icon">open_in_new</mat-icon>
                                    {{ truncateUrl(row.valor) }}
                                  </a>
                                  <button mat-icon-button class="inline-btn" matTooltip="Copiar URL"
                                          (click)="copyValue(row.valor)">
                                    <mat-icon>content_copy</mat-icon>
                                  </button>
                                </div>
                              </td>
                              <td>
                                <span class="status-chip" [class.active]="row.ativo" [class.inactive-chip]="!row.ativo">
                                  {{ row.ativo ? 'Ativo' : 'Inativo' }}
                                </span>
                              </td>
                              <td class="actions-cell">
                                <button mat-icon-button color="primary" (click)="openForm(row)" matTooltip="Editar">
                                  <mat-icon>edit</mat-icon>
                                </button>
                                <button mat-icon-button color="warn" (click)="confirmDelete(row)" matTooltip="Excluir">
                                  <mat-icon>delete</mat-icon>
                                </button>
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    }

                  </div>
                }
              </div>
            }

            @if (filteredGroups().length === 0 && !loading()) {
              <div class="empty-state">
                <mat-icon>search_off</mat-icon>
                <p>Nenhum parâmetro encontrado para os filtros selecionados</p>
                <button mat-stroked-button (click)="clearFilters()">Limpar filtros</button>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    /* ── Layout ── */
    .page-container { display: flex; flex-direction: column; gap: 24px; }

    .page-header {
      display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
      mat-icon { font-size: 30px; width: 30px; height: 30px; color: var(--active-color); flex-shrink: 0; }
      h1 { margin: 0; font-size: 22px; font-weight: 700; color: var(--text); }
      .subtitle { font-size: 13px; color: var(--text-sec); }
    }

    .card-container { display: flex; flex-direction: column; }

    /* ── Stats ── */
    .stats-bar {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 12px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 14px 20px;
      flex: 1;
      min-width: 120px;

      mat-icon { font-size: 28px; width: 28px; height: 28px; color: var(--active-color); opacity: .8; }

      .stat-value { font-size: 22px; font-weight: 700; color: var(--text); line-height: 1; }
      .stat-label { font-size: 12px; color: var(--text-sec); margin-top: 2px; }
    }

    .credential-stat mat-icon { color: #f59e0b; }
    .url-stat mat-icon { color: #3b82f6; }

    /* ── Toolbar ── */
    .toolbar {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .search-field { flex: 1; min-width: 220px; max-width: 440px; }

    .tipo-toggle {
      --mat-button-toggle-text-color: var(--text-sec);
      border-radius: 8px !important;
      overflow: hidden;

      ::ng-deep .mat-button-toggle {
        background: var(--surface);
        border-color: var(--border) !important;
        color: var(--text-sec);
        font-size: 13px;

        mat-icon { font-size: 16px; width: 16px; height: 16px; vertical-align: middle; margin-right: 4px; }
      }

      ::ng-deep .mat-button-toggle-checked {
        background: var(--active-color) !important;
        color: #fff !important;
      }
    }

    /* ── Fonte chips ── */
    .fonte-chips {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 24px;
    }

    .fonte-chip {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 20px;
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text-sec);
      font-size: 13px;
      cursor: pointer;
      transition: all 0.18s;

      mat-icon { font-size: 16px; width: 16px; height: 16px; }

      &:hover { border-color: var(--active-color); color: var(--text); }

      &.active {
        background: var(--active-color);
        border-color: var(--active-color);
        color: #fff;
        font-weight: 600;

        .chip-badge { background: rgba(255,255,255,.25); color: #fff; }
      }
    }

    .chip-badge {
      background: var(--input-bg);
      border-radius: 10px;
      padding: 1px 7px;
      font-size: 11px;
      font-weight: 700;
      color: var(--text-sec);
      min-width: 20px;
      text-align: center;
    }

    /* ── Group card ── */
    .groups-list { display: flex; flex-direction: column; gap: 16px; }

    .group-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
      transition: box-shadow 0.2s;

      &:hover { box-shadow: 0 2px 12px rgba(0,0,0,.1); }
    }

    .group-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      cursor: pointer;
      border-bottom: 1px solid var(--border);
      transition: background 0.15s;

      &:hover { background: var(--hover-bg, rgba(0,0,0,.03)); }
    }

    .group-title {
      display: flex;
      align-items: center;
      gap: 14px;

      h3 { margin: 0; font-size: 15px; font-weight: 700; color: var(--text); letter-spacing: .5px; }
    }

    .fonte-badge {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: var(--active-color);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      mat-icon { color: #fff; font-size: 20px; width: 20px; height: 20px; }
    }

    .group-meta {
      display: flex;
      gap: 8px;
      margin-top: 4px;
      flex-wrap: wrap;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 12px;

      mat-icon { font-size: 12px; width: 12px; height: 12px; }
    }

    .credential-badge {
      background: rgba(245,158,11,.15);
      color: #f59e0b;
    }

    .url-badge {
      background: rgba(59,130,246,.15);
      color: #3b82f6;
    }

    .group-actions { display: flex; align-items: center; }

    /* ── Group body ── */
    .group-body { padding: 0 0 8px; }

    .section-label {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px 8px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .8px;
      color: #f59e0b;

      mat-icon { font-size: 15px; width: 15px; height: 15px; }

      &.url-label { color: #3b82f6; }
    }

    .section-divider {
      height: 1px;
      background: var(--border);
      margin: 8px 20px;
    }

    /* ── Table ── */
    .params-table {
      width: 100%;
      border-collapse: collapse;
    }

    .params-table th {
      padding: 6px 12px;
      text-align: left;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .6px;
      color: var(--text-sec);
      background: var(--input-bg);
      border-bottom: 1px solid var(--border);
    }

    .params-table td {
      padding: 10px 12px;
      border-bottom: 1px solid var(--border);
      color: var(--text);
      font-size: 13px;
      vertical-align: middle;
    }

    .params-table tr:last-child td { border-bottom: none; }

    .params-table tr.inactive td { opacity: .5; }

    .params-table tr:hover td { background: var(--hover-bg, rgba(0,0,0,.02)); }

    .param-code {
      font-family: monospace;
      font-size: 12px;
      padding: 3px 8px;
      border-radius: 5px;
      border: 1px solid var(--border);
      white-space: nowrap;
    }

    .credential-code {
      background: rgba(245,158,11,.08);
      color: #d97706;
      border-color: rgba(245,158,11,.3);
    }

    .url-code {
      background: rgba(59,130,246,.08);
      color: #2563eb;
      border-color: rgba(59,130,246,.3);
    }

    .desc-cell { color: var(--text-sec); max-width: 220px; }

    .valor-cell { max-width: 320px; }

    .valor-row {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .valor-text {
      font-family: monospace;
      font-size: 12px;
      color: var(--text-sec);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 220px;
    }

    .url-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: #3b82f6;
      text-decoration: none;
      font-size: 12px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 240px;

      &:hover { text-decoration: underline; }

      .url-icon { font-size: 13px; width: 13px; height: 13px; flex-shrink: 0; }
    }

    .inline-btn {
      width: 28px !important;
      height: 28px !important;
      line-height: 28px !important;
      flex-shrink: 0;

      mat-icon { font-size: 16px; width: 16px; height: 16px; color: var(--text-sec); }

      &:hover mat-icon { color: var(--active-color); }
    }

    .status-chip {
      display: inline-block;
      font-size: 11px;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 12px;
      white-space: nowrap;

      &.active { background: rgba(16,185,129,.15); color: #059669; }
      &.inactive-chip { background: rgba(239,68,68,.1); color: #dc2626; }
    }

    .actions-cell { white-space: nowrap; }

    /* ── Loading / Empty ── */
    .loading-overlay {
      display: flex;
      justify-content: center;
      padding: 60px 0;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: var(--text-sec);

      mat-icon { font-size: 48px; width: 48px; height: 48px; opacity: .4; display: block; margin: 0 auto 16px; }
      p { font-size: 15px; margin-bottom: 16px; }
    }

    @media (max-width: 768px) {
      .stats-bar { gap: 8px; }
      .stat-card { padding: 10px 14px; }
      .toolbar { flex-direction: column; align-items: stretch; }
      .search-field { max-width: 100%; }
      .tipo-toggle { align-self: flex-start; }
      .desc-cell { display: none; }
      .valor-cell { max-width: 160px; }
    }
  `]
})
export class ConfiguracoesParametrosComponent implements OnInit {
  private service = inject(ConfigurationParamsService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private clipboard = inject(Clipboard);

  loading = signal(true);
  all = signal<ConfigurationParams[]>([]);
  filteredGroups = signal<GroupedFonte[]>([]);
  revealed = new Set<number>();

  search = '';
  tipoFiltro: 'todos' | 'credencial' | 'url' = 'todos';
  fonteAtiva = '';

  fontes = computed(() =>
    Object.entries(
      this.all().reduce((acc, p) => { acc[p.fonte] = (acc[p.fonte] ?? 0) + 1; return acc; }, {} as Record<string, number>)
    ).sort(([a], [b]) => a.localeCompare(b)).map(([name, count]) => ({ name, count }))
  );

  countCredentials = computed(() => this.all().filter(p => !isUrl(p.valor)).length);
  countUrls = computed(() => this.all().filter(p => isUrl(p.valor)).length);

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.service.getAll().subscribe({
      next: (data) => { this.all.set(data); this.applyFilter(); this.loading.set(false); },
      error: () => { this.snackBar.open('Erro ao carregar parâmetros', 'OK', { duration: 4000 }); this.loading.set(false); }
    });
  }

  applyFilter() {
    const q = this.search.toLowerCase();

    let items = this.all();

    if (this.fonteAtiva) items = items.filter(p => p.fonte === this.fonteAtiva);

    if (this.tipoFiltro === 'credencial') items = items.filter(p => !isUrl(p.valor));
    if (this.tipoFiltro === 'url') items = items.filter(p => isUrl(p.valor));

    if (q) items = items.filter(p =>
      p.parametro.toLowerCase().includes(q) ||
      p.descricao.toLowerCase().includes(q) ||
      p.valor.toLowerCase().includes(q)
    );

    const map = items.reduce((acc, p) => {
      (acc[p.fonte] ??= []).push(p);
      return acc;
    }, {} as Record<string, ConfigurationParams[]>);

    const groups: GroupedFonte[] = Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fonte, list]) => ({
        fonte,
        credentials: list.filter(p => !isUrl(p.valor)),
        urls: list.filter(p => isUrl(p.valor)),
        total: list.length,
        collapsed: false
      }));

    this.filteredGroups.set(groups);
  }

  setFonte(fonte: string) {
    this.fonteAtiva = fonte;
    this.applyFilter();
  }

  clearFilters() {
    this.search = '';
    this.fonteAtiva = '';
    this.tipoFiltro = 'todos';
    this.applyFilter();
  }

  getFonteIcon(fonte: string): string {
    return FONTE_ICONS[fonte] ?? FONTE_ICONS['DEFAULT'];
  }

  maskValue(value: string): string {
    if (!value || value.length <= 8) return '••••••••';
    return value.substring(0, 3) + '••••••••' + value.substring(value.length - 3);
  }

  truncateUrl(url: string): string {
    try {
      const u = new URL(url);
      const host = u.hostname;
      const path = u.pathname.length > 24 ? u.pathname.substring(0, 24) + '…' : u.pathname;
      return host + path;
    } catch { return url.length > 40 ? url.substring(0, 40) + '…' : url; }
  }

  toggleReveal(id: number) {
    this.revealed.has(id) ? this.revealed.delete(id) : this.revealed.add(id);
  }

  copyValue(value: string) {
    this.clipboard.copy(value);
    this.snackBar.open('Copiado!', '', { duration: 1500 });
  }

  openForm(item?: ConfigurationParams, fontePreset?: string) {
    const ref = this.dialog.open(ConfigurationParamsFormComponent, {
      width: '560px',
      maxWidth: '98vw',
      data: item ? { ...item } : (fontePreset ? { fonte: fontePreset } : null),
      panelClass: 'config-params-dialog'
    });
    ref.afterClosed().subscribe(result => { if (result) this.load(); });
  }

  confirmDelete(item: ConfigurationParams) {
    if (!confirm(`Excluir "${item.parametro}" (${item.fonte})?`)) return;
    this.service.delete(item.id).subscribe({
      next: () => { this.snackBar.open('Parâmetro excluído', 'OK', { duration: 3000 }); this.load(); },
      error: () => this.snackBar.open('Erro ao excluir', 'OK', { duration: 4000 })
    });
  }
}
