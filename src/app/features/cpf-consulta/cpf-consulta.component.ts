import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CpfConsultaService } from '../../core/services/cpf-consulta.service';

interface CpfResult {
  documento: string;
  nome: string;
  dataNascimento: string;
  dataInscricao: string;
  anoObito: string;
  mensagemObito: string;
  codigoSituacaoCadastral: string;
  situacaoRFB: string;
  dataConsultaRFB: string;
  protocoloRFB: string;
  digitoVerificador: string;
  mensagem: string;
  status: boolean;
  transacao: { status: boolean; codigoStatus: string | null; codigoStatusDescricao: string | null };
}

@Component({
  selector: 'app-cpf-consulta',
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
        <mat-icon>badge</mat-icon>
        <h1>Consulta CPF</h1>
      </div>

      <!-- Formulário -->
      <div class="card-container">
        <form [formGroup]="form" (ngSubmit)="consultar()" class="search-form">
          <div class="fields-row">
            <mat-form-field appearance="outline" class="field-cpf">
              <mat-label>CPF</mat-label>
              <mat-icon matPrefix>badge</mat-icon>
              <input
                matInput
                formControlName="cpf"
                placeholder="000.000.000-00"
                maxlength="14"
                (input)="maskCpf($event)"
              >
              @if (form.get('cpf')?.hasError('required') && form.get('cpf')?.touched) {
                <mat-error>CPF é obrigatório</mat-error>
              } @else if (form.get('cpf')?.hasError('minlength') && form.get('cpf')?.touched) {
                <mat-error>CPF inválido</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="field-date">
              <mat-label>Data de Nascimento</mat-label>
              <mat-icon matPrefix>cake</mat-icon>
              <input matInput type="date" formControlName="dataNascimento">
              @if (form.get('dataNascimento')?.hasError('required') && form.get('dataNascimento')?.touched) {
                <mat-error>Data de nascimento é obrigatória</mat-error>
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
                Consultando...
              } @else {
                <mat-icon>search</mat-icon>
                Consultar
              }
            </button>
          </div>
        </form>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="loading-overlay">
          <mat-spinner diameter="48"></mat-spinner>
        </div>
      }

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

      <!-- Resultado -->
      @if (result() && !loading()) {
        <div class="result-wrapper">

          <!-- Cabeçalho do resultado -->
          <div class="result-top">
            <div class="result-avatar">
              {{ initials(result()!.nome) }}
            </div>
            <div class="result-identity">
              <h2 class="result-nome">{{ result()!.nome }}</h2>
              <div class="result-meta">
                <span class="meta-item">
                  <mat-icon>badge</mat-icon>
                  {{ formatCpf(result()!.documento) }}
                </span>
                <span class="meta-item">
                  <mat-icon>cake</mat-icon>
                  {{ result()!.dataNascimento }}
                </span>
              </div>
            </div>
            <div class="result-status-wrap">
              <span class="situacao-badge" [class.regular]="isRegular()" [class.irregular]="!isRegular()">
                <mat-icon>{{ isRegular() ? 'verified' : 'gpp_bad' }}</mat-icon>
                {{ result()!.situacaoRFB }}
              </span>
            </div>
          </div>

          <!-- Grid de campos -->
          <div class="info-grid">

            <div class="info-section">
              <p class="section-label">Dados Cadastrais</p>
              <div class="fields-grid">
                <div class="info-field">
                  <span class="f-label">Data de Inscrição</span>
                  <span class="f-value">{{ result()!.dataInscricao }}</span>
                </div>
                <div class="info-field">
                  <span class="f-label">Dígito Verificador</span>
                  <span class="f-value">{{ result()!.digitoVerificador }}</span>
                </div>
                <div class="info-field">
                  <span class="f-label">Cód. Situação Cadastral</span>
                  <span class="f-value">{{ result()!.codigoSituacaoCadastral }}</span>
                </div>
                @if (result()!.anoObito && result()!.anoObito !== '0000') {
                  <div class="info-field warn-field">
                    <span class="f-label">Ano do Óbito</span>
                    <span class="f-value warn-value">{{ result()!.anoObito }}</span>
                  </div>
                }
                @if (result()!.mensagemObito) {
                  <div class="info-field warn-field full-col">
                    <span class="f-label">Mensagem de Óbito</span>
                    <span class="f-value warn-value">{{ result()!.mensagemObito }}</span>
                  </div>
                }
              </div>
            </div>

            <div class="info-section">
              <p class="section-label">Consulta RFB</p>
              <div class="fields-grid">
                <div class="info-field full-col">
                  <span class="f-label">Protocolo RFB</span>
                  <span class="f-value mono">{{ result()!.protocoloRFB }}</span>
                </div>
                <div class="info-field full-col">
                  <span class="f-label">Data / Hora da Consulta</span>
                  <span class="f-value">{{ result()!.dataConsultaRFB }}</span>
                </div>
                <div class="info-field full-col">
                  <span class="f-label">Mensagem</span>
                  <span class="f-value success-value">{{ result()!.mensagem }}</span>
                </div>
              </div>
            </div>

          </div>

          <!-- Rodapé da transação -->
          <div class="result-footer">
            <mat-icon [class.ok]="result()!.transacao.status" [class.fail]="!result()!.transacao.status">
              {{ result()!.transacao.status ? 'check_circle' : 'cancel' }}
            </mat-icon>
            <span>Transação: {{ result()!.transacao.status ? 'Sucesso' : 'Falha' }}</span>
            @if (result()!.transacao.codigoStatus) {
              <span class="footer-code">Código {{ result()!.transacao.codigoStatus }}</span>
            }
            @if (result()!.transacao.codigoStatusDescricao) {
              <span class="footer-desc">{{ result()!.transacao.codigoStatusDescricao }}</span>
            }
          </div>

        </div>
      }
    </div>
  `,
  styles: [`
    /* ─── Formulário ──────────────────────── */
    .search-form { width: 100%; }

    .fields-row {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      flex-wrap: wrap;
    }

    .field-cpf  { flex: 0 0 220px; }
    .field-date { flex: 0 0 220px; }

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

    /* ─── Erro ────────────────────────────── */
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

    .error-card > mat-icon {
      color: #f44336;
      font-size: 22px;
      width: 22px;
      height: 22px;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .error-body { flex: 1; }

    .error-title {
      font-weight: 600;
      font-size: 14px;
      color: #f44336 !important;
      margin-bottom: 4px;
    }

    .error-msg {
      font-size: 13px;
      color: var(--text-sec) !important;
    }

    /* ─── Resultado ───────────────────────── */
    .result-wrapper {
      margin-top: 20px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      overflow: hidden;
      box-shadow: var(--card-shadow);
    }

    /* Topo */
    .result-top {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 24px 28px;
      border-bottom: 1px solid var(--border);
      background: rgba(112, 199, 60, 0.04);
      flex-wrap: wrap;
    }

    .result-avatar {
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background: var(--primary-dark, #3d5afe);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 700;
      flex-shrink: 0;
      letter-spacing: 1px;
    }

    .result-identity { flex: 1; min-width: 0; }

    .result-nome {
      font-size: 20px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 6px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .result-meta {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 13px;
      color: var(--text-sec);
      font-variant-numeric: tabular-nums;

      mat-icon { font-size: 15px; width: 15px; height: 15px; color: var(--body-label); }
    }

    .result-status-wrap { flex-shrink: 0; }

    .situacao-badge {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 8px 16px 8px 12px;
      border-radius: 24px;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.5px;

      mat-icon { font-size: 18px; width: 18px; height: 18px; }

      &.regular {
        background: var(--active-bg);
        color: var(--active-color);
      }
      &.irregular {
        background: var(--inactive-bg);
        color: var(--inactive-color);
      }
    }

    /* Grid de informações */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0;
    }

    .info-section {
      padding: 20px 28px;
      border-right: 1px solid var(--border);

      &:last-child { border-right: none; }
    }

    .section-label {
      font-size: 11px !important;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--body-label) !important;
      margin-bottom: 14px;
    }

    .fields-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px 20px;
    }

    .info-field { display: flex; flex-direction: column; gap: 4px; }

    .full-col { grid-column: 1 / -1; }

    .f-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: var(--text-ter);
    }

    .f-value {
      font-size: 14px;
      font-weight: 500;
      color: var(--text);
    }

    .f-value.mono {
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 13px;
      letter-spacing: 1px;
      color: var(--primary-dark, #3d5afe);
    }

    .f-value.success-value { color: var(--active-color); }
    .f-value.warn-value    { color: var(--inactive-color); }

    .warn-field .f-label { color: rgba(244, 67, 54, 0.7); }

    /* Rodapé */
    .result-footer {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 28px;
      border-top: 1px solid var(--border);
      background: rgba(0, 0, 0, 0.12);
      font-size: 13px;
      color: var(--text-sec);

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;

        &.ok   { color: var(--active-color); }
        &.fail { color: var(--inactive-color); }
      }
    }

    .footer-code {
      background: var(--border);
      padding: 2px 10px;
      border-radius: 10px;
      font-size: 12px;
      color: var(--text-sec);
    }

    .footer-desc { color: var(--text-sec); }

    /* ─── Responsivo ─────────────────────── */
    @media (max-width: 900px) {
      .info-grid { grid-template-columns: 1fr; }
      .info-section { border-right: none; border-bottom: 1px solid var(--border); }
      .info-section:last-child { border-bottom: none; }
    }

    @media (max-width: 768px) {
      .fields-row { flex-direction: column; }
      .field-cpf, .field-date { flex: 1 1 100%; }
      .btn-consultar { width: 100%; justify-content: center; margin-top: 0; }
      .result-top { flex-direction: column; align-items: flex-start; }
      .fields-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class CpfConsultaComponent {
  private service = inject(CpfConsultaService);

  loading = signal(false);
  error   = signal<string | null>(null);
  result  = signal<CpfResult | null>(null);

  form = new FormGroup({
    cpf: new FormControl('', [Validators.required, Validators.minLength(14)]),
    dataNascimento: new FormControl('', [Validators.required]),
  });

  maskCpf(event: Event) {
    const input = event.target as HTMLInputElement;
    let v = input.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 9)      v = `${v.slice(0,3)}.${v.slice(3,6)}.${v.slice(6,9)}-${v.slice(9)}`;
    else if (v.length > 6) v = `${v.slice(0,3)}.${v.slice(3,6)}.${v.slice(6)}`;
    else if (v.length > 3) v = `${v.slice(0,3)}.${v.slice(3)}`;
    this.form.get('cpf')!.setValue(v, { emitEvent: false });
    input.value = v;
  }

  consultar() {
    if (this.form.invalid || this.loading()) return;

    const cpfRaw = this.form.value.cpf!.replace(/\D/g, '');
    const [y, m, d] = this.form.value.dataNascimento!.split('-');
    const dataNascimento = `${d}/${m}/${y}`;

    this.loading.set(true);
    this.error.set(null);
    this.result.set(null);

    this.service.consultar({ Documento: cpfRaw, DataNascimento: dataNascimento }).subscribe({
      next: (data: CpfResult) => {
        this.result.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        const msg =
          err?.error?.mensagem ??
          err?.error?.message ??
          err?.error?.titulo ??
          'Não foi possível consultar o CPF. Verifique os dados e tente novamente.';
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }

  isRegular(): boolean {
    return (this.result()?.situacaoRFB ?? '').toUpperCase() === 'REGULAR';
  }

  formatCpf(doc: string): string {
    const d = doc.replace(/\D/g, '');
    if (d.length !== 11) return doc;
    return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
  }

  initials(nome: string): string {
    return (nome ?? '')
      .split(' ')
      .filter(p => p.length > 2)
      .slice(0, 2)
      .map(p => p[0])
      .join('')
      .toUpperCase();
  }
}
