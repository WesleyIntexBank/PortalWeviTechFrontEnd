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

interface PixParticipante {
  ispb: string;
  nome: string;
  nome_reduzido: string;
  modalidade_participacao: string;
  tipo_participacao: string;
  inicio_operacao: string;
}

@Component({
  selector: 'app-pix-participantes',
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
        <mat-icon>payment</mat-icon>
        <h1>Participantes PIX</h1>
      </div>

      <div class="card-container">
        <div class="toolbar">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Pesquisar por nome ou ISPB</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input matInput [formControl]="filtro" placeholder="Ex: Banco do Brasil ou 00000000">
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
          <p>Carregando participantes...</p>
        </div>
      }

      @if (!loading() && participantes().length > 0) {
        <div class="summary-bar">
          <span class="summary-text">
            <mat-icon>payment</mat-icon>
            {{ filtrados().length }} participantes
            @if (filtrados().length !== participantes().length) {
              de {{ participantes().length }} no total
            }
          </span>
        </div>

        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>ISPB</th>
                <th>Nome</th>
                <th>Nome Reduzido</th>
                <th>Modalidade</th>
                <th>Tipo</th>
                <th>Início Operação</th>
              </tr>
            </thead>
            <tbody>
              @for (p of filtrados(); track p.ispb) {
                <tr>
                  <td class="mono">{{ p.ispb }}</td>
                  <td class="td-nome">{{ p.nome }}</td>
                  <td>{{ p.nome_reduzido }}</td>
                  <td>
                    <span class="badge" [class.badge-direto]="p.modalidade_participacao === 'DIRETO'" [class.badge-indireto]="p.modalidade_participacao === 'INDIRETO'">
                      {{ p.modalidade_participacao }}
                    </span>
                  </td>
                  <td>
                    <span class="tipo-chip">{{ p.tipo_participacao }}</span>
                  </td>
                  <td class="mono">{{ formatarData(p.inicio_operacao) }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (!loading() && !error() && participantes().length === 0) {
        <div class="empty-state">
          <mat-icon>payment</mat-icon>
          <p>Clique em "Atualizar" para carregar os participantes PIX.</p>
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

    .data-table thead tr { background: rgba(0,0,0,0.04); }

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
      padding: 10px 16px;
      color: var(--text);
      border-bottom: 1px solid var(--border);
      vertical-align: middle;
    }

    .data-table tbody tr:last-child td { border-bottom: none; }
    .data-table tbody tr:hover { background: rgba(0,0,0,0.025); }

    .td-nome { max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

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

    .badge-direto   { background: rgba(61,90,254,0.12);  color: var(--primary-dark, #3d5afe); }
    .badge-indireto { background: rgba(0,0,0,0.07);       color: var(--text-sec); }

    .tipo-chip {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      background: rgba(0,150,136,0.1);
      color: #00897b;
      white-space: nowrap;
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

    @media (max-width: 768px) {
      .toolbar { flex-direction: column; }
      .search-field { flex: 1 1 100%; }
      button { width: 100%; justify-content: center; }
    }
  `]
})
export class PixParticipantesComponent implements OnInit {
  private service = inject(BrasilApiService);

  loading      = signal(false);
  error        = signal<string | null>(null);
  participantes = signal<PixParticipante[]>([]);
  filtro       = new FormControl('');

  filtrados = computed(() => {
    const q = (this.filtro.value ?? '').toLowerCase().trim();
    if (!q) return this.participantes();
    return this.participantes().filter(p =>
      p.nome?.toLowerCase().includes(q) ||
      p.nome_reduzido?.toLowerCase().includes(q) ||
      p.ispb?.includes(q)
    );
  });

  ngOnInit() { this.carregar(); }

  carregar() {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(null);

    this.service.getPixParticipantes().subscribe({
      next: (data) => { this.participantes.set(data ?? []); this.loading.set(false); },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Não foi possível carregar os participantes PIX.');
        this.loading.set(false);
      }
    });
  }

  formatarData(data: string): string {
    if (!data) return '—';
    try {
      return new Date(data).toLocaleDateString('pt-BR');
    } catch {
      return data;
    }
  }
}
