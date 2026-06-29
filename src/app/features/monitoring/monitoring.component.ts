import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import {
  TrackingService,
  ActivityLog,
  ScreenLog,
  ClickLog,
  TrackingSummary,
} from '../../core/services/tracking.service';

type SortDir = 'asc' | 'desc';

@Component({
  selector: 'app-monitoring',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatTooltipModule, MatTabsModule,
  ],
  template: `
    <div class="page-container">

      <!-- Header -->
      <div class="page-header">
        <mat-icon>manage_search</mat-icon>
        <div>
          <h1>Monitoramento de Usuários</h1>
          <span class="subtitle">Acessos, telas visitadas e cliques em tempo real</span>
        </div>
        <div class="header-actions">
          <mat-form-field appearance="outline" class="period-field">
            <mat-label>Período</mat-label>
            <mat-select [value]="selectedDays()" (selectionChange)="onPeriodChange($event.value)">
              <mat-option [value]="1">Hoje</mat-option>
              <mat-option [value]="7">Últimos 7 dias</mat-option>
              <mat-option [value]="30">Últimos 30 dias</mat-option>
            </mat-select>
          </mat-form-field>
          <button mat-icon-button (click)="loadAll()" matTooltip="Atualizar">
            <mat-icon>refresh</mat-icon>
          </button>
        </div>
      </div>

      <!-- Summary cards -->
      @if (loadingSummary()) {
        <div class="loading-row"><mat-spinner diameter="28"></mat-spinner></div>
      } @else if (summary()) {
        <div class="summary-grid">
          <div class="s-card primary">
            <div class="s-icon"><mat-icon>api</mat-icon></div>
            <div class="s-info">
              <span class="s-val">{{ summary()!.totalApiCalls | number }}</span>
              <span class="s-label">Chamadas de API</span>
            </div>
          </div>
          <div class="s-card blue">
            <div class="s-icon"><mat-icon>group</mat-icon></div>
            <div class="s-info">
              <span class="s-val">{{ summary()!.uniqueUsers | number }}</span>
              <span class="s-label">Usuários únicos</span>
            </div>
          </div>
          <div class="s-card perf">
            <div class="s-icon"><mat-icon>speed</mat-icon></div>
            <div class="s-info">
              <span class="s-val">{{ summary()!.averageDurationMs | number:'1.0-0' }} ms</span>
              <span class="s-label">Tempo médio de resposta</span>
            </div>
          </div>
          <div class="s-card error">
            <div class="s-icon"><mat-icon>error_outline</mat-icon></div>
            <div class="s-info">
              <span class="s-val">{{ summary()!.errorRate | number:'1.1-1' }}%</span>
              <span class="s-label">Taxa de erro</span>
            </div>
          </div>
        </div>
      }

      <!-- Top cards row -->
      @if (summary()) {
        <div class="top-row">

          <!-- Top endpoints -->
          <div class="mini-card">
            <h3 class="card-title"><mat-icon>route</mat-icon> Top Endpoints</h3>
            @for (ep of summary()!.topEndpoints; track ep.path) {
              <div class="bar-row">
                <span class="bar-label" [matTooltip]="ep.path">{{ ep.path | slice:0:40 }}</span>
                <span class="bar-count">{{ ep.calls }}</span>
                <div class="bar-wrap">
                  <div class="bar-fill primary-bar" [style.width.%]="pct(ep.calls, maxEndpointCalls())"></div>
                </div>
              </div>
            }
          </div>

          <!-- Top telas -->
          <div class="mini-card">
            <h3 class="card-title"><mat-icon>web</mat-icon> Top Telas</h3>
            @for (sc of summary()!.topScreens; track sc.screen) {
              <div class="bar-row">
                <span class="bar-label">{{ sc.screen }}</span>
                <span class="bar-count">{{ sc.views }}</span>
                <div class="bar-wrap">
                  <div class="bar-fill blue-bar" [style.width.%]="pct(sc.views, maxScreenViews())"></div>
                </div>
              </div>
            }
          </div>

          <!-- Top cliques -->
          <div class="mini-card">
            <h3 class="card-title"><mat-icon>ads_click</mat-icon> Top Cliques</h3>
            @for (cl of summary()!.topClickedElements; track cl.elementText + cl.screenName) {
              <div class="bar-row">
                <span class="bar-label" [matTooltip]="cl.screenName">{{ cl.elementText || '(sem texto)' }}</span>
                <span class="bar-count">{{ cl.clicks }}</span>
                <div class="bar-wrap">
                  <div class="bar-fill green-bar" [style.width.%]="pct(cl.clicks, maxClicks())"></div>
                </div>
              </div>
            }
          </div>

        </div>
      }

      <!-- Tabs de detalhe -->
      <div class="tabs-card">
        <mat-tab-group animationDuration="150ms">

          <!-- ── Atividade (API) ─────────────────────────────── -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">http</mat-icon> Atividade API
            </ng-template>

            <div class="tab-content">
              <form [formGroup]="activityForm" class="filter-bar" (ngSubmit)="loadActivity()">
                <mat-form-field appearance="outline" class="f-user">
                  <mat-label>Usuário (ID)</mat-label>
                  <input matInput type="number" formControlName="userId" placeholder="ex: 42">
                </mat-form-field>
                <mat-form-field appearance="outline" class="f-service">
                  <mat-label>Serviço</mat-label>
                  <input matInput formControlName="service" placeholder="ex: UserService">
                </mat-form-field>
                <mat-form-field appearance="outline" class="f-take">
                  <mat-label>Máx. registros</mat-label>
                  <mat-select formControlName="take">
                    <mat-option [value]="100">100</mat-option>
                    <mat-option [value]="200">200</mat-option>
                    <mat-option [value]="500">500</mat-option>
                  </mat-select>
                </mat-form-field>
                <div class="filter-actions">
                  <button mat-flat-button color="primary" type="submit">
                    <mat-icon>search</mat-icon> Buscar
                  </button>
                  <button mat-stroked-button type="button" (click)="exportActivity()" [disabled]="!activityLogs().length" matTooltip="Exportar CSV">
                    <mat-icon>download</mat-icon>
                  </button>
                </div>
              </form>

              @if (loadingActivity()) {
                <div class="loading-center"><mat-spinner diameter="32"></mat-spinner></div>
              } @else if (!activityLogs().length) {
                <div class="empty-state"><mat-icon>inbox</mat-icon><p>Nenhum registro encontrado.</p></div>
              } @else {
                <div class="table-meta">
                  <span>{{ activityLogs().length }} registros</span>
                </div>
                <div class="table-scroll">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th (click)="sortActivity('accessedAt')" class="sortable">Data <mat-icon class="sort-icon">{{ sortIcon(activitySortCol(), 'accessedAt') }}</mat-icon></th>
                        <th (click)="sortActivity('userName')" class="sortable">Usuário <mat-icon class="sort-icon">{{ sortIcon(activitySortCol(), 'userName') }}</mat-icon></th>
                        <th>IP</th>
                        <th (click)="sortActivity('serviceName')" class="sortable">Serviço <mat-icon class="sort-icon">{{ sortIcon(activitySortCol(), 'serviceName') }}</mat-icon></th>
                        <th>Método</th>
                        <th>Rota</th>
                        <th (click)="sortActivity('responseStatusCode')" class="sortable">Status <mat-icon class="sort-icon">{{ sortIcon(activitySortCol(), 'responseStatusCode') }}</mat-icon></th>
                        <th (click)="sortActivity('durationMs')" class="sortable">Duração <mat-icon class="sort-icon">{{ sortIcon(activitySortCol(), 'durationMs') }}</mat-icon></th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (row of sortedActivity(); track row.id) {
                        <tr [class.row-error]="row.responseStatusCode >= 400">
                          <td class="col-ts">{{ formatDate(row.accessedAt) }}</td>
                          <td>
                            <div class="user-cell">
                              <span class="user-name">{{ row.userName || '—' }}</span>
                              @if (row.userEmail) {
                                <span class="user-email">{{ row.userEmail }}</span>
                              }
                            </div>
                          </td>
                          <td class="mono">{{ row.ipAddress }}</td>
                          <td><span class="service-chip">{{ shortService(row.serviceName) }}</span></td>
                          <td><span class="method-badge" [class]="methodClass(row.httpMethod)">{{ row.httpMethod }}</span></td>
                          <td class="col-path" [matTooltip]="row.requestPath">{{ row.requestPath | slice:0:50 }}</td>
                          <td><span class="status-badge" [class]="statusClass(row.responseStatusCode)">{{ row.responseStatusCode }}</span></td>
                          <td class="text-right" [class.slow]="row.durationMs > 1000">{{ row.durationMs | number:'1.0-0' }} ms</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          </mat-tab>

          <!-- ── Telas ───────────────────────────────────────── -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">web</mat-icon> Telas
            </ng-template>

            <div class="tab-content">
              <form [formGroup]="screenForm" class="filter-bar" (ngSubmit)="loadScreens()">
                <mat-form-field appearance="outline" class="f-user">
                  <mat-label>Usuário (ID)</mat-label>
                  <input matInput type="number" formControlName="userId" placeholder="ex: 42">
                </mat-form-field>
                <mat-form-field appearance="outline" class="f-take">
                  <mat-label>Máx. registros</mat-label>
                  <mat-select formControlName="take">
                    <mat-option [value]="100">100</mat-option>
                    <mat-option [value]="200">200</mat-option>
                    <mat-option [value]="500">500</mat-option>
                  </mat-select>
                </mat-form-field>
                <div class="filter-actions">
                  <button mat-flat-button color="primary" type="submit">
                    <mat-icon>search</mat-icon> Buscar
                  </button>
                  <button mat-stroked-button type="button" (click)="exportScreens()" [disabled]="!screenLogs().length" matTooltip="Exportar CSV">
                    <mat-icon>download</mat-icon>
                  </button>
                </div>
              </form>

              @if (loadingScreens()) {
                <div class="loading-center"><mat-spinner diameter="32"></mat-spinner></div>
              } @else if (!screenLogs().length) {
                <div class="empty-state"><mat-icon>inbox</mat-icon><p>Nenhum registro encontrado.</p></div>
              } @else {
                <div class="table-meta"><span>{{ screenLogs().length }} registros</span></div>
                <div class="table-scroll">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th (click)="sortScreens('enteredAt')" class="sortable">Entrada <mat-icon class="sort-icon">{{ sortIcon(screenSortCol(), 'enteredAt') }}</mat-icon></th>
                        <th (click)="sortScreens('userName')" class="sortable">Usuário <mat-icon class="sort-icon">{{ sortIcon(screenSortCol(), 'userName') }}</mat-icon></th>
                        <th (click)="sortScreens('screenName')" class="sortable">Tela <mat-icon class="sort-icon">{{ sortIcon(screenSortCol(), 'screenName') }}</mat-icon></th>
                        <th>Rota</th>
                        <th>Saída</th>
                        <th (click)="sortScreens('durationMs')" class="sortable">Tempo <mat-icon class="sort-icon">{{ sortIcon(screenSortCol(), 'durationMs') }}</mat-icon></th>
                        <th>IP</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (row of sortedScreens(); track row.id) {
                        <tr>
                          <td class="col-ts">{{ formatDate(row.enteredAt) }}</td>
                          <td>
                            <div class="user-cell">
                              <span class="user-name">{{ row.userName || '—' }}</span>
                              @if (row.userEmail) { <span class="user-email">{{ row.userEmail }}</span> }
                            </div>
                          </td>
                          <td><span class="screen-chip">{{ row.screenName }}</span></td>
                          <td class="mono small">{{ row.route }}</td>
                          <td class="col-ts">{{ row.exitedAt ? formatDate(row.exitedAt) : '—' }}</td>
                          <td class="text-right">{{ row.durationMs != null ? (row.durationMs / 1000 | number:'1.0-1') + 's' : '—' }}</td>
                          <td class="mono small">{{ row.ipAddress || '—' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          </mat-tab>

          <!-- ── Cliques ─────────────────────────────────────── -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">ads_click</mat-icon> Cliques
            </ng-template>

            <div class="tab-content">
              <form [formGroup]="clickForm" class="filter-bar" (ngSubmit)="loadClicks()">
                <mat-form-field appearance="outline" class="f-user">
                  <mat-label>Usuário (ID)</mat-label>
                  <input matInput type="number" formControlName="userId" placeholder="ex: 42">
                </mat-form-field>
                <mat-form-field appearance="outline" class="f-service">
                  <mat-label>Tela</mat-label>
                  <input matInput formControlName="screen" placeholder="ex: Dashboard">
                </mat-form-field>
                <mat-form-field appearance="outline" class="f-take">
                  <mat-label>Máx. registros</mat-label>
                  <mat-select formControlName="take">
                    <mat-option [value]="100">100</mat-option>
                    <mat-option [value]="200">200</mat-option>
                    <mat-option [value]="500">500</mat-option>
                  </mat-select>
                </mat-form-field>
                <div class="filter-actions">
                  <button mat-flat-button color="primary" type="submit">
                    <mat-icon>search</mat-icon> Buscar
                  </button>
                  <button mat-stroked-button type="button" (click)="exportClicks()" [disabled]="!clickLogs().length" matTooltip="Exportar CSV">
                    <mat-icon>download</mat-icon>
                  </button>
                </div>
              </form>

              @if (loadingClicks()) {
                <div class="loading-center"><mat-spinner diameter="32"></mat-spinner></div>
              } @else if (!clickLogs().length) {
                <div class="empty-state"><mat-icon>inbox</mat-icon><p>Nenhum registro encontrado.</p></div>
              } @else {
                <div class="table-meta"><span>{{ clickLogs().length }} registros</span></div>
                <div class="table-scroll">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th (click)="sortClicks('clickedAt')" class="sortable">Data <mat-icon class="sort-icon">{{ sortIcon(clickSortCol(), 'clickedAt') }}</mat-icon></th>
                        <th (click)="sortClicks('userName')" class="sortable">Usuário <mat-icon class="sort-icon">{{ sortIcon(clickSortCol(), 'userName') }}</mat-icon></th>
                        <th (click)="sortClicks('screenName')" class="sortable">Tela <mat-icon class="sort-icon">{{ sortIcon(clickSortCol(), 'screenName') }}</mat-icon></th>
                        <th>Elemento</th>
                        <th>Tipo</th>
                        <th>Texto</th>
                        <th>IP</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (row of sortedClicks(); track row.id) {
                        <tr>
                          <td class="col-ts">{{ formatDate(row.clickedAt) }}</td>
                          <td>
                            <div class="user-cell">
                              <span class="user-name">{{ row.userName || '—' }}</span>
                              @if (row.userEmail) { <span class="user-email">{{ row.userEmail }}</span> }
                            </div>
                          </td>
                          <td><span class="screen-chip">{{ row.screenName }}</span></td>
                          <td class="mono small">{{ row.elementId || '—' }}</td>
                          <td class="mono small">{{ row.elementType || '—' }}</td>
                          <td class="small">{{ row.elementText || '—' }}</td>
                          <td class="mono small">{{ row.ipAddress || '—' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          </mat-tab>

        </mat-tab-group>
      </div>

    </div>
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 20px; }

    /* Header */
    .page-header {
      display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
      mat-icon { font-size: 30px; width: 30px; height: 30px; color: var(--primary); flex-shrink: 0; }
      h1 { margin: 0; font-size: 22px; font-weight: 700; color: var(--text); }
      .subtitle { font-size: 13px; color: var(--text-sec); }
    }
    .header-actions { margin-left: auto; display: flex; align-items: center; gap: 8px; }
    .period-field { width: 170px; }
    .loading-row { display: flex; justify-content: center; padding: 20px; }

    /* Summary cards */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 14px;
    }
    .s-card {
      background: var(--surface); border-radius: 10px;
      border: 1px solid var(--border); padding: 16px;
      display: flex; align-items: center; gap: 14px;
      box-shadow: var(--card-shadow); border-left: 4px solid;
    }
    .s-card.primary { border-left-color: var(--primary); }
    .s-card.blue    { border-left-color: #29b6f6; }
    .s-card.perf    { border-left-color: #ff9800; }
    .s-card.error   { border-left-color: var(--inactive-color); }

    .s-icon {
      width: 44px; height: 44px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      background: var(--input-bg);
      mat-icon { font-size: 22px; }
    }
    .s-card.primary .s-icon mat-icon { color: var(--primary); }
    .s-card.blue    .s-icon mat-icon { color: #29b6f6; }
    .s-card.perf    .s-icon mat-icon { color: #ff9800; }
    .s-card.error   .s-icon mat-icon { color: var(--inactive-color); }

    .s-info { display: flex; flex-direction: column; gap: 2px; }
    .s-val  { font-size: 22px; font-weight: 700; color: var(--text); }
    .s-label { font-size: 12px; color: var(--text-sec); }

    /* Top row */
    .top-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    .mini-card {
      background: var(--surface); border-radius: 12px;
      border: 1px solid var(--border); padding: 18px;
      box-shadow: var(--card-shadow);
    }
    .card-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 14px; font-weight: 600; color: var(--text);
      margin: 0 0 14px;
      mat-icon { color: var(--primary); font-size: 18px; width: 18px; height: 18px; }
    }
    .bar-row { margin-bottom: 10px; }
    .bar-row:last-child { margin-bottom: 0; }
    .bar-label {
      font-size: 12px; color: var(--text); display: block;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      max-width: 100%; margin-bottom: 3px;
      cursor: default;
    }
    .bar-count {
      font-size: 11px; color: var(--text-sec);
      float: right; margin-top: -18px;
    }
    .bar-wrap { height: 4px; background: var(--input-bg); border-radius: 2px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 2px; transition: width 0.4s ease; min-width: 2px; }
    .primary-bar { background: var(--primary); }
    .blue-bar    { background: #29b6f6; }
    .green-bar   { background: #66bb6a; }

    /* Tabs card */
    .tabs-card {
      background: var(--surface); border-radius: 12px;
      border: 1px solid var(--border); box-shadow: var(--card-shadow);
      overflow: hidden;
    }
    .tab-icon { font-size: 18px; width: 18px; height: 18px; margin-right: 6px; }
    .tab-content { padding: 20px; }

    /* Filter bar */
    .filter-bar { display: flex; flex-wrap: wrap; gap: 10px; align-items: flex-start; margin-bottom: 16px; }
    .f-user    { min-width: 130px; flex: 1; }
    .f-service { min-width: 150px; flex: 2; }
    .f-take    { min-width: 130px; flex: 0 0 130px; }
    .filter-actions { display: flex; align-items: flex-start; gap: 6px; padding-top: 4px; }

    /* Table */
    .table-meta { font-size: 13px; color: var(--text-sec); margin-bottom: 10px; }
    .table-scroll { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .data-table th {
      background: var(--input-bg); color: var(--text-sec);
      padding: 10px 12px; text-align: left; font-weight: 600;
      white-space: nowrap; border-bottom: 1px solid var(--border);
      user-select: none;
    }
    .data-table th.sortable { cursor: pointer; }
    .data-table th.sortable:hover { background: var(--row-hover); color: var(--text); }
    .data-table td {
      padding: 9px 12px; border-bottom: 1px solid var(--border);
      color: var(--text); vertical-align: middle;
    }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr:hover td { background: var(--row-hover); }
    .row-error td { border-left: 3px solid var(--inactive-color); }

    .sort-icon { font-size: 14px; width: 14px; height: 14px; vertical-align: middle; opacity: 0.6; }
    .col-ts   { white-space: nowrap; font-size: 12px; color: var(--text-sec); min-width: 140px; }
    .col-path { max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .text-right { text-align: right; }
    .mono  { font-family: monospace; font-size: 12px; }
    .small { font-size: 12px; }
    .slow  { color: #ff9800; font-weight: 600; }

    /* Chips & badges */
    .user-cell { display: flex; flex-direction: column; gap: 1px; min-width: 120px; }
    .user-name  { font-size: 13px; color: var(--text); font-weight: 500; }
    .user-email { font-size: 11px; color: var(--text-sec); }

    .service-chip {
      background: var(--input-bg); border: 1px solid var(--border);
      border-radius: 4px; padding: 2px 7px; font-size: 11px;
      color: var(--text-sec); white-space: nowrap;
    }
    .screen-chip {
      background: rgba(41,182,246,.12); color: #29b6f6;
      border-radius: 4px; padding: 2px 7px; font-size: 11px;
      font-weight: 500; white-space: nowrap;
    }

    .method-badge {
      font-size: 11px; font-weight: 700; padding: 2px 7px;
      border-radius: 4px; white-space: nowrap;
    }
    .method-get    { background: rgba(102,187,106,.15); color: #66bb6a; }
    .method-post   { background: rgba(41,182,246,.15);  color: #29b6f6; }
    .method-put    { background: rgba(255,152,0,.15);   color: #ff9800; }
    .method-delete { background: rgba(239,83,80,.15);   color: #ef5350; }
    .method-other  { background: var(--input-bg);       color: var(--text-sec); }

    .status-badge {
      font-size: 12px; font-weight: 600; padding: 2px 8px;
      border-radius: 10px; white-space: nowrap;
    }
    .badge-2xx { background: var(--active-bg);   color: var(--active-color); }
    .badge-4xx { background: rgba(244,67,54,.12); color: #ef5350; }
    .badge-5xx { background: var(--inactive-bg);  color: var(--inactive-color); }
    .badge-unk { background: var(--input-bg);     color: var(--text-sec); }

    /* Empty */
    .loading-center { display: flex; justify-content: center; padding: 40px; }
    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      gap: 8px; padding: 48px; color: var(--text-sec);
      mat-icon { font-size: 48px; width: 48px; height: 48px; color: var(--text-ter); }
    }

    /* Responsive */
    @media (max-width: 960px) { .top-row { grid-template-columns: 1fr; } }
    @media (max-width: 600px) { .summary-grid { grid-template-columns: 1fr 1fr; } }

    /* MDC overrides */
    ::ng-deep .mat-mdc-form-field .mat-mdc-text-field-wrapper { background: var(--input-bg) !important; }
    ::ng-deep .mdc-text-field__input, ::ng-deep input { color: var(--text) !important; }
    ::ng-deep .mdc-floating-label { color: var(--text-sec) !important; }
    ::ng-deep .mdc-notched-outline__leading,
    ::ng-deep .mdc-notched-outline__notch,
    ::ng-deep .mdc-notched-outline__trailing { border-color: var(--border) !important; }
    ::ng-deep .mat-mdc-select-value-text { color: var(--text) !important; }
    ::ng-deep .mat-mdc-tab-label-container { border-bottom: 1px solid var(--border) !important; }
    ::ng-deep .mdc-tab__text-label { color: var(--text-sec) !important; }
    ::ng-deep .mdc-tab--active .mdc-tab__text-label { color: var(--primary) !important; }
    ::ng-deep .mdc-tab-indicator__content--underline { border-color: var(--primary) !important; }
    ::ng-deep .mat-mdc-tab-body-wrapper { padding: 0 !important; }
  `]
})
export class MonitoringComponent implements OnInit {
  private svc = inject(TrackingService);
  private fb = inject(FormBuilder);

  selectedDays = signal(7);
  loadingSummary = signal(false);
  loadingActivity = signal(false);
  loadingScreens = signal(false);
  loadingClicks = signal(false);

  summary = signal<TrackingSummary | null>(null);
  activityLogs = signal<ActivityLog[]>([]);
  screenLogs = signal<ScreenLog[]>([]);
  clickLogs = signal<ClickLog[]>([]);

  activitySortCol = signal<keyof ActivityLog>('accessedAt');
  activitySortDir = signal<SortDir>('desc');
  screenSortCol = signal<keyof ScreenLog>('enteredAt');
  screenSortDir = signal<SortDir>('desc');
  clickSortCol = signal<keyof ClickLog>('clickedAt');
  clickSortDir = signal<SortDir>('desc');

  sortedActivity = computed(() => this.sort(this.activityLogs(), this.activitySortCol(), this.activitySortDir()));
  sortedScreens  = computed(() => this.sort(this.screenLogs(),   this.screenSortCol(),  this.screenSortDir()));
  sortedClicks   = computed(() => this.sort(this.clickLogs(),    this.clickSortCol(),   this.clickSortDir()));

  maxEndpointCalls = computed(() => Math.max(...(this.summary()?.topEndpoints.map(e => e.calls) ?? [1]), 1));
  maxScreenViews   = computed(() => Math.max(...(this.summary()?.topScreens.map(s => s.views) ?? [1]), 1));
  maxClicks        = computed(() => Math.max(...(this.summary()?.topClickedElements.map(c => c.clicks) ?? [1]), 1));

  activityForm: FormGroup = this.fb.group({ userId: [''], service: [''], take: [200] });
  screenForm:   FormGroup = this.fb.group({ userId: [''], take: [200] });
  clickForm:    FormGroup = this.fb.group({ userId: [''], screen: [''], take: [200] });

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.loadSummary();
    this.loadActivity();
    this.loadScreens();
    this.loadClicks();
  }

  onPeriodChange(days: number) {
    this.selectedDays.set(days);
    this.loadAll();
  }

  loadSummary() {
    this.loadingSummary.set(true);
    const { from, to } = this.dateRange();
    this.svc.getSummary({ from, to }).subscribe({
      next: s => { this.summary.set(s); this.loadingSummary.set(false); },
      error: ()  => this.loadingSummary.set(false),
    });
  }

  loadActivity() {
    this.loadingActivity.set(true);
    const v = this.activityForm.value;
    const { from, to } = this.dateRange();
    this.svc.getActivityLogs({
      from, to,
      userId:  v.userId || undefined,
      service: v.service || undefined,
      take:    v.take,
    }).subscribe({
      next: r => { this.activityLogs.set(r); this.loadingActivity.set(false); },
      error: () => this.loadingActivity.set(false),
    });
  }

  loadScreens() {
    this.loadingScreens.set(true);
    const v = this.screenForm.value;
    const { from, to } = this.dateRange();
    this.svc.getScreenLogs({ from, to, userId: v.userId || undefined, take: v.take }).subscribe({
      next: r => { this.screenLogs.set(r); this.loadingScreens.set(false); },
      error: () => this.loadingScreens.set(false),
    });
  }

  loadClicks() {
    this.loadingClicks.set(true);
    const v = this.clickForm.value;
    const { from, to } = this.dateRange();
    this.svc.getClickLogs({ from, to, userId: v.userId || undefined, screen: v.screen || undefined, take: v.take }).subscribe({
      next: r => { this.clickLogs.set(r); this.loadingClicks.set(false); },
      error: () => this.loadingClicks.set(false),
    });
  }

  sortActivity(col: keyof ActivityLog) { this.toggleSort(col, this.activitySortCol, this.activitySortDir); }
  sortScreens(col: keyof ScreenLog)    { this.toggleSort(col, this.screenSortCol,   this.screenSortDir); }
  sortClicks(col: keyof ClickLog)      { this.toggleSort(col, this.clickSortCol,    this.clickSortDir); }

  private toggleSort<T>(col: keyof T, colSig: ReturnType<typeof signal<keyof T>>, dirSig: ReturnType<typeof signal<SortDir>>) {
    if (colSig() === col) dirSig.set(dirSig() === 'asc' ? 'desc' : 'asc');
    else { colSig.set(col); dirSig.set('desc'); }
  }

  private sort<T>(arr: T[], col: keyof T, dir: SortDir): T[] {
    return [...arr].sort((a, b) => {
      const av = a[col] ?? '';
      const bv = b[col] ?? '';
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return dir === 'asc' ? cmp : -cmp;
    });
  }

  sortIcon(current: string, col: string): string {
    if (current !== col) return 'unfold_more';
    return 'expand_more';
  }

  pct(val: number, max: number): number { return max > 0 ? (val / max) * 100 : 0; }

  formatDate(iso: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  }

  shortService(name: string): string {
    return name.replace('ExtraNetWeviTech.', '').replace('AppService', '').replace('Service', '');
  }

  methodClass(method: string): string {
    const m = (method || '').toUpperCase();
    if (m === 'GET')    return 'method-badge method-get';
    if (m === 'POST')   return 'method-badge method-post';
    if (m === 'PUT' || m === 'PATCH') return 'method-badge method-put';
    if (m === 'DELETE') return 'method-badge method-delete';
    return 'method-badge method-other';
  }

  statusClass(code: number): string {
    if (code >= 200 && code < 300) return 'status-badge badge-2xx';
    if (code >= 400 && code < 500) return 'status-badge badge-4xx';
    if (code >= 500)               return 'status-badge badge-5xx';
    return 'status-badge badge-unk';
  }

  private dateRange() {
    const to  = new Date();
    const from = new Date();
    from.setDate(from.getDate() - this.selectedDays());
    return { from: from.toISOString(), to: to.toISOString() };
  }

  exportActivity() {
    const cols = ['Data', 'Usuário', 'Email', 'IP', 'Serviço', 'Método', 'Rota', 'Status', 'Duração (ms)'];
    const rows = this.sortedActivity().map(r => [
      this.formatDate(r.accessedAt), r.userName ?? '', r.userEmail ?? '',
      r.ipAddress, this.shortService(r.serviceName), r.httpMethod,
      r.requestPath, r.responseStatusCode, r.durationMs,
    ]);
    this.downloadCsv('activity', cols, rows);
  }

  exportScreens() {
    const cols = ['Entrada', 'Usuário', 'Email', 'Tela', 'Rota', 'Saída', 'Duração (s)', 'IP'];
    const rows = this.sortedScreens().map(r => [
      this.formatDate(r.enteredAt), r.userName ?? '', r.userEmail ?? '',
      r.screenName, r.route,
      r.exitedAt ? this.formatDate(r.exitedAt) : '',
      r.durationMs != null ? (r.durationMs / 1000).toFixed(1) : '',
      r.ipAddress ?? '',
    ]);
    this.downloadCsv('telas', cols, rows);
  }

  exportClicks() {
    const cols = ['Data', 'Usuário', 'Email', 'Tela', 'Rota', 'Elemento ID', 'Tipo', 'Texto', 'IP'];
    const rows = this.sortedClicks().map(r => [
      this.formatDate(r.clickedAt), r.userName ?? '', r.userEmail ?? '',
      r.screenName, r.route,
      r.elementId ?? '', r.elementType ?? '', r.elementText ?? '', r.ipAddress ?? '',
    ]);
    this.downloadCsv('cliques', cols, rows);
  }

  private downloadCsv(name: string, cols: string[], rows: (string | number)[][]) {
    const lines = [cols, ...rows].map(r =>
      r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
    );
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monitoring-${name}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
