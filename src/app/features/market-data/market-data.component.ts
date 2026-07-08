import { Component, OnInit, WritableSignal, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { Observable } from 'rxjs';
import { MarketDataService } from '../../core/services/market-data.service';

interface Option { value: string; label: string; }

interface TabState {
  loading: WritableSignal<boolean>;
  error: WritableSignal<string | null>;
  data: WritableSignal<any | null>;
}

function createTabState(): TabState {
  return { loading: signal(false), error: signal<string | null>(null), data: signal<any | null>(null) };
}

const PRIORITY_COLUMNS = [
  'symbol', 'shortName', 'longName', 'name', 'title', 'content.title', 'headline',
  'regularMarketPrice', 'price', 'regularMarketChange', 'regularMarketChangePercent',
  'changePercent', 'marketCap', 'region', 'category', 'exchange', 'currency',
  'pubDate', 'content.pubDate', 'publishTs', 'providerPublishTime',
];

interface SpotlightQuote {
  name: string;
  symbol: string;
  price: number | null;
  change: number | null;
  changePct: number | null;
  dayLow?: number;
  dayHigh?: number;
  weekLow?: number;
  weekHigh?: number;
  volume?: number;
}

@Component({
  selector: 'app-market-data',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
  ],
  template: `
    <div class="page-container market-dashboard">
      <div class="page-header">
        <mat-icon>show_chart</mat-icon>
        <h1>Mercado Financeiro</h1>
        <span class="subtitle">Cotações, screeners e notícias via Yahoo Finance</span>
      </div>

      <div class="quick-nav">
        <button type="button" class="nav-chip" (click)="scrollToSection('destaque')">
          <mat-icon>star</mat-icon>Ativo em Destaque
        </button>
        <button type="button" class="nav-chip" (click)="scrollToSection('screeners')">
          <mat-icon>grid_view</mat-icon>Screeners
        </button>
        <button type="button" class="nav-chip" (click)="scrollToSection('noticias')">
          <mat-icon>newspaper</mat-icon>Notícias
        </button>
      </div>

      <!-- ═══════════════ ATIVO EM DESTAQUE ═══════════════ -->
      <section id="destaque" class="dash-section">
        <h2 class="dash-title"><mat-icon>star</mat-icon>Ativo em Destaque</h2>

        <div class="card-container">
          <form [formGroup]="symbolQueryForm" (ngSubmit)="loadSpotlight()" class="search-form">
            <div class="fields-row">
              <mat-form-field appearance="outline" class="field-symbol-wide">
                <mat-label>Símbolo ou nome da empresa</mat-label>
                <mat-icon matPrefix>search</mat-icon>
                <input matInput formControlName="query" placeholder="Ex: AAPL, Apple, Petrobras">
              </mat-form-field>
              <button mat-flat-button color="primary" type="submit" class="btn-consultar" [disabled]="profile.loading()">
                @if (profile.loading()) { <mat-spinner diameter="20" class="btn-spinner"></mat-spinner> } @else { <mat-icon>search</mat-icon> }
                {{ profile.loading() ? 'Carregando...' : 'Carregar' }}
              </button>
            </div>
          </form>

          @if (searchSuggestions().length) {
            <div class="chips-row">
              <span class="chips-label">Resultados da busca:</span>
              <mat-chip-set>
                @for (s of searchSuggestions(); track s) { <mat-chip (click)="quickProfile(s)">{{ s }}</mat-chip> }
              </mat-chip-set>
            </div>
          }
        </div>

        @if (spotlightQuote(); as q) {
          <div class="quote-card">
            <div class="quote-identity">
              <h3>{{ q.name }}</h3>
              <span class="quote-symbol">{{ q.symbol }}</span>
            </div>
            <div class="quote-price-block">
              <span class="quote-price">{{ formatValue(q.price) }}</span>
              @if (q.change !== null) {
                <span class="quote-change" [class.up]="q.change! >= 0" [class.down]="q.change! < 0">
                  <mat-icon>{{ q.change! >= 0 ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
                  {{ formatValue(q.change) }} ({{ formatValue(q.changePct) }}%)
                </span>
              }
            </div>
            <div class="quote-meta-row">
              @if (q.dayLow !== undefined) { <span>Dia: {{ formatValue(q.dayLow) }} – {{ formatValue(q.dayHigh) }}</span> }
              @if (q.weekLow !== undefined) { <span>52 sem: {{ formatValue(q.weekLow) }} – {{ formatValue(q.weekHigh) }}</span> }
              @if (q.volume !== undefined) { <span>Volume: {{ formatValue(q.volume) }}</span> }
            </div>
          </div>
        }

        <div class="card-container sparkline-card">
          <div class="sparkline-header">
            <span class="mini-title">Histórico de Preço</span>
            <mat-form-field appearance="outline" class="field-select-sm">
              <mat-select [value]="chartRange()" (selectionChange)="onRangeChange($event.value)">
                @for (r of chartRanges; track r) { <mat-option [value]="r">{{ r }}</mat-option> }
              </mat-select>
            </mat-form-field>
          </div>
          @if (chart.loading()) {
            <div class="loading-center"><mat-spinner diameter="28"></mat-spinner></div>
          } @else if (sparklinePoints()) {
            <svg viewBox="0 0 600 100" preserveAspectRatio="none" class="sparkline">
              <polyline [attr.points]="sparklinePoints()" fill="none" stroke="var(--primary-dark, #3d5afe)" stroke-width="2"></polyline>
            </svg>
          } @else if (chart.error()) {
            <div class="empty-state small"><mat-icon>error_outline</mat-icon><p>{{ chart.error() }}</p></div>
          } @else {
            <div class="empty-state small"><mat-icon>show_chart</mat-icon><p>Sem histórico disponível para este símbolo/período.</p></div>
          }
        </div>

        <div class="profile-grid">
          <div>
            <p class="mini-title">Perfil</p>
            <ng-container *ngTemplateOutlet="resultPanel; context: { state: profile }"></ng-container>
          </div>
          <div>
            <p class="mini-title">Informações</p>
            <ng-container *ngTemplateOutlet="resultPanel; context: { state: symbolInfo }"></ng-container>
          </div>
          <div>
            <p class="mini-title">Fundamentos</p>
            <ng-container *ngTemplateOutlet="resultPanel; context: { state: fundamental }"></ng-container>
          </div>
        </div>

        @if (relatedSymbols().length) {
          <div class="chips-row">
            <span class="chips-label">Relacionados:</span>
            <mat-chip-set>
              @for (s of relatedSymbols(); track s) { <mat-chip (click)="quickProfile(s)">{{ s }}</mat-chip> }
            </mat-chip-set>
          </div>
        }

        <div>
          <p class="mini-title">Notícias sobre {{ activeSymbol() }}</p>
          <ng-container *ngTemplateOutlet="resultPanel; context: { state: newsBySymbol }"></ng-container>
        </div>
      </section>

      <!-- ═══════════════ SCREENERS ═══════════════ -->
      <section id="screeners" class="dash-section">
        <h2 class="dash-title"><mat-icon>grid_view</mat-icon>Screeners de Mercado</h2>
        <p class="dash-note">
          <mat-icon class="label-icon">info</mat-icon>
          A visão geral consolidada de mercado (endpoint <code>market/overview</code>) está indisponível no momento —
          o próprio provedor de dados (RapidAPI) retorna erro para qualquer parâmetro. Não é uma falha do nosso serviço.
        </p>

        <div class="screener-grid">
          <div class="screener-card">
            <div class="screener-head">
              <span class="screener-title"><mat-icon>trending_up</mat-icon>Ações</span>
              <div class="inline-filters">
                <mat-select class="mini-select" [value]="equityForm.value.screenerId" (selectionChange)="equityForm.patchValue({screenerId: $event.value}); loadEquity()">
                  @for (o of equityScreeners; track o.value) { <mat-option [value]="o.value">{{ o.label }}</mat-option> }
                </mat-select>
                <mat-select class="mini-select" [value]="equityForm.value.region" (selectionChange)="equityForm.patchValue({region: $event.value}); loadEquity()">
                  @for (o of regions; track o.value) { <mat-option [value]="o.value">{{ o.label }}</mat-option> }
                </mat-select>
              </div>
            </div>
            <ng-container *ngTemplateOutlet="resultPanel; context: { state: equity }"></ng-container>
          </div>

          <div class="screener-card">
            <div class="screener-head">
              <span class="screener-title"><mat-icon>pie_chart</mat-icon>ETFs</span>
              <div class="inline-filters">
                <mat-select class="mini-select" [value]="etfForm.value.region" (selectionChange)="etfForm.patchValue({region: $event.value}); loadEtf()">
                  @for (o of regions; track o.value) { <mat-option [value]="o.value">{{ o.label }}</mat-option> }
                </mat-select>
              </div>
            </div>
            <ng-container *ngTemplateOutlet="resultPanel; context: { state: etf }"></ng-container>
          </div>

          <div class="screener-card">
            <div class="screener-head">
              <span class="screener-title"><mat-icon>currency_bitcoin</mat-icon>Criptomoedas</span>
              <div class="inline-filters">
                <mat-select class="mini-select" [value]="cryptoForm.value.screenerId" (selectionChange)="cryptoForm.patchValue({screenerId: $event.value}); loadCrypto()">
                  @for (o of cryptoScreeners; track o.value) { <mat-option [value]="o.value">{{ o.label }}</mat-option> }
                </mat-select>
              </div>
            </div>
            <ng-container *ngTemplateOutlet="resultPanel; context: { state: crypto }"></ng-container>
          </div>

          <div class="screener-card">
            <div class="screener-head">
              <span class="screener-title"><mat-icon>tune</mat-icon>Opções</span>
              <div class="inline-filters">
                <mat-select class="mini-select" [value]="optionForm.value.screenerId" (selectionChange)="optionForm.patchValue({screenerId: $event.value}); loadOption()">
                  @for (o of optionScreeners; track o.value) { <mat-option [value]="o.value">{{ o.label }}</mat-option> }
                </mat-select>
                <mat-select class="mini-select" [value]="optionForm.value.region" (selectionChange)="optionForm.patchValue({region: $event.value}); loadOption()">
                  @for (o of regions; track o.value) { <mat-option [value]="o.value">{{ o.label }}</mat-option> }
                </mat-select>
              </div>
            </div>
            <ng-container *ngTemplateOutlet="resultPanel; context: { state: option }"></ng-container>
          </div>

          <div class="screener-card">
            <div class="screener-head">
              <span class="screener-title"><mat-icon>savings</mat-icon>Fundos</span>
              <div class="inline-filters">
                <mat-select class="mini-select" [value]="mutualFundForm.value.screenerId" (selectionChange)="mutualFundForm.patchValue({screenerId: $event.value}); loadMutualFund()">
                  @for (o of mutualFundScreeners; track o.value) { <mat-option [value]="o.value">{{ o.label }}</mat-option> }
                </mat-select>
                <mat-select class="mini-select" [value]="mutualFundForm.value.region" (selectionChange)="mutualFundForm.patchValue({region: $event.value}); loadMutualFund()">
                  @for (o of regions; track o.value) { <mat-option [value]="o.value">{{ o.label }}</mat-option> }
                </mat-select>
              </div>
            </div>
            <ng-container *ngTemplateOutlet="resultPanel; context: { state: mutualFund }"></ng-container>
          </div>
        </div>
      </section>

      <!-- ═══════════════ NOTÍCIAS ═══════════════ -->
      <section id="noticias" class="dash-section">
        <h2 class="dash-title"><mat-icon>newspaper</mat-icon>Notícias</h2>

        <div class="news-grid">
          <div class="card-container">
            <div class="screener-head">
              <span class="screener-title"><mat-icon>local_fire_department</mat-icon>Destaques</span>
              <button mat-icon-button type="button" (click)="loadHotNews()" matTooltip="Atualizar">
                <mat-icon>refresh</mat-icon>
              </button>
            </div>
            <ng-container *ngTemplateOutlet="resultPanel; context: { state: hotNews }"></ng-container>
          </div>

          <div class="card-container">
            <p class="section-label"><mat-icon class="label-icon">search</mat-icon>Buscar por Palavra-chave</p>
            <form [formGroup]="newsKeywordForm" (ngSubmit)="loadNewsByKeyword()" class="search-form">
              <div class="fields-row">
                <mat-form-field appearance="outline" class="field-symbol">
                  <mat-label>Palavra-chave</mat-label>
                  <input matInput formControlName="keyword" placeholder="Ex: inflação, eleições, Fed">
                </mat-form-field>
                <button mat-flat-button color="primary" type="submit" class="btn-consultar" [disabled]="newsByKeyword.loading()">
                  @if (newsByKeyword.loading()) { <mat-spinner diameter="20" class="btn-spinner"></mat-spinner> } @else { <mat-icon>search</mat-icon> }
                  Buscar
                </button>
              </div>
            </form>
            <ng-container *ngTemplateOutlet="resultPanel; context: { state: newsByKeyword }"></ng-container>
          </div>
        </div>
      </section>
    </div>

    <!-- ═══════════════ TEMPLATE GENÉRICO DE RESULTADO ═══════════════ -->
    <ng-template #resultPanel let-state="state">
      @if (state.error() && !state.loading()) {
        <div class="error-card">
          <mat-icon>error_outline</mat-icon>
          <div class="error-body">
            <p class="error-title">Falha na consulta</p>
            <p class="error-msg">{{ state.error() }}</p>
          </div>
          <button mat-icon-button (click)="state.error.set(null)" matTooltip="Fechar">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      }
      @if (state.data(); as data) {
        @if (findRows(data); as rows) {
          @if (rows.length) {
            <div class="result-wrapper compact">
              <div class="table-meta"><span>{{ rows.length }} registro(s)</span></div>
              <div class="table-scroll">
                <table class="log-table">
                  <thead>
                    <tr>
                      @for (col of tableColumns(rows); track col) { <th>{{ prettyLabel(col) }}</th> }
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of rows; track $index) {
                      <tr>
                        @for (col of tableColumns(rows); track col) { <td>{{ formatValue(cellValue(row, col), col) }}</td> }
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          } @else {
            <div class="empty-state small">
              <mat-icon>inbox</mat-icon>
              <p>Nenhum resultado encontrado.</p>
            </div>
          }
        } @else {
          <div class="result-wrapper compact">
            <div class="info-field-grid">
              @for (kv of kvRows(data); track kv.label) {
                <div class="info-field">
                  <span class="f-label">{{ kv.label }}</span>
                  <span class="f-value">{{ formatValue(kv.value) }}</span>
                </div>
              }
            </div>
          </div>
        }
      } @else if (state.loading()) {
        <div class="loading-center"><mat-spinner diameter="32"></mat-spinner></div>
      }
    </ng-template>
  `,
  styles: [`
    .subtitle { font-size: 13px; color: var(--text-sec); margin-left: 8px; }
    .search-form { width: 100%; }

    .fields-row { display: flex; gap: 16px; align-items: flex-start; flex-wrap: wrap; }
    .field-select { flex: 0 0 200px; }
    .field-select-wide { flex: 1 1 320px; min-width: 260px; }
    .field-symbol { flex: 0 0 260px; }
    .field-symbol-wide { flex: 1 1 320px; min-width: 260px; }
    .field-select-sm { width: 110px; }

    .btn-consultar {
      height: 56px; padding: 0 24px; font-size: 15px; font-weight: 600;
      display: flex; align-items: center; gap: 8px; flex-shrink: 0; margin-top: 4px;
    }

    /* ── navegação rápida ── */
    .quick-nav { display: flex; gap: 10px; flex-wrap: wrap; margin: 4px 0 20px; }
    .nav-chip {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 16px; border-radius: 20px; border: 1px solid var(--border);
      background: var(--surface); color: var(--text-sec); font-size: 13px; font-weight: 600;
      cursor: pointer; transition: all 0.15s;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }
    .nav-chip:hover { background: rgba(61, 90, 254, 0.1); color: var(--primary-dark, #3d5afe); border-color: var(--primary-dark, #3d5afe); }

    /* ── seções do dashboard ── */
    .dash-section { margin-bottom: 36px; scroll-margin-top: 20px; }
    .dash-title {
      display: flex; align-items: center; gap: 8px; font-size: 17px; font-weight: 700;
      color: var(--text); margin-bottom: 14px;
      mat-icon { color: var(--primary-dark, #3d5afe); }
    }
    .dash-note {
      display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-sec);
      background: rgba(255, 167, 38, 0.08); border: 1px solid rgba(255, 167, 38, 0.25);
      border-radius: 8px; padding: 10px 14px; margin-bottom: 16px;
      mat-icon { color: #ffa726; flex-shrink: 0; }
      code { font-family: monospace; background: rgba(0,0,0,0.15); padding: 1px 5px; border-radius: 4px; }
    }

    .error-card {
      display: flex; align-items: flex-start; gap: 14px;
      background: rgba(244, 67, 54, 0.08); border: 1px solid rgba(244, 67, 54, 0.3);
      border-radius: 12px; padding: 16px 20px; margin-bottom: 12px;
    }
    .error-card > mat-icon { color: #f44336; font-size: 22px; width: 22px; height: 22px; flex-shrink: 0; margin-top: 2px; }
    .error-body { flex: 1; }
    .error-title { font-weight: 600; font-size: 14px; color: #f44336 !important; margin-bottom: 4px; }
    .error-msg { font-size: 13px; color: var(--text-sec) !important; }

    .loading-center { display: flex; justify-content: center; padding: 32px; }

    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      gap: 8px; padding: 32px; color: var(--text-sec);
      mat-icon { font-size: 36px; width: 36px; height: 36px; color: var(--text-ter); }
      &.small { padding: 20px; }
    }

    .result-wrapper {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 14px; overflow: hidden; box-shadow: var(--card-shadow);
      margin-bottom: 12px;
      &.compact { padding: 4px 0; }
    }

    .table-meta { display: flex; justify-content: space-between; padding: 10px 16px; font-size: 12px; color: var(--text-sec); }
    .table-scroll { overflow-x: auto; }
    .log-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .log-table th {
      background: var(--input-bg, rgba(0,0,0,0.06)); color: var(--text-sec);
      padding: 10px 12px; text-align: left; font-weight: 600;
      white-space: nowrap; border-bottom: 1px solid var(--border);
    }
    .log-table td { padding: 9px 12px; border-bottom: 1px solid var(--border); color: var(--text); }
    .log-table tr:last-child td { border-bottom: none; }
    .log-table tr:hover td { background: var(--row-hover, rgba(0,0,0,0.03)); }

    .info-field-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 14px 20px; padding: 18px 20px;
    }
    .info-field { display: flex; flex-direction: column; gap: 4px; }
    .f-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; color: var(--text-ter); }
    .f-value { font-size: 14px; font-weight: 500; color: var(--text); word-break: break-word; }

    .section-label {
      font-size: 11px !important; font-weight: 700; text-transform: uppercase;
      letter-spacing: 1px; color: var(--body-label) !important;
      display: flex; align-items: center; gap: 6px; margin-bottom: 12px;
    }
    .label-icon { font-size: 15px; width: 15px; height: 15px; }

    .profile-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin: 16px 0; }
    .mini-title { font-size: 12px; font-weight: 700; color: var(--text-sec); margin-bottom: 6px; }

    .chips-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin: 12px 0; }
    .chips-label { font-size: 12px; color: var(--text-sec); }

    /* ── card de cotação ── */
    .quote-card {
      background: var(--surface); border: 1px solid var(--border); border-radius: 14px;
      box-shadow: var(--card-shadow); padding: 20px 24px; margin-bottom: 16px;
      display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;
    }
    .quote-identity h3 { font-size: 18px; font-weight: 700; color: var(--text); margin-bottom: 2px; }
    .quote-symbol { font-size: 12px; font-weight: 600; letter-spacing: 1px; color: var(--text-sec); }
    .quote-price-block { display: flex; align-items: baseline; gap: 12px; }
    .quote-price { font-size: 28px; font-weight: 700; color: var(--text); }
    .quote-change {
      display: flex; align-items: center; gap: 4px; font-size: 14px; font-weight: 600; padding: 4px 10px; border-radius: 8px;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &.up { color: var(--active-color); background: var(--active-bg); }
      &.down { color: var(--inactive-color); background: var(--inactive-bg); }
    }
    .quote-meta-row { display: flex; gap: 16px; flex-wrap: wrap; font-size: 12px; color: var(--text-sec); }

    .sparkline-card { padding: 16px 20px; margin-bottom: 16px; }
    .sparkline-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
    .sparkline { width: 100%; height: 100px; display: block; }

    /* ── grid de screeners ── */
    .screener-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 18px; }
    .screener-card {
      background: var(--surface); border: 1px solid var(--border); border-radius: 14px;
      box-shadow: var(--card-shadow); padding: 16px; display: flex; flex-direction: column;
    }
    .screener-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; }
    .screener-title {
      display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: var(--text);
      mat-icon { font-size: 17px; width: 17px; height: 17px; color: var(--primary-dark, #3d5afe); }
    }
    .inline-filters { display: flex; gap: 8px; flex-wrap: wrap; }
    .mini-select {
      font-size: 12px; border: 1px solid var(--border); border-radius: 8px; padding: 4px 8px;
      background: var(--input-bg, transparent); max-width: 180px;
    }

    .news-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 18px; align-items: start; }

    @media (max-width: 768px) {
      .fields-row { flex-direction: column; }
      .field-select, .field-select-wide, .field-symbol, .field-symbol-wide { flex: 1 1 100%; }
      .btn-consultar { width: 100%; justify-content: center; margin-top: 0; }
      .quote-card { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class MarketDataComponent implements OnInit {
  private service = inject(MarketDataService);

  readonly regions: Option[] = [
    { value: 'us', label: 'Estados Unidos' },
    { value: 'europe', label: 'Europa' },
    { value: 'asia', label: 'Ásia' },
  ];

  readonly equityScreeners: Option[] = [
    { value: 'MOST_ACTIVES', label: 'Mais Ativas' },
    { value: 'DAY_GAINERS', label: 'Maiores Altas do Dia' },
    { value: 'DAY_LOSERS', label: 'Maiores Baixas do Dia' },
    { value: 'FIFTY_TWO_WK_GAINERS', label: 'Altas em 52 Semanas' },
    { value: 'FIFTY_TWO_WK_LOSERS', label: 'Baixas em 52 Semanas' },
    { value: 'LARGEST_MARKET_CAP', label: 'Maior Valor de Mercado' },
    { value: 'HIGH_DIVIDEND_YIELD', label: 'Maior Dividend Yield' },
    { value: 'HIGH_YIELD_HIGH_RETURN', label: 'Alto Retorno / Yield' },
    { value: 'EARNINGS_SURPRISES_BEAT', label: 'Surpresas Positivas de Lucro' },
    { value: 'EARNINGS_SURPRISES_MISSED', label: 'Surpresas Negativas de Lucro' },
    { value: 'NET_NET_STRATEGY', label: 'Estratégia Net-Net' },
    { value: 'THE_ACQUIRERS_MULTIPLE', label: 'Acquirer\'s Multiple' },
  ];

  readonly cryptoScreeners: Option[] = [
    { value: 'FIFTY_TWO_WK_GAINERS_CRYPTOCURRENCIES', label: 'Altas em 52 Semanas' },
    { value: 'FIFTY_TWO_WK_LOSERS_CRYPTOCURRENCIES', label: 'Baixas em 52 Semanas' },
    { value: 'DAY_GAINERS_CRYPTOCURRENCIES', label: 'Maiores Altas do Dia' },
    { value: 'DAY_LOSERS_CRYPTOCURRENCIES', label: 'Maiores Baixas do Dia' },
    { value: 'LARGEST_MARKET_CAP_CRYPTOCURRENCIES', label: 'Maior Valor de Mercado' },
    { value: 'MOST_ACTIVES_CRYPTOCURRENCIES', label: 'Mais Ativas' },
  ];

  readonly optionScreeners: Option[] = [
    { value: 'MOST_ACTIVES_OPTIONS', label: 'Mais Ativas' },
    { value: 'DAY_GAINERS_OPTIONS', label: 'Maiores Altas do Dia' },
    { value: 'DAY_LOSERS_OPTIONS', label: 'Maiores Baixas do Dia' },
    { value: 'TOP_OPTIONS_OPEN_INTEREST', label: 'Maior Interesse em Aberto' },
    { value: 'TOP_OPTIONS_IMPLIED_VOLATALITY', label: 'Maior Volatilidade Implícita' },
  ];

  readonly mutualFundScreeners: Option[] = [
    { value: 'DAY_GAINERS_MUTUAL_FUNDS', label: 'Maiores Altas do Dia' },
    { value: 'DAY_LOSERS_MUTUAL_FUNDS', label: 'Maiores Baixas do Dia' },
    { value: 'FIFTY_TWO_WK_GAINERS_MUTUAL_FUNDS', label: 'Altas em 52 Semanas' },
    { value: 'FIFTY_TWO_WK_LOSERS_MUTUAL_FUNDS', label: 'Baixas em 52 Semanas' },
    { value: 'TOP_PERFORMING_MUTUAL_FUNDS', label: 'Melhor Desempenho' },
    { value: 'BEST_HIST_PERFORMANCE_MUTUAL_FUNDS', label: 'Melhor Histórico' },
    { value: 'LOW_RISK_MUTUAL_FUNDS', label: 'Baixo Risco' },
    { value: 'CHEAPEST_MUTUAL_FUNDS', label: 'Mais Baratos' },
    { value: 'LOWEST_PE_RATIO_MUTUAL_FUNDS', label: 'Menor P/L' },
    { value: 'BOND_MUTUAL_FUNDS', label: 'Fundos de Renda Fixa' },
  ];

  readonly chartRanges = ['1d', '5d', '1mo', '6mo', 'ytd', '1y', '5y', 'max'];

  // ── estado ──
  equity = createTabState();
  etf = createTabState();
  crypto = createTabState();
  option = createTabState();
  mutualFund = createTabState();
  searchSymbol = createTabState();
  profile = createTabState();
  symbolInfo = createTabState();
  fundamental = createTabState();
  relatedState = createTabState();
  chart = createTabState();
  hotNews = createTabState();
  newsBySymbol = createTabState();
  newsByKeyword = createTabState();

  activeSymbol = signal('AAPL');
  chartRange = signal('1mo');

  relatedSymbols = computed<string[]>(() => this.extractSymbols(this.relatedState.data()));
  searchSuggestions = computed<string[]>(() => this.extractSymbols(this.searchSymbol.data()));

  spotlightQuote = computed<SpotlightQuote | null>(() => {
    const meta = this.chartMeta(this.chart.data());
    if (!meta) return null;
    const price = typeof meta.regularMarketPrice === 'number' ? meta.regularMarketPrice : null;
    const prev = typeof meta.previousClose === 'number' ? meta.previousClose : (typeof meta.chartPreviousClose === 'number' ? meta.chartPreviousClose : null);
    const change = price !== null && prev !== null ? price - prev : null;
    const changePct = change !== null && prev ? (change / prev) * 100 : null;
    return {
      name: meta.longName ?? meta.shortName ?? this.activeSymbol(),
      symbol: this.activeSymbol(),
      price,
      change,
      changePct,
      dayLow: meta.regularMarketDayLow,
      dayHigh: meta.regularMarketDayHigh,
      weekLow: meta.fiftyTwoWeekLow,
      weekHigh: meta.fiftyTwoWeekHigh,
      volume: meta.regularMarketVolume,
    };
  });

  sparklinePoints = computed<string | null>(() => {
    const rows = this.chartRows(this.chart.data());
    if (!rows || rows.length < 2) return null;

    const values = rows.map(r => r.close).filter((v): v is number => typeof v === 'number');
    if (values.length < 2) return null;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const w = 600;
    const h = 100;
    const step = w / (values.length - 1);

    return values
      .map((v, i) => `${(i * step).toFixed(1)},${(h - ((v - min) / range) * h).toFixed(1)}`)
      .join(' ');
  });

  // ── formulários ──
  symbolQueryForm = new FormGroup({
    query: new FormControl('AAPL', { nonNullable: true }),
  });

  equityForm = new FormGroup({
    screenerId: new FormControl('MOST_ACTIVES', { nonNullable: true }),
    region: new FormControl('us', { nonNullable: true }),
  });

  etfForm = new FormGroup({
    screenerId: new FormControl('COMMODITY_ETFS', { nonNullable: true }),
    region: new FormControl('us', { nonNullable: true }),
  });

  cryptoForm = new FormGroup({
    screenerId: new FormControl('FIFTY_TWO_WK_GAINERS_CRYPTOCURRENCIES', { nonNullable: true }),
  });

  optionForm = new FormGroup({
    screenerId: new FormControl('MOST_ACTIVES_OPTIONS', { nonNullable: true }),
    region: new FormControl('us', { nonNullable: true }),
  });

  mutualFundForm = new FormGroup({
    screenerId: new FormControl('DAY_LOSERS_MUTUAL_FUNDS', { nonNullable: true }),
    region: new FormControl('us', { nonNullable: true }),
  });

  newsKeywordForm = new FormGroup({
    keyword: new FormControl('mercado financeiro', { nonNullable: true }),
  });

  ngOnInit(): void {
    // dispara todos os grupos de endpoints com valores padrão assim que a
    // tela abre, sem exigir nenhuma ação do usuário para ver dados
    this.loadEquity();
    this.loadEtf();
    this.loadCrypto();
    this.loadOption();
    this.loadMutualFund();
    this.loadSpotlight('AAPL');
    this.loadHotNews();
    this.loadNewsByKeyword();
  }

  // ── ações ──
  loadEquity() {
    const v = this.equityForm.getRawValue();
    this.run(this.equity, this.service.getEquity(v.screenerId, v.region));
  }

  loadEtf() {
    const v = this.etfForm.getRawValue();
    this.run(this.etf, this.service.getEtf(v.screenerId, v.region));
  }

  loadCrypto() {
    const v = this.cryptoForm.getRawValue();
    this.run(this.crypto, this.service.getCrypto(v.screenerId));
  }

  loadOption() {
    const v = this.optionForm.getRawValue();
    this.run(this.option, this.service.getOption(v.screenerId, v.region));
  }

  loadMutualFund() {
    const v = this.mutualFundForm.getRawValue();
    this.run(this.mutualFund, this.service.getMutualFund(v.screenerId, v.region));
  }

  loadSpotlight(rawQuery?: string) {
    const query = (rawQuery ?? this.symbolQueryForm.getRawValue().query ?? '').trim();
    if (!query) return;
    const symbol = query.toUpperCase();

    this.activeSymbol.set(symbol);
    this.run(this.profile, this.service.getSymbolProfile(symbol));
    this.run(this.symbolInfo, this.service.getSymbolInfo(symbol));
    this.run(this.fundamental, this.service.getFundamental(symbol));
    this.run(this.relatedState, this.service.getRelatedSymbol(symbol));
    this.run(this.newsBySymbol, this.service.getNewsList(symbol));
    this.run(this.searchSymbol, this.service.getSearchSymbol(query));
    this.loadChart(symbol, this.chartRange());
  }

  quickProfile(symbol: string) {
    this.symbolQueryForm.patchValue({ query: symbol });
    this.loadSpotlight(symbol);
  }

  onRangeChange(range: string) {
    this.chartRange.set(range);
    this.loadChart(this.activeSymbol(), range);
  }

  private loadChart(symbol: string, range: string) {
    this.run(this.chart, this.service.getSimpleChart(symbol, 60, range));
  }

  loadHotNews() {
    this.run(this.hotNews, this.service.getHotNews(10));
  }

  loadNewsByKeyword() {
    const keyword = this.newsKeywordForm.getRawValue().keyword?.trim();
    if (!keyword) return;
    this.run(this.newsByKeyword, this.service.getSearchNews(keyword));
  }

  scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ── infraestrutura de exibição genérica ──
  private run(state: TabState, obs: Observable<any>) {
    state.loading.set(true);
    state.error.set(null);
    state.data.set(null);
    obs.subscribe({
      next: (res) => {
        state.data.set(res);
        state.loading.set(false);
      },
      error: (err) => {
        state.error.set(err?.error?.message ?? err?.message ?? 'Não foi possível consultar os dados. Tente novamente.');
        state.loading.set(false);
      },
    });
  }

  private isPrimitive(v: any): boolean {
    return v === null || v === undefined || ['string', 'number', 'boolean'].includes(typeof v);
  }

  private extractSymbols(data: any): string[] {
    const rows = this.findRows(data);
    if (!rows) return [];
    return rows
      .map(r => r?.symbol ?? r?.ticker ?? null)
      .filter((s): s is string => !!s)
      .filter((s, i, arr) => arr.indexOf(s) === i)
      .slice(0, 12);
  }

  /** Busca recursivamente (até 6 níveis) o maior array de objetos presente na resposta —
   * as APIs do Yahoo aninham a lista principal em profundidades diferentes conforme o endpoint. */
  findRows(data: any): any[] | null {
    if (!data || typeof data !== 'object') return null;
    const candidates: any[][] = [];
    this.collectArrays(data, 0, candidates);
    if (!candidates.length) return null;
    candidates.sort((a, b) => b.length - a.length);
    return candidates[0];
  }

  private collectArrays(node: any, depth: number, acc: any[][]): void {
    if (depth > 6 || node === null || node === undefined) return;
    if (Array.isArray(node)) {
      if (node.length && node[0] !== null && typeof node[0] === 'object' && !Array.isArray(node[0])) {
        acc.push(node);
      }
      return;
    }
    if (typeof node === 'object') {
      for (const value of Object.values(node)) {
        this.collectArrays(value, depth + 1, acc);
      }
    }
  }

  /** Achata um nível de objetos aninhados (ex: { content: { title } } => "content.title")
   * para que campos como noticias (que vem como { content: {...}, id }) virem colunas de tabela. */
  private flattenRow(row: any): Record<string, any> {
    const flat: Record<string, any> = {};
    if (!row || typeof row !== 'object') return flat;
    for (const [k, v] of Object.entries(row)) {
      if (this.isPrimitive(v)) {
        flat[k] = v;
      } else if (v && typeof v === 'object' && !Array.isArray(v)) {
        for (const [k2, v2] of Object.entries(v as Record<string, any>)) {
          if (this.isPrimitive(v2)) flat[`${k}.${k2}`] = v2;
        }
      }
    }
    return flat;
  }

  tableColumns(rows: any[]): string[] {
    const flat = this.flattenRow(rows[0] ?? {});
    const keys = Object.keys(flat);
    const priority = PRIORITY_COLUMNS.filter(k => keys.includes(k));
    const rest = keys.filter(k => !priority.includes(k));
    return [...priority, ...rest].slice(0, 6);
  }

  cellValue(row: any, col: string): any {
    return this.flattenRow(row)[col];
  }

  kvRows(data: any): { label: string; value: any }[] {
    if (!data || typeof data !== 'object') return [];
    return Object.entries(data)
      .filter(([, v]) => this.isPrimitive(v) && v !== null && v !== undefined && v !== '')
      .map(([k, v]) => ({ label: this.prettyLabel(k), value: v }));
  }

  prettyLabel(key: string): string {
    const lastSegment = key.includes('.') ? key.split('.').pop()! : key;
    const spaced = lastSegment.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/_/g, ' ');
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
  }

  formatValue(value: any, key?: string): string {
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'number') {
      if (key && /timestamp|time|date|Ts$/i.test(key) && value > 1e8) {
        const ms = value > 1e12 ? value : value * 1000;
        return new Date(ms).toLocaleString('pt-BR');
      }
      return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 4 }).format(value);
    }
    return String(value);
  }

  /** A Yahoo Finance API devolve o chart como arrays paralelos
   * (data[0].timestamp[] + data[0].indicators.quote[0].{open,high,low,close,volume}[]),
   * não como uma lista de candles — precisa de um parser dedicado. */
  private chartMeta(data: any): any | null {
    return data?.data?.[0]?.meta ?? null;
  }

  private chartRows(data: any): { timestamp: number; open?: number; high?: number; low?: number; close?: number; volume?: number }[] | null {
    const item = data?.data?.[0];
    const ts: number[] | undefined = item?.timestamp;
    const q = item?.indicators?.quote?.[0];
    if (!ts || !q) return null;
    const rows = ts
      .map((t: number, i: number) => ({
        timestamp: t,
        open: q.open?.[i],
        high: q.high?.[i],
        low: q.low?.[i],
        close: q.close?.[i],
        volume: q.volume?.[i],
      }))
      .filter((r: any) => typeof r.close === 'number');
    return rows.length ? rows : null;
  }
}
