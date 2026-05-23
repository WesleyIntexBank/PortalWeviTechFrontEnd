import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { EscavadorProcessosService } from '../../core/services/escavador-processos.service';

@Component({
  selector: 'app-escavador-processos',
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
    MatChipsModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <mat-icon>gavel</mat-icon>
        <h1>Processos Judiciais</h1>
      </div>

      <!-- Formulário -->
      <div class="card-container">
        <form [formGroup]="form" (ngSubmit)="consultar()" class="search-form">
          <div class="fields-row">
            <mat-form-field appearance="outline" class="field-doc">
              <mat-label>CPF ou CNPJ</mat-label>
              <mat-icon matPrefix>badge</mat-icon>
              <input
                matInput
                formControlName="documento"
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                maxlength="18"
                (input)="maskDocumento($event)"
              >
              @if (form.get('documento')?.hasError('required') && form.get('documento')?.touched) {
                <mat-error>CPF ou CNPJ é obrigatório</mat-error>
              } @else if (form.get('documento')?.hasError('minlength') && form.get('documento')?.touched) {
                <mat-error>Documento inválido</mat-error>
              }
            </mat-form-field>

            <button
              mat-flat-button
              color="primary"
              type="submit"
              class="btn-consultar"
              [disabled]="form.invalid || loading()"
            >
              @if (loading()) {
                <mat-spinner diameter="20" class="btn-spinner"></mat-spinner>
              } @else {
                <mat-icon>search</mat-icon>
              }
              {{ loading() ? 'Consultando...' : 'Consultar' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Erro -->
      @if (error() && !loading()) {
        <div class="error-card">
          <mat-icon>error_outline</mat-icon>
          <div class="error-body">
            <p class="error-title">Falha na consulta</p>
            <p class="error-msg">{{ error() }}</p>
          </div>
          <button mat-icon-button (click)="error.set(null)" matTooltip="Fechar">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      }

      <!-- Resumo -->
      @if (result() && !loading()) {
        <div class="summary-bar">
          <div class="summary-item">
            <mat-icon>person</mat-icon>
            <div>
              <span class="s-label">Envolvido</span>
              <span class="s-val">{{ result()?.nome || documentoFormatado() }}</span>
            </div>
          </div>
          <div class="summary-item">
            <mat-icon>folder_open</mat-icon>
            <div>
              <span class="s-label">Total de Processos</span>
              <span class="s-val accent">{{ totalProcessos() }}</span>
            </div>
          </div>
          @if (result()?.quantidade_processos_como_autor != null) {
            <div class="summary-item">
              <mat-icon>arrow_upward</mat-icon>
              <div>
                <span class="s-label">Como Autor</span>
                <span class="s-val">{{ result()?.quantidade_processos_como_autor ?? 0 }}</span>
              </div>
            </div>
          }
          @if (result()?.quantidade_processos_como_reu != null) {
            <div class="summary-item">
              <mat-icon>arrow_downward</mat-icon>
              <div>
                <span class="s-label">Como Réu</span>
                <span class="s-val warn">{{ result()?.quantidade_processos_como_reu ?? 0 }}</span>
              </div>
            </div>
          }
        </div>

        <!-- Lista de processos -->
        @if (processos().length > 0) {
          <div class="processos-list">
            @for (processo of processos(); track processo.id ?? $index) {
              <div class="processo-card">
                <div class="processo-header">
                  <div class="processo-num-wrap">
                    <mat-icon class="p-icon">gavel</mat-icon>
                    <div>
                      <span class="processo-num">{{ processo.numero_cnj || processo.numero || 'Nº não informado' }}</span>
                      @if (processo.tipo_processo) {
                        <span class="processo-tipo">{{ processo.tipo_processo }}</span>
                      }
                    </div>
                  </div>
                  <div class="processo-badges">
                    @if (processo.data_inicio) {
                      <span class="badge date-badge">
                        <mat-icon>event</mat-icon>
                        {{ formatDate(processo.data_inicio) }}
                      </span>
                    }
                    @if (processo.status) {
                      <span class="badge" [class.badge-ativo]="isAtivo(processo.status)" [class.badge-inativo]="!isAtivo(processo.status)">
                        {{ processo.status }}
                      </span>
                    }
                  </div>
                </div>

                <div class="processo-body">
                  @if (processo.tribunal) {
                    <div class="p-field">
                      <span class="p-label">Tribunal</span>
                      <span class="p-val">{{ processo.tribunal }}</span>
                    </div>
                  }
                  @if (processo.classe_processual) {
                    <div class="p-field">
                      <span class="p-label">Classe Processual</span>
                      <span class="p-val">{{ processo.classe_processual }}</span>
                    </div>
                  }
                  @if (processo.assunto_principal) {
                    <div class="p-field">
                      <span class="p-label">Assunto Principal</span>
                      <span class="p-val">{{ processo.assunto_principal }}</span>
                    </div>
                  }
                  @if (processo.valor_causa) {
                    <div class="p-field">
                      <span class="p-label">Valor da Causa</span>
                      <span class="p-val accent">{{ formatCurrency(processo.valor_causa) }}</span>
                    </div>
                  }
                  @if (processo.ultima_movimentacao) {
                    <div class="p-field full">
                      <span class="p-label">Última Movimentação</span>
                      <span class="p-val">{{ processo.ultima_movimentacao }}</span>
                    </div>
                  }
                  @if (processo.partes && processo.partes.length > 0) {
                    <div class="p-field full">
                      <span class="p-label">Partes</span>
                      <div class="partes-list">
                        @for (parte of processo.partes.slice(0, 4); track $index) {
                          <span class="parte-chip" [class.parte-autor]="isAutor(parte.tipo_participacao)" [class.parte-reu]="isReu(parte.tipo_participacao)">
                            {{ parte.nome }} <small>{{ parte.tipo_participacao }}</small>
                          </span>
                        }
                        @if (processo.partes.length > 4) {
                          <span class="parte-chip mais">+{{ processo.partes.length - 4 }} partes</span>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="empty-state">
            <mat-icon>search_off</mat-icon>
            <p>Nenhum processo encontrado para este documento.</p>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .search-form { width: 100%; }

    .fields-row {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      flex-wrap: wrap;
    }

    .field-doc { flex: 0 0 320px; }

    .btn-consultar {
      height: 56px;
      padding: 0 24px;
      font-size: 15px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
      margin-top: 4px;
    }

    /* Erro */
    .error-card {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      background: rgba(244, 67, 54, 0.08);
      border: 1px solid rgba(244, 67, 54, 0.3);
      border-radius: 12px;
      padding: 16px 20px;
      margin-top: 20px;
    }

    .error-card > mat-icon { color: #f44336; font-size: 22px; width: 22px; height: 22px; flex-shrink: 0; margin-top: 2px; }
    .error-body { flex: 1; }
    .error-title { font-weight: 600; font-size: 14px; color: #f44336 !important; margin-bottom: 4px; }
    .error-msg { font-size: 13px; color: var(--text-sec) !important; }

    /* Barra de resumo */
    .summary-bar {
      display: flex;
      gap: 0;
      margin-top: 20px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      overflow: hidden;
    }

    .summary-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 24px;
      flex: 1;
      border-right: 1px solid var(--border);

      &:last-child { border-right: none; }

      mat-icon { color: var(--body-label); font-size: 22px; width: 22px; height: 22px; flex-shrink: 0; }

      div { display: flex; flex-direction: column; gap: 2px; }
    }

    .s-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: var(--text-ter);
    }

    .s-val {
      font-size: 15px;
      font-weight: 700;
      color: var(--text);
    }

    .s-val.accent { color: var(--primary-dark, #3d5afe); }
    .s-val.warn   { color: #ef5350; }

    /* Lista de processos */
    .processos-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 16px;
    }

    .processo-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
    }

    .processo-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 14px 20px;
      background: rgba(61, 90, 254, 0.04);
      border-bottom: 1px solid var(--border);
      flex-wrap: wrap;
    }

    .processo-num-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .p-icon {
      color: var(--primary-dark, #3d5afe);
      font-size: 22px;
      width: 22px;
      height: 22px;
      flex-shrink: 0;
    }

    .processo-num {
      display: block;
      font-size: 14px;
      font-weight: 700;
      color: var(--text);
      font-family: 'Consolas', 'Monaco', monospace;
      letter-spacing: 0.5px;
    }

    .processo-tipo {
      display: block;
      font-size: 12px;
      color: var(--text-sec);
      margin-top: 2px;
    }

    .processo-badges {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;

      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }

    .date-badge {
      background: rgba(0,0,0,0.06);
      color: var(--text-sec);
      border: 1px solid var(--border);
    }

    .badge-ativo   { background: var(--active-bg); color: var(--active-color); }
    .badge-inativo { background: var(--inactive-bg); color: var(--inactive-color); }

    /* Corpo do processo */
    .processo-body {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 24px;
      padding: 16px 20px;
    }

    .p-field {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .p-field.full { grid-column: 1 / -1; }

    .p-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: var(--text-ter);
    }

    .p-val {
      font-size: 13px;
      font-weight: 500;
      color: var(--text);
    }

    .p-val.accent { color: var(--primary-dark, #3d5afe); font-weight: 700; }

    /* Partes */
    .partes-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 4px;
    }

    .parte-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      background: rgba(0,0,0,0.06);
      border: 1px solid var(--border);
      color: var(--text);

      small { color: var(--text-ter); font-size: 10px; margin-left: 2px; }
    }

    .parte-chip.parte-autor { background: rgba(61,90,254,0.08); border-color: rgba(61,90,254,0.25); }
    .parte-chip.parte-reu   { background: rgba(239,83,80,0.08); border-color: rgba(239,83,80,0.25); }
    .parte-chip.mais        { background: rgba(0,0,0,0.04); color: var(--text-sec); font-style: italic; }

    /* Empty state */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 48px 24px;
      color: var(--text-sec);
      margin-top: 20px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;

      mat-icon { font-size: 48px; width: 48px; height: 48px; color: var(--body-label); }
      p { font-size: 15px; margin: 0; }
    }

    @media (max-width: 768px) {
      .summary-bar { flex-direction: column; }
      .summary-item { border-right: none; border-bottom: 1px solid var(--border); &:last-child { border-bottom: none; } }
      .fields-row { flex-direction: column; }
      .field-doc { flex: 1 1 100%; }
      .btn-consultar { width: 100%; justify-content: center; margin-top: 0; }
      .processo-body { grid-template-columns: 1fr; }
      .processo-header { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class EscavadorProcessosComponent {
  private service = inject(EscavadorProcessosService);

  loading  = signal(false);
  error    = signal<string | null>(null);
  result   = signal<any>(null);
  processos = signal<any[]>([]);
  documentoFormatado = signal('');

  form = new FormGroup({
    documento: new FormControl('', [Validators.required, Validators.minLength(11)]),
  });

  maskDocumento(event: Event) {
    const input = event.target as HTMLInputElement;
    let v = input.value.replace(/\D/g, '');

    if (v.length <= 11) {
      // CPF: 000.000.000-00
      if (v.length > 9)      v = `${v.slice(0,3)}.${v.slice(3,6)}.${v.slice(6,9)}-${v.slice(9,11)}`;
      else if (v.length > 6) v = `${v.slice(0,3)}.${v.slice(3,6)}.${v.slice(6)}`;
      else if (v.length > 3) v = `${v.slice(0,3)}.${v.slice(3)}`;
    } else {
      // CNPJ: 00.000.000/0000-00
      v = v.slice(0, 14);
      if (v.length > 12)      v = `${v.slice(0,2)}.${v.slice(2,5)}.${v.slice(5,8)}/${v.slice(8,12)}-${v.slice(12)}`;
      else if (v.length > 8)  v = `${v.slice(0,2)}.${v.slice(2,5)}.${v.slice(5,8)}/${v.slice(8)}`;
      else if (v.length > 5)  v = `${v.slice(0,2)}.${v.slice(2,5)}.${v.slice(5)}`;
      else if (v.length > 2)  v = `${v.slice(0,2)}.${v.slice(2)}`;
    }

    this.form.get('documento')!.setValue(v, { emitEvent: false });
    input.value = v;
  }

  consultar() {
    if (this.form.invalid || this.loading()) return;

    const raw = this.form.value.documento!.replace(/\D/g, '');
    this.documentoFormatado.set(this.form.value.documento!);

    this.loading.set(true);
    this.error.set(null);
    this.result.set(null);
    this.processos.set([]);

    this.service.consultar(raw).subscribe({
      next: (data: any) => {
        this.result.set(data);
        // A API pode retornar { itens: [...] } ou { processos: [...] } ou array direto
        const lista = data?.itens ?? data?.processos ?? data?.data ?? (Array.isArray(data) ? data : []);
        this.processos.set(lista);
        this.loading.set(false);
      },
      error: (err) => {
        const msg =
          err?.error?.message ??
          err?.error?.mensagem ??
          'Não foi possível consultar os processos. Verifique o documento e tente novamente.';
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }

  totalProcessos(): number {
    return this.result()?.quantidade_processos_encontrados
      ?? this.result()?.total
      ?? this.processos().length;
  }

  isAtivo(status: string): boolean {
    return ['ativo', 'em andamento', 'aberto'].includes((status ?? '').toLowerCase());
  }

  isAutor(tipo: string): boolean {
    return (tipo ?? '').toLowerCase().includes('autor');
  }

  isReu(tipo: string): boolean {
    const t = (tipo ?? '').toLowerCase();
    return t.includes('réu') || t.includes('reu') || t.includes('requerido');
  }

  formatDate(date: string): string {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString('pt-BR');
    } catch {
      return date;
    }
  }

  formatCurrency(value: any): string {
    if (value == null) return '';
    const n = parseFloat(value);
    if (isNaN(n)) return value;
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
