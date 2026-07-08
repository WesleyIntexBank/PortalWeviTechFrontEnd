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
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
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
  'symbol', 'shortName', 'longName', 'name', 'title', 'headline',
  'regularMarketPrice', 'price', 'regularMarketChange', 'regularMarketChangePercent',
  'changePercent', 'marketCap', 'region', 'category', 'exchange', 'currency',
];

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
    MatTabsModule,
    MatExpansionModule,
    MatChipsModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <mat-icon>show_chart</mat-icon>
        <h1>Mercado Financeiro</h1>
        <span class="subtitle">Cotações, screeners e notícias via Yahoo Finance</span>
      </div>

      <mat-tab-group animationDuration="200ms" class="market-tabs">

        <!-- ═══════════════ VISÃO GERAL ═══════════════ -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">dashboard</mat-icon>
            Visão Geral
          </ng-template>
          <div class="tab-content">
            <div class="card-container">
              <form [formGroup]="overviewForm" (ngSubmit)="loadOverview()" class="search-form">
                <div class="fields-row">
                  <mat-form-field appearance="outline" class="field-select">
                    <mat-label>Categoria</mat-label>
                    <mat-select formControlName="category">
                      @for (o of overviewCategories; track o.value) { <mat-option [value]="o.value">{{ o.label }}</mat-option> }
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="field-select">
                    <mat-label>Região</mat-label>
                    <mat-select formControlName="region">
                      @for (o of regions; track o.value) { <mat-option [value]="o.value">{{ o.label }}</mat-option> }
                    </mat-select>
                  </mat-form-field>
                  <button mat-flat-button color="primary" type="submit" class="btn-consultar" [disabled]="overview.loading()">
                    @if (overview.loading()) { <mat-spinner diameter="20" class="btn-spinner"></mat-spinner> } @else { <mat-icon>search</mat-icon> }
                    {{ overview.loading() ? 'Consultando...' : 'Consultar' }}
                  </button>
                </div>
              </form>
            </div>
            <ng-container *ngTemplateOutlet="resultPanel; context: { state: overview }"></ng-container>
          </div>
        </mat-tab>

        <!-- ═══════════════ AÇÕES ═══════════════ -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">trending_up</mat-icon>
            Ações
          </ng-template>
          <div class="tab-content">
            <div class="card-container">
              <form [formGroup]="equityForm" (ngSubmit)="loadEquity()" class="search-form">
                <div class="fields-row">
                  <mat-form-field appearance="outline" class="field-select-wide">
                    <mat-label>Screener</mat-label>
                    <mat-select formControlName="screenerId">
                      @for (o of equityScreeners; track o.value) { <mat-option [value]="o.value">{{ o.label }}</mat-option> }
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="field-select">
                    <mat-label>Região</mat-label>
                    <mat-select formControlName="region">
                      @for (o of regions; track o.value) { <mat-option [value]="o.value">{{ o.label }}</mat-option> }
                    </mat-select>
                  </mat-form-field>
                  <button mat-flat-button color="primary" type="submit" class="btn-consultar" [disabled]="equity.loading()">
                    @if (equity.loading()) { <mat-spinner diameter="20" class="btn-spinner"></mat-spinner> } @else { <mat-icon>search</mat-icon> }
                    {{ equity.loading() ? 'Consultando...' : 'Consultar' }}
                  </button>
                </div>
              </form>
            </div>
            <ng-container *ngTemplateOutlet="resultPanel; context: { state: equity }"></ng-container>
          </div>
        </mat-tab>

        <!-- ═══════════════ ETFs ═══════════════ -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">pie_chart</mat-icon>
            ETFs
          </ng-template>
          <div class="tab-content">
            <div class="card-container">
              <form [formGroup]="etfForm" (ngSubmit)="loadEtf()" class="search-form">
                <div class="fields-row">
                  <mat-form-field appearance="outline" class="field-select-wide">
                    <mat-label>Screener ID</mat-label>
                    <input matInput formControlName="screenerId" placeholder="Ex: COMMODITY_ETFS">
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="field-select">
                    <mat-label>Região</mat-label>
                    <mat-select formControlName="region">
                      @for (o of regions; track o.value) { <mat-option [value]="o.value">{{ o.label }}</mat-option> }
                    </mat-select>
                  </mat-form-field>
                  <button mat-flat-button color="primary" type="submit" class="btn-consultar" [disabled]="etf.loading()">
                    @if (etf.loading()) { <mat-spinner diameter="20" class="btn-spinner"></mat-spinner> } @else { <mat-icon>search</mat-icon> }
                    {{ etf.loading() ? 'Consultando...' : 'Consultar' }}
                  </button>
                </div>
              </form>
            </div>
            <ng-container *ngTemplateOutlet="resultPanel; context: { state: etf }"></ng-container>
          </div>
        </mat-tab>

        <!-- ═══════════════ CRIPTOMOEDAS ═══════════════ -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">currency_bitcoin</mat-icon>
            Criptomoedas
          </ng-template>
          <div class="tab-content">
            <div class="card-container">
              <form [formGroup]="cryptoForm" (ngSubmit)="loadCrypto()" class="search-form">
                <div class="fields-row">
                  <mat-form-field appearance="outline" class="field-select-wide">
                    <mat-label>Screener</mat-label>
                    <mat-select formControlName="screenerId">
                      @for (o of cryptoScreeners; track o.value) { <mat-option [value]="o.value">{{ o.label }}</mat-option> }
                    </mat-select>
                  </mat-form-field>
                  <button mat-flat-button color="primary" type="submit" class="btn-consultar" [disabled]="crypto.loading()">
                    @if (crypto.loading()) { <mat-spinner diameter="20" class="btn-spinner"></mat-spinner> } @else { <mat-icon>search</mat-icon> }
                    {{ crypto.loading() ? 'Consultando...' : 'Consultar' }}
                  </button>
                </div>
              </form>
            </div>
            <ng-container *ngTemplateOutlet="resultPanel; context: { state: crypto }"></ng-container>
          </div>
        </mat-tab>

        <!-- ═══════════════ OPÇÕES ═══════════════ -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">tune</mat-icon>
            Opções
          </ng-template>
          <div class="tab-content">
            <div class="card-container">
              <form [formGroup]="optionForm" (ngSubmit)="loadOption()" class="search-form">
                <div class="fields-row">
                  <mat-form-field appearance="outline" class="field-select-wide">
                    <mat-label>Screener</mat-label>
                    <mat-select formControlName="screenerId">
                      @for (o of optionScreeners; track o.value) { <mat-option [value]="o.value">{{ o.label }}</mat-option> }
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="field-select">
                    <mat-label>Região</mat-label>
                    <mat-select formControlName="region">
                      @for (o of regions; track o.value) { <mat-option [value]="o.value">{{ o.label }}</mat-option> }
                    </mat-select>
                  </mat-form-field>
                  <button mat-flat-button color="primary" type="submit" class="btn-consultar" [disabled]="option.loading()">
                    @if (option.loading()) { <mat-spinner diameter="20" class="btn-spinner"></mat-spinner> } @else { <mat-icon>search</mat-icon> }
                    {{ option.loading() ? 'Consultando...' : 'Consultar' }}
                  </button>
                </div>
              </form>
            </div>
            <ng-container *ngTemplateOutlet="resultPanel; context: { state: option }"></ng-container>
          </div>
        </mat-tab>

        <!-- ═══════════════ FUNDOS ═══════════════ -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">savings</mat-icon>
            Fundos
          </ng-template>
          <div class="tab-content">
            <div class="card-container">
              <form [formGroup]="mutualFundForm" (ngSubmit)="loadMutualFund()" class="search-form">
                <div class="fields-row">
                  <mat-form-field appearance="outline" class="field-select-wide">
                    <mat-label>Screener</mat-label>
                    <mat-select formControlName="screenerId">
                      @for (o of mutualFundScreeners; track o.value) { <mat-option [value]="o.value">{{ o.label }}</mat-option> }
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="field-select">
                    <mat-label>Região</mat-label>
                    <mat-select formControlName="region">
                      @for (o of regions; track o.value) { <mat-option [value]="o.value">{{ o.label }}</mat-option> }
                    </mat-select>
                  </mat-form-field>
                  <button mat-flat-button color="primary" type="submit" class="btn-consultar" [disabled]="mutualFund.loading()">
                    @if (mutualFund.loading()) { <mat-spinner diameter="20" class="btn-spinner"></mat-spinner> } @else { <mat-icon>search</mat-icon> }
                    {{ mutualFund.loading() ? 'Consultando...' : 'Consultar' }}
                  </button>
                </div>
              </form>
            </div>
            <ng-container *ngTemplateOutlet="resultPanel; context: { state: mutualFund }"></ng-container>
          </div>
        </mat-tab>

        <!-- ═══════════════ BUSCA DE SÍMBOLO ═══════════════ -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">manage_search</mat-icon>
            Busca de Símbolo
          </ng-template>
          <div class="tab-content">
            <div class="card-container">
              <form [formGroup]="searchForm" (ngSubmit)="loadSearchSymbol()" class="search-form">
                <div class="fields-row">
                  <mat-form-field appearance="outline" class="field-symbol">
                    <mat-label>Palavra-chave</mat-label>
                    <mat-icon matPrefix>search</mat-icon>
                    <input matInput formControlName="keyword" placeholder="Ex: Apple, Petrobras, Bitcoin">
                  </mat-form-field>
                  <button mat-flat-button color="primary" type="submit" class="btn-consultar" [disabled]="searchSymbol.loading()">
                    @if (searchSymbol.loading()) { <mat-spinner diameter="20" class="btn-spinner"></mat-spinner> } @else { <mat-icon>search</mat-icon> }
                    {{ searchSymbol.loading() ? 'Buscando...' : 'Buscar' }}
                  </button>
                </div>
              </form>
            </div>
            <ng-container *ngTemplateOutlet="resultPanel; context: { state: searchSymbol }"></ng-container>

            <div class="card-container profile-card">
              <p class="section-label">
                <mat-icon class="label-icon">badge</mat-icon>
                Perfil do Ativo
              </p>
              <form [formGroup]="profileForm" (ngSubmit)="loadProfile()" class="search-form">
                <div class="fields-row">
                  <mat-form-field appearance="outline" class="field-symbol">
                    <mat-label>Símbolo</mat-label>
                    <mat-icon matPrefix>tag</mat-icon>
                    <input matInput formControlName="symbol" placeholder="Ex: AAPL" style="text-transform:uppercase"
                      (input)="toUpperCase($event, profileForm, 'symbol')">
                  </mat-form-field>
                  <button mat-flat-button color="primary" type="submit" class="btn-consultar" [disabled]="!profileForm.value.symbol">
                    <mat-icon>badge</mat-icon>
                    Carregar Perfil
                  </button>
                </div>
              </form>

              @if (relatedSymbols().length) {
                <div class="chips-row">
                  <span class="chips-label">Relacionados:</span>
                  <mat-chip-set>
                    @for (s of relatedSymbols(); track s) {
                      <mat-chip (click)="quickProfile(s)">{{ s }}</mat-chip>
                    }
                  </mat-chip-set>
                </div>
              }

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
            </div>
          </div>
        </mat-tab>

        <!-- ═══════════════ GRÁFICO ═══════════════ -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">candlestick_chart</mat-icon>
            Gráfico
          </ng-template>
          <div class="tab-content">
            <div class="card-container">
              <form [formGroup]="chartForm" (ngSubmit)="loadChart()" class="search-form">
                <div class="fields-row">
                  <mat-form-field appearance="outline" class="field-symbol">
                    <mat-label>Símbolo</mat-label>
                    <mat-icon matPrefix>tag</mat-icon>
                    <input matInput formControlName="symbol" placeholder="Ex: MSFT" style="text-transform:uppercase"
                      (input)="toUpperCase($event, chartForm, 'symbol')">
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="field-select">
                    <mat-label>Período</mat-label>
                    <mat-select formControlName="range">
                      @for (r of chartRanges; track r) { <mat-option [value]="r">{{ r }}</mat-option> }
                    </mat-select>
                  </mat-form-field>
                  <button mat-flat-button color="primary" type="submit" class="btn-consultar" [disabled]="chart.loading() || !chartForm.value.symbol">
                    @if (chart.loading()) { <mat-spinner diameter="20" class="btn-spinner"></mat-spinner> } @else { <mat-icon>show_chart</mat-icon> }
                    {{ chart.loading() ? 'Consultando...' : 'Consultar' }}
                  </button>
                </div>
              </form>
            </div>

            @if (sparklinePoints(); as points) {
              <div class="card-container sparkline-card">
                <svg viewBox="0 0 600 120" preserveAspectRatio="none" class="sparkline">
                  <polyline [attr.points]="points" fill="none" stroke="var(--primary-dark, #3d5afe)" stroke-width="2"></polyline>
                </svg>
              </div>
            }

            <ng-container *ngTemplateOutlet="resultPanel; context: { state: chart }"></ng-container>
          </div>
        </mat-tab>

        <!-- ═══════════════ NOTÍCIAS ═══════════════ -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">newspaper</mat-icon>
            Notícias
          </ng-template>
          <div class="tab-content">

            <div class="card-container">
              <p class="section-label"><mat-icon class="label-icon">local_fire_department</mat-icon>Destaques</p>
              <button mat-flat-button color="primary" type="button" (click)="loadHotNews()" [disabled]="hotNews.loading()">
                @if (hotNews.loading()) { <mat-spinner diameter="20" class="btn-spinner"></mat-spinner> } @else { <mat-icon>refresh</mat-icon> }
                Carregar Destaques
              </button>
            </div>
            <ng-container *ngTemplateOutlet="resultPanel; context: { state: hotNews }"></ng-container>

            <div class="card-container">
              <p class="section-label"><mat-icon class="label-icon">tag</mat-icon>Notícias por Símbolo</p>
              <form [formGroup]="newsSymbolForm" (ngSubmit)="loadNewsBySymbol()" class="search-form">
                <div class="fields-row">
                  <mat-form-field appearance="outline" class="field-symbol">
                    <mat-label>Símbolo</mat-label>
                    <input matInput formControlName="symbol" placeholder="Ex: TSLA" style="text-transform:uppercase"
                      (input)="toUpperCase($event, newsSymbolForm, 'symbol')">
                  </mat-form-field>
                  <button mat-flat-button color="primary" type="submit" class="btn-consultar" [disabled]="newsBySymbol.loading()">
                    @if (newsBySymbol.loading()) { <mat-spinner diameter="20" class="btn-spinner"></mat-spinner> } @else { <mat-icon>search</mat-icon> }
                    Buscar
                  </button>
                </div>
              </form>
            </div>
            <ng-container *ngTemplateOutlet="resultPanel; context: { state: newsBySymbol }"></ng-container>

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
            </div>
            <ng-container *ngTemplateOutlet="resultPanel; context: { state: newsByKeyword }"></ng-container>
          </div>
        </mat-tab>

      </mat-tab-group>
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
                        @for (col of tableColumns(rows); track col) { <td>{{ formatValue(row[col]) }}</td> }
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
        <mat-expansion-panel class="raw-json-panel">
          <mat-expansion-panel-header>
            <mat-panel-title><mat-icon class="label-icon">data_object</mat-icon> Ver dados completos (JSON)</mat-panel-title>
          </mat-expansion-panel-header>
          <pre class="raw-json">{{ prettyJson(data) }}</pre>
        </mat-expansion-panel>
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

    .btn-consultar {
      height: 56px; padding: 0 24px; font-size: 15px; font-weight: 600;
      display: flex; align-items: center; gap: 8px; flex-shrink: 0; margin-top: 4px;
    }

    .tab-content { padding-top: 16px; display: flex; flex-direction: column; gap: 16px; }
    .tab-icon { margin-right: 6px; }

    .error-card {
      display: flex; align-items: flex-start; gap: 14px;
      background: rgba(244, 67, 54, 0.08); border: 1px solid rgba(244, 67, 54, 0.3);
      border-radius: 12px; padding: 16px 20px;
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

    .raw-json-panel { margin-top: 4px; box-shadow: none !important; border: 1px solid var(--border); }
    .raw-json {
      font-family: 'Consolas', 'Monaco', monospace; font-size: 12px; white-space: pre-wrap;
      word-break: break-word; max-height: 400px; overflow: auto; color: var(--text-sec);
    }

    .section-label {
      font-size: 11px !important; font-weight: 700; text-transform: uppercase;
      letter-spacing: 1px; color: var(--body-label) !important;
      display: flex; align-items: center; gap: 6px; margin-bottom: 12px;
    }
    .label-icon { font-size: 15px; width: 15px; height: 15px; }

    .profile-card { display: flex; flex-direction: column; gap: 12px; }
    .profile-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-top: 8px; }
    .mini-title { font-size: 12px; font-weight: 700; color: var(--text-sec); margin-bottom: 6px; }

    .chips-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .chips-label { font-size: 12px; color: var(--text-sec); }

    .sparkline-card { padding: 12px 20px; }
    .sparkline { width: 100%; height: 100px; display: block; }

    @media (max-width: 768px) {
      .fields-row { flex-direction: column; }
      .field-select, .field-select-wide, .field-symbol { flex: 1 1 100%; }
      .btn-consultar { width: 100%; justify-content: center; margin-top: 0; }
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

  readonly overviewCategories: Option[] = [
    { value: 'markets', label: 'Mercados' },
    { value: 'equity', label: 'Ações' },
    { value: 'cryptocurrency', label: 'Criptomoedas' },
    { value: 'etf', label: 'ETFs' },
    { value: 'mutualfund', label: 'Fundos' },
    { value: 'option', label: 'Opções' },
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

  // ── estado por aba ──
  overview = createTabState();
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

  relatedSymbols = computed<string[]>(() => {
    const rows = this.findRows(this.relatedState.data());
    if (!rows) return [];
    return rows
      .map(r => r.symbol ?? r.ticker ?? null)
      .filter((s): s is string => !!s)
      .slice(0, 12);
  });

  sparklinePoints = computed<string | null>(() => this.buildSparkline(this.chart.data()));

  // ── formulários ──
  overviewForm = new FormGroup({
    category: new FormControl('markets', { nonNullable: true }),
    region: new FormControl('us', { nonNullable: true }),
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

  searchForm = new FormGroup({
    keyword: new FormControl('Apple', { nonNullable: true }),
  });

  profileForm = new FormGroup({
    symbol: new FormControl('AAPL', { nonNullable: true }),
  });

  chartForm = new FormGroup({
    symbol: new FormControl('AAPL', { nonNullable: true }),
    range: new FormControl('1mo', { nonNullable: true }),
  });

  newsSymbolForm = new FormGroup({
    symbol: new FormControl('AAPL', { nonNullable: true }),
  });

  newsKeywordForm = new FormGroup({
    keyword: new FormControl('mercado financeiro', { nonNullable: true }),
  });

  ngOnInit(): void {
    // dispara todos os grupos de endpoints com valores padrão assim que a
    // tela abre, sem exigir nenhuma ação do usuário para ver dados
    this.loadOverview();
    this.loadEquity();
    this.loadEtf();
    this.loadCrypto();
    this.loadOption();
    this.loadMutualFund();
    this.loadSearchSymbol();
    this.loadProfile();
    this.loadChart();
    this.loadHotNews();
    this.loadNewsBySymbol();
    this.loadNewsByKeyword();
  }

  // ── ações ──
  loadOverview() {
    const v = this.overviewForm.getRawValue();
    this.run(this.overview, this.service.getOverview(v.category, v.region));
  }

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

  loadSearchSymbol() {
    const keyword = this.searchForm.getRawValue().keyword?.trim();
    if (!keyword) return;
    this.run(this.searchSymbol, this.service.getSearchSymbol(keyword));
  }

  loadProfile() {
    const symbol = this.profileForm.getRawValue().symbol?.trim();
    if (!symbol) return;
    this.run(this.profile, this.service.getSymbolProfile(symbol));
    this.run(this.symbolInfo, this.service.getSymbolInfo(symbol));
    this.run(this.fundamental, this.service.getFundamental(symbol));
    this.run(this.relatedState, this.service.getRelatedSymbol(symbol));
  }

  quickProfile(symbol: string) {
    this.profileForm.patchValue({ symbol });
    this.loadProfile();
  }

  loadChart() {
    const v = this.chartForm.getRawValue();
    if (!v.symbol?.trim()) return;
    this.run(this.chart, this.service.getSimpleChart(v.symbol.trim(), 30, v.range));
  }

  loadHotNews() {
    this.run(this.hotNews, this.service.getHotNews(10));
  }

  loadNewsBySymbol() {
    const symbol = this.newsSymbolForm.getRawValue().symbol?.trim();
    if (!symbol) return;
    this.run(this.newsBySymbol, this.service.getNewsList(symbol));
  }

  loadNewsByKeyword() {
    const keyword = this.newsKeywordForm.getRawValue().keyword?.trim();
    if (!keyword) return;
    this.run(this.newsByKeyword, this.service.getSearchNews(keyword));
  }

  toUpperCase(event: Event, form: FormGroup, control: string) {
    const input = event.target as HTMLInputElement;
    const value = input.value.toUpperCase();
    form.get(control)!.setValue(value, { emitEvent: false });
    input.value = value;
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

  findRows(data: any): any[] | null {
    if (!data) return null;
    if (Array.isArray(data)) {
      return data.length && typeof data[0] === 'object' && data[0] !== null ? data : null;
    }
    if (typeof data !== 'object') return null;

    for (const value of Object.values(data)) {
      if (Array.isArray(value) && value.length && typeof value[0] === 'object' && value[0] !== null) {
        return value;
      }
    }
    for (const value of Object.values(data)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        for (const inner of Object.values(value as Record<string, any>)) {
          if (Array.isArray(inner) && inner.length && typeof inner[0] === 'object' && inner[0] !== null) {
            return inner;
          }
        }
      }
    }
    return null;
  }

  tableColumns(rows: any[]): string[] {
    const first = rows[0] ?? {};
    const keys = Object.keys(first).filter(k => this.isPrimitive(first[k]));
    const priority = PRIORITY_COLUMNS.filter(k => keys.includes(k));
    const rest = keys.filter(k => !priority.includes(k));
    return [...priority, ...rest].slice(0, 6);
  }

  kvRows(data: any): { label: string; value: any }[] {
    if (!data || typeof data !== 'object') return [];
    return Object.entries(data)
      .filter(([, v]) => this.isPrimitive(v) && v !== null && v !== undefined && v !== '')
      .map(([k, v]) => ({ label: this.prettyLabel(k), value: v }));
  }

  prettyLabel(key: string): string {
    const spaced = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/_/g, ' ');
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
  }

  formatValue(value: any): string {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number') {
      return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 4 }).format(value);
    }
    return String(value);
  }

  prettyJson(data: any): string {
    return JSON.stringify(data, null, 2);
  }

  private buildSparkline(data: any): string | null {
    const rows = this.findRows(data);
    if (!rows || rows.length < 2) return null;

    const first = rows[0];
    const priorityFields = ['close', 'adjClose', 'price', 'value', 'regularMarketPrice'];
    const field = priorityFields.find(f => typeof first[f] === 'number')
      ?? Object.keys(first).find(k => typeof first[k] === 'number');
    if (!field) return null;

    const values = rows.map(r => Number(r[field])).filter(v => !isNaN(v));
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
  }
}
