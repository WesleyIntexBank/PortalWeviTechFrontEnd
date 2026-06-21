import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BrasilApiService } from '../../core/services/brasil-api.service';

interface CvmCorretora {
  cnpj: string;
  type: string;
  nome_social: string;
  nome_comercial: string;
  status: string;
  email: string;
  telefone: string;
  cep: string;
  pais: string;
  uf: string;
  municipio: string;
  bairro: string;
  complemento: string;
  logradouro: string;
  data_patrimonio_liquido: string;
  valor_patrimonio_liquido: string;
  codigo_cvm: string;
  data_inicio_situacao: string;
  data_registro: string;
}

@Component({
  selector: 'app-cvm-corretoras',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <mat-icon>business_center</mat-icon>
        <h1>Corretoras CVM</h1>
      </div>

      <div class="card-container">
        <div class="toolbar">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Pesquisar por nome ou CNPJ</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input matInput [formControl]="filtro" placeholder="Ex: XP Investimentos ou 02.332.886/0001-04">
          </mat-form-field>
          <button mat-flat-button color="primary" (click)="carregar()" [disabled]="loading()">
            @if (loading()) { <mat-spinner diameter="20" class="btn-spinner"></mat-spinner> }
            @else { <mat-icon>refresh</mat-icon> }
            Atualizar
          </button>
        </div>
      </div>

      @if (error()) {
        <div class="error-card">
          <mat-icon>error_outline</mat-icon>
          <div class="error-body">
            <p class="error-title">Falha ao carregar</p>
            <p class="error-msg">{{ error() }}</p>
          </div>
        </div>
      }

      @if (loading()) {
        <div class="loading-wrap">
          <mat-spinner diameter="48"></mat-spinner>
          <p>Carregando corretoras...</p>
        </div>
      }

      @if (!loading() && corretoras().length > 0) {
        <div class="summary-bar">
          <span class="summary-text">
            <mat-icon>storefront</mat-icon>
            {{ filtradas().length }} corretoras
            @if (filtradas().length !== corretoras().length) {
              de {{ corretoras().length }} no total
            }
          </span>
        </div>

        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Nome Social</th>
                <th>Nome Comercial</th>
                <th>CNPJ</th>
                <th>Cód. CVM</th>
                <th>Status</th>
                <th>UF</th>
                <th>Município</th>
                <th>Patrimônio Líquido</th>
              </tr>
            </thead>
            <tbody>
              @for (c of filtradas(); track c.cnpj) {
                <tr>
                  <td class="td-nome">{{ c.nome_social }}</td>
                  <td class="td-nome">{{ c.nome_comercial || '—' }}</td>
                  <td class="mono">{{ c.cnpj }}</td>
                  <td class="mono">{{ c.codigo_cvm }}</td>
                  <td>
                    <span class="badge" [class.badge-ativo]="c.status === 'EM FUNCIONAMENTO NORMAL'" [class.badge-inativo]="c.status !== 'EM FUNCIONAMENTO NORMAL'">
                      {{ c.status }}
                    </span>
                  </td>
                  <td>{{ c.uf }}</td>
                  <td>{{ c.municipio }}</td>
                  <td class="td-valor">{{ formatarPatrimonio(c.valor_patrimonio_liquido) }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (!loading() && !error() && corretoras().length === 0) {
        <div class="empty-state">
          <mat-icon>business_center</mat-icon>
          <p>Clique em "Atualizar" para carregar as corretoras.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .toolbar {
      display: flex;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;
    }

    .search-field { flex: 1 1 320px; }

    button {
      height: 56px;
      padding: 0 24px;
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
      margin-top: 4px;
    }

    .btn-spinner { margin-right: 4px; }

    .error-card {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      background: rgba(244,67,54,0.08);
      border: 1px solid rgba(244,67,54,0.3);
      border-radius: 12px;
      padding: 16px 20px;
      margin-top: 20px;
    }
    .error-card > mat-icon { color: #f44336; font-size: 22px; width: 22px; height: 22px; flex-shrink: 0; }
    .error-body { flex: 1; }
    .error-title { font-weight: 600; font-size: 14px; color: #f44336 !important; margin-bottom: 4px; }
    .error-msg   { font-size: 13px; color: var(--text-sec) !important; }

    .loading-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 56px 24px;
      color: var(--text-sec);
      p { font-size: 15px; margin: 0; }
    }

    .summary-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 20px;
      margin-bottom: 8px;
    }

    .summary-text {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      font-weight: 600;
      color: var(--text-sec);
      mat-icon { font-size: 18px; width: 18px; height: 18px; color: var(--primary-dark, #3d5afe); }
    }

    .table-wrapper {
      overflow-x: auto;
      border: 1px solid var(--border);
      border-radius: 12px;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    .data-table thead tr {
      background: rgba(0,0,0,0.04);
    }

    .data-table th {
      padding: 12px 16px;
      text-align: left;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: var(--text-ter);
      border-bottom: 1px solid var(--border);
      white-space: nowrap;
    }

    .data-table td {
      padding: 11px 16px;
      color: var(--text);
      border-bottom: 1px solid var(--border);
      vertical-align: middle;
    }

    .data-table tbody tr:last-child td { border-bottom: none; }
    .data-table tbody tr:hover { background: rgba(0,0,0,0.025); }

    .td-nome { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .td-valor { font-family: 'Consolas', monospace; font-size: 12px; color: var(--primary-dark, #3d5afe); font-weight: 600; }

    .mono {
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 12px;
      letter-spacing: 0.5px;
    }

    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
    }

    .badge-ativo   { background: rgba(67,160,71,0.12);  color: #2e7d32; }
    .badge-inativo { background: rgba(0,0,0,0.07);       color: var(--text-sec); }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 56px 24px;
      color: var(--text-sec);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      margin-top: 20px;
      mat-icon { font-size: 48px; width: 48px; height: 48px; color: var(--body-label); }
      p { font-size: 15px; margin: 0; }
    }

    @media (max-width: 768px) {
      .toolbar { flex-direction: column; }
      .search-field { flex: 1 1 100%; }
      button { width: 100%; justify-content: center; }
    }
  `]
})
export class CvmCorretorasComponent implements OnInit {
  private service = inject(BrasilApiService);

  loading  = signal(false);
  error    = signal<string | null>(null);
  corretoras = signal<CvmCorretora[]>([]);
  filtro   = new FormControl('');

  filtradas = computed(() => {
    const q = (this.filtro.value ?? '').toLowerCase().trim();
    if (!q) return this.corretoras();
    return this.corretoras().filter(c =>
      c.nome_social?.toLowerCase().includes(q) ||
      c.nome_comercial?.toLowerCase().includes(q) ||
      c.cnpj?.includes(q)
    );
  });

  ngOnInit() { this.carregar(); }

  carregar() {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(null);

    this.service.getCvmCorretoras().subscribe({
      next: (data) => { this.corretoras.set(data ?? []); this.loading.set(false); },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Não foi possível carregar as corretoras.');
        this.loading.set(false);
      }
    });
  }

  formatarPatrimonio(valor: string): string {
    if (!valor) return '—';
    const num = parseFloat(valor);
    if (isNaN(num)) return valor;
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
