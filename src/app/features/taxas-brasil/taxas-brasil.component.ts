import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BrasilApiService } from '../../core/services/brasil-api.service';

interface Taxa {
  nome: string;
  valor: number;
}

const ICONS: Record<string, string> = {
  Selic: 'account_balance',
  CDI:   'trending_up',
  IPCA:  'shopping_cart',
};

const COLORS: Record<string, string> = {
  Selic: '#3d5afe',
  CDI:   '#00897b',
  IPCA:  '#fb8c00',
};

@Component({
  selector: 'app-taxas-brasil',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <mat-icon>percent</mat-icon>
        <h1>Taxas de Referência</h1>
      </div>

      <div class="card-container toolbar-row">
        <p class="subtitle">Taxas vigentes disponibilizadas pela BrasilAPI (Selic, CDI, IPCA e outras)</p>
        <button mat-flat-button color="primary" (click)="carregar()" [disabled]="loading()">
          @if (loading()) { <mat-spinner diameter="20" class="btn-spinner"></mat-spinner> }
          @else { <mat-icon>refresh</mat-icon> }
          Atualizar
        </button>
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
          <p>Carregando taxas...</p>
        </div>
      }

      @if (!loading() && taxas().length > 0) {
        <div class="cards-grid">
          @for (t of taxas(); track t.nome) {
            <div class="taxa-card" [style.--accent]="getColor(t.nome)">
              <div class="taxa-icon-wrap">
                <mat-icon>{{ getIcon(t.nome) }}</mat-icon>
              </div>
              <div class="taxa-body">
                <span class="taxa-nome">{{ t.nome }}</span>
                <span class="taxa-valor">{{ t.valor | number:'1.2-4' }}% <span class="taxa-unit">a.a.</span></span>
              </div>
            </div>
          }
        </div>
      }

      @if (!loading() && !error() && taxas().length === 0) {
        <div class="empty-state">
          <mat-icon>percent</mat-icon>
          <p>Clique em "Atualizar" para carregar as taxas.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .toolbar-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }

    .subtitle {
      font-size: 14px;
      color: var(--text-sec);
      margin: 0;
    }

    button {
      height: 44px;
      padding: 0 20px;
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
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

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 16px;
      margin-top: 24px;
    }

    .taxa-card {
      display: flex;
      align-items: center;
      gap: 18px;
      padding: 24px 20px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-left: 4px solid var(--accent, #3d5afe);
      border-radius: 12px;
      transition: box-shadow 0.2s;
    }

    .taxa-card:hover {
      box-shadow: 0 4px 16px rgba(0,0,0,0.08);
    }

    .taxa-icon-wrap {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      background: color-mix(in srgb, var(--accent, #3d5afe) 15%, transparent);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      mat-icon {
        font-size: 26px;
        width: 26px;
        height: 26px;
        color: var(--accent, #3d5afe);
      }
    }

    .taxa-body {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .taxa-nome {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--text-ter);
    }

    .taxa-valor {
      font-size: 28px;
      font-weight: 800;
      color: var(--accent, #3d5afe);
      line-height: 1;
    }

    .taxa-unit {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-sec);
    }

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

    @media (max-width: 600px) {
      .cards-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class TaxasBrasilComponent implements OnInit {
  private service = inject(BrasilApiService);

  loading = signal(false);
  error   = signal<string | null>(null);
  taxas   = signal<Taxa[]>([]);

  ngOnInit() { this.carregar(); }

  carregar() {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(null);

    this.service.getTaxas().subscribe({
      next: (data) => { this.taxas.set(data ?? []); this.loading.set(false); },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Não foi possível carregar as taxas.');
        this.loading.set(false);
      }
    });
  }

  getIcon(nome: string): string {
    return ICONS[nome] ?? 'percent';
  }

  getColor(nome: string): string {
    return COLORS[nome] ?? '#3d5afe';
  }
}
