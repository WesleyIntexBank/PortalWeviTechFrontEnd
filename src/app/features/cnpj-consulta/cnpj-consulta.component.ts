import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CnpjConsultaService } from '../../core/services/cnpj-consulta.service';

interface CnpjResult {
  documento: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  dataFundacao: string;
  matrizFilial: string;
  capital: string | null;
  codigoAtividadeEconomica: string | null;
  codigoAtividadeEconomicaDescricao: string | null;
  codigoNaturezaJuridica: string | null;
  codigoNaturezaJuridicaDescricao: string | null;
  situacaoRFB: string;
  dataSituacaoRFB: string | null;
  dataConsultaRFB: string | null;
  dataMotivoEspecialSituacaoRFB: string | null;
  enderecos: any[] | null;
  email: string | null;
  telefone: string | null;
  sqa: any | null;
  mensagem: string | null;
  status: boolean;
}

@Component({
  selector: 'app-cnpj-consulta',
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
        <mat-icon>domain</mat-icon>
        <h1>Consulta CNPJ</h1>
      </div>

      <!-- Formulário -->
      <div class="card-container">
        <form [formGroup]="form" (ngSubmit)="consultar()" class="search-form">
          <div class="fields-row">
            <mat-form-field appearance="outline" class="field-cnpj">
              <mat-label>CNPJ</mat-label>
              <mat-icon matPrefix>domain</mat-icon>
              <input
                matInput
                formControlName="cnpj"
                placeholder="00.000.000/0000-00"
                maxlength="18"
                (input)="maskCnpj($event)"
              >
              @if (form.get('cnpj')?.hasError('required') && form.get('cnpj')?.touched) {
                <mat-error>CNPJ é obrigatório</mat-error>
              } @else if (form.get('cnpj')?.hasError('minlength') && form.get('cnpj')?.touched) {
                <mat-error>CNPJ inválido</mat-error>
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

      <!-- Resultado -->
      @if (result() && !loading()) {
        <div class="result-wrapper">

          <!-- Cabeçalho -->
          <div class="result-top">
            <div class="result-avatar">
              <mat-icon>domain</mat-icon>
            </div>
            <div class="result-identity">
              <h2 class="result-nome">{{ result()!.razaoSocial }}</h2>
              @if (result()!.nomeFantasia) {
                <p class="nome-fantasia">{{ result()!.nomeFantasia }}</p>
              }
              <div class="result-meta">
                <span class="meta-item">
                  <mat-icon>tag</mat-icon>
                  {{ formatCnpj(result()!.documento) }}
                </span>
                <span class="meta-item">
                  <mat-icon>calendar_today</mat-icon>
                  Fundação: {{ result()!.dataFundacao }}
                </span>
                <span class="meta-item matriz-badge" [class.matriz]="isMatriz()" [class.filial]="!isMatriz()">
                  <mat-icon>{{ isMatriz() ? 'account_balance' : 'call_split' }}</mat-icon>
                  {{ result()!.matrizFilial }}
                </span>
              </div>
            </div>
            <div class="result-status-wrap">
              <span class="situacao-badge" [class.ativa]="isAtiva()" [class.inativa]="!isAtiva()">
                <mat-icon>{{ isAtiva() ? 'verified' : 'gpp_bad' }}</mat-icon>
                {{ result()!.situacaoRFB }}
              </span>
            </div>
          </div>

          <!-- Informações da empresa -->
          <div class="info-grid two-col">
            <div class="info-section">
              <p class="section-label">Atividade e Capital</p>
              <div class="fields-grid">
                @if (result()!.codigoAtividadeEconomica) {
                  <div class="info-field">
                    <span class="f-label">Cód. CNAE</span>
                    <span class="f-value mono">{{ result()!.codigoAtividadeEconomica }}</span>
                  </div>
                }
                @if (result()!.capital) {
                  <div class="info-field">
                    <span class="f-label">Capital Social</span>
                    <span class="f-value">R$ {{ result()!.capital }}</span>
                  </div>
                }
                @if (result()!.codigoAtividadeEconomicaDescricao) {
                  <div class="info-field full-col">
                    <span class="f-label">Atividade Econômica</span>
                    <span class="f-value">{{ result()!.codigoAtividadeEconomicaDescricao }}</span>
                  </div>
                }
                @if (result()!.codigoNaturezaJuridica) {
                  <div class="info-field">
                    <span class="f-label">Cód. Natureza Jurídica</span>
                    <span class="f-value mono">{{ result()!.codigoNaturezaJuridica }}</span>
                  </div>
                }
                @if (result()!.codigoNaturezaJuridicaDescricao) {
                  <div class="info-field full-col">
                    <span class="f-label">Natureza Jurídica</span>
                    <span class="f-value">{{ result()!.codigoNaturezaJuridicaDescricao }}</span>
                  </div>
                }
              </div>
            </div>

            <div class="info-section">
              <p class="section-label">Consulta RFB</p>
              <div class="fields-grid">
                @if (result()!.dataSituacaoRFB) {
                  <div class="info-field">
                    <span class="f-label">Data Situação RFB</span>
                    <span class="f-value">{{ result()!.dataSituacaoRFB }}</span>
                  </div>
                }
                @if (result()!.dataConsultaRFB) {
                  <div class="info-field">
                    <span class="f-label">Data da Consulta</span>
                    <span class="f-value">{{ result()!.dataConsultaRFB }}</span>
                  </div>
                }
                @if (result()!.dataMotivoEspecialSituacaoRFB) {
                  <div class="info-field full-col">
                    <span class="f-label">Motivo Especial Situação</span>
                    <span class="f-value warn-value">{{ result()!.dataMotivoEspecialSituacaoRFB }}</span>
                  </div>
                }
                @if (result()!.mensagem) {
                  <div class="info-field full-col">
                    <span class="f-label">Mensagem</span>
                    <span class="f-value success-value">{{ result()!.mensagem }}</span>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Contatos (se existirem) -->
          @if (result()!.email || result()!.telefone) {
            <div class="info-section border-top">
              <p class="section-label">
                <mat-icon class="label-icon">contacts</mat-icon>
                Contatos
              </p>
              <div class="contact-list">
                @if (result()!.telefone) {
                  <div class="contact-item">
                    <mat-icon>phone</mat-icon>
                    <span>{{ result()!.telefone }}</span>
                  </div>
                }
                @if (result()!.email) {
                  <div class="contact-item">
                    <mat-icon>alternate_email</mat-icon>
                    <span>{{ result()!.email }}</span>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Endereços (se existirem) -->
          @if (result()!.enderecos?.length) {
            <div class="info-section border-top">
              <p class="section-label">
                <mat-icon class="label-icon">location_on</mat-icon>
                Endereços
              </p>
              <div class="cards-list">
                @for (end of result()!.enderecos!; track $index) {
                  <div class="sub-card">
                    <div class="sub-card-body">
                      @if (end.logradouro) {
                        <div class="info-field">
                          <span class="f-label">Logradouro</span>
                          <span class="f-value">{{ end.logradouro }}, {{ end.numero }}</span>
                        </div>
                      }
                      @if (end.bairro) {
                        <div class="info-field">
                          <span class="f-label">Bairro</span>
                          <span class="f-value">{{ end.bairro }}</span>
                        </div>
                      }
                      @if (end.cidade) {
                        <div class="info-field">
                          <span class="f-label">Cidade / Estado</span>
                          <span class="f-value">{{ end.cidade }} - {{ end.estado }}</span>
                        </div>
                      }
                      @if (end.cep) {
                        <div class="info-field">
                          <span class="f-label">CEP</span>
                          <span class="f-value mono">{{ formatCep(end.cep) }}</span>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Rodapé -->
          <div class="result-footer">
            <mat-icon [class.ok]="result()!.status" [class.fail]="!result()!.status">
              {{ result()!.status ? 'check_circle' : 'cancel' }}
            </mat-icon>
            <span>Consulta: {{ result()!.status ? 'Sucesso' : 'Falha' }}</span>
          </div>

        </div>
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

    .field-cnpj { flex: 0 0 260px; }

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

    /* Resultado */
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
      background: rgba(61, 90, 254, 0.04);
      flex-wrap: wrap;
    }

    .result-avatar {
      width: 58px;
      height: 58px;
      border-radius: 12px;
      background: rgba(61, 90, 254, 0.15);
      color: var(--primary-dark, #3d5afe);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      mat-icon { font-size: 28px; width: 28px; height: 28px; }
    }

    .result-identity { flex: 1; min-width: 0; }

    .result-nome {
      font-size: 20px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 4px;
    }

    .nome-fantasia {
      font-size: 13px;
      color: var(--text-sec);
      margin-bottom: 8px;
    }

    .result-meta {
      display: flex;
      gap: 14px;
      flex-wrap: wrap;
      align-items: center;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 13px;
      color: var(--text-sec);

      mat-icon { font-size: 15px; width: 15px; height: 15px; color: var(--body-label); }
    }

    .matriz-badge {
      padding: 3px 10px 3px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;

      &.matriz { background: rgba(61,90,254,0.12); color: var(--primary-dark, #3d5afe); }
      &.filial  { background: rgba(255,167,38,0.12); color: #e65100; }
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

      &.ativa   { background: var(--active-bg); color: var(--active-color); }
      &.inativa { background: var(--inactive-bg); color: var(--inactive-color); }
    }

    /* Grid de seções */
    .info-grid { display: grid; gap: 0; }
    .two-col { grid-template-columns: 1fr 1fr; }
    .border-top { border-top: 1px solid var(--border); }

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
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .label-icon { font-size: 15px; width: 15px; height: 15px; }

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

    .f-value { font-size: 14px; font-weight: 500; color: var(--text); }

    .f-value.mono {
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 13px;
      letter-spacing: 1px;
      color: var(--primary-dark, #3d5afe);
    }

    .f-value.success-value { color: var(--active-color); }
    .f-value.warn-value    { color: var(--inactive-color); }

    /* Contatos */
    .contact-list { display: flex; flex-direction: column; gap: 8px; }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      color: var(--text);

      mat-icon { font-size: 18px; width: 18px; height: 18px; color: var(--body-label); }
    }

    /* Cards internos */
    .cards-list { display: flex; flex-direction: column; gap: 12px; }

    .sub-card {
      background: rgba(0,0,0,0.06);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 14px 18px;
    }

    .sub-card-body {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 20px;
    }

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

    /* Responsivo */
    @media (max-width: 900px) {
      .two-col { grid-template-columns: 1fr; }
      .info-section { border-right: none; border-bottom: 1px solid var(--border); }
      .info-section:last-child { border-bottom: none; }
    }

    @media (max-width: 768px) {
      .fields-row { flex-direction: column; }
      .field-cnpj { flex: 1 1 100%; }
      .btn-consultar { width: 100%; justify-content: center; margin-top: 0; }
      .result-top { flex-direction: column; align-items: flex-start; }
      .sub-card-body { grid-template-columns: 1fr; }
    }
  `]
})
export class CnpjConsultaComponent {
  private service = inject(CnpjConsultaService);

  loading = signal(false);
  error   = signal<string | null>(null);
  result  = signal<CnpjResult | null>(null);

  form = new FormGroup({
    cnpj: new FormControl('', [Validators.required, Validators.minLength(18)]),
  });

  maskCnpj(event: Event) {
    const input = event.target as HTMLInputElement;
    let v = input.value.replace(/\D/g, '').slice(0, 14);
    if (v.length > 12)      v = `${v.slice(0,2)}.${v.slice(2,5)}.${v.slice(5,8)}/${v.slice(8,12)}-${v.slice(12)}`;
    else if (v.length > 8)  v = `${v.slice(0,2)}.${v.slice(2,5)}.${v.slice(5,8)}/${v.slice(8)}`;
    else if (v.length > 5)  v = `${v.slice(0,2)}.${v.slice(2,5)}.${v.slice(5)}`;
    else if (v.length > 2)  v = `${v.slice(0,2)}.${v.slice(2)}`;
    this.form.get('cnpj')!.setValue(v, { emitEvent: false });
    input.value = v;
  }

  consultar() {
    if (this.form.invalid || this.loading()) return;
    const cnpjRaw = this.form.value.cnpj!.replace(/\D/g, '');

    this.loading.set(true);
    this.error.set(null);
    this.result.set(null);

    this.service.consultar(cnpjRaw).subscribe({
      next: (data: CnpjResult) => {
        this.result.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        const msg =
          err?.error?.mensagem ??
          err?.error?.message ??
          'Não foi possível consultar o CNPJ. Verifique os dados e tente novamente.';
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }

  isAtiva(): boolean {
    return (this.result()?.situacaoRFB ?? '').toUpperCase() === 'ATIVA';
  }

  isMatriz(): boolean {
    return (this.result()?.matrizFilial ?? '').toUpperCase() === 'MATRIZ';
  }

  formatCnpj(doc: string): string {
    const d = doc.replace(/\D/g, '');
    if (d.length !== 14) return doc;
    return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`;
  }

  formatCep(cep: string): string {
    const d = cep.replace(/\D/g, '');
    if (d.length !== 8) return cep;
    return `${d.slice(0,5)}-${d.slice(5)}`;
  }
}
