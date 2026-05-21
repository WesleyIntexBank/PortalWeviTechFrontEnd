import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CpfEstendidaService } from '../../core/services/cpf-estendida.service';

interface GeoLocalizacao {
  latitude: number;
  longitude: number;
  plusCodes: string;
}

interface Endereco {
  tipo: number;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  geoLocalizacao: GeoLocalizacao | null;
  dataAtualizacao: string;
}

interface Telefone {
  tipoTelefone: number;
  numero: string;
  ramal: string | null;
  dataAtualizacao: string;
}

interface Email {
  email: string;
}

interface Participacao {
  documento: string;
  nome: string;
}

interface CpfEstendidaResult {
  documento: string;
  nome: string;
  nomeSocial: string | null;
  nomeMae: string | null;
  dataNascimento: string;
  escolaridade: string | null;
  sexo: string | null;
  situacaoRFB: string;
  protocoloRFB: string;
  digitoVerificador: string;
  dirpf: string | null;
  dataConsultaRFB: string;
  enderecos: Endereco[];
  telefones: Telefone[];
  emails: Email[];
  participacoes: Participacao[];
  atividadeProfissional: string | null;
  rendaPresumida: string | null;
  cargo: string | null;
  mensagem: string;
  status: boolean;
  transacao: { status: boolean; codigoStatus: string | null; codigoStatusDescricao: string | null };
}

@Component({
  selector: 'app-cpf-estendida',
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
        <mat-icon>manage_accounts</mat-icon>
        <h1>Consulta CPF Estendida</h1>
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
            <div class="result-avatar">{{ initials(result()!.nome) }}</div>
            <div class="result-identity">
              <h2 class="result-nome">{{ result()!.nome }}</h2>
              @if (result()!.nomeSocial) {
                <p class="nome-social">Nome social: {{ result()!.nomeSocial }}</p>
              }
              <div class="result-meta">
                <span class="meta-item">
                  <mat-icon>badge</mat-icon>
                  {{ formatCpf(result()!.documento) }}
                </span>
                <span class="meta-item">
                  <mat-icon>cake</mat-icon>
                  {{ result()!.dataNascimento }}
                </span>
                @if (result()!.sexo) {
                  <span class="meta-item">
                    <mat-icon>person</mat-icon>
                    {{ result()!.sexo }}
                  </span>
                }
                @if (result()!.escolaridade) {
                  <span class="meta-item">
                    <mat-icon>school</mat-icon>
                    {{ result()!.escolaridade }}
                  </span>
                }
              </div>
            </div>
            <div class="result-status-wrap">
              <span class="situacao-badge" [class.regular]="isRegular()" [class.irregular]="!isRegular()">
                <mat-icon>{{ isRegular() ? 'verified' : 'gpp_bad' }}</mat-icon>
                {{ result()!.situacaoRFB }}
              </span>
            </div>
          </div>

          <!-- Seção: Mãe / Profissão -->
          <div class="info-grid two-col">
            <div class="info-section">
              <p class="section-label">Dados Pessoais</p>
              <div class="fields-grid">
                @if (result()!.nomeMae) {
                  <div class="info-field full-col">
                    <span class="f-label">Nome da Mãe</span>
                    <span class="f-value">{{ result()!.nomeMae }}</span>
                  </div>
                }
                @if (result()!.atividadeProfissional) {
                  <div class="info-field full-col">
                    <span class="f-label">Atividade Profissional</span>
                    <span class="f-value">{{ result()!.atividadeProfissional }}</span>
                  </div>
                }
                @if (result()!.cargo) {
                  <div class="info-field">
                    <span class="f-label">Cargo</span>
                    <span class="f-value">{{ result()!.cargo }}</span>
                  </div>
                }
                @if (result()!.rendaPresumida && result()!.rendaPresumida !== '0') {
                  <div class="info-field">
                    <span class="f-label">Renda Presumida</span>
                    <span class="f-value">{{ result()!.rendaPresumida }}</span>
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
                <div class="info-field">
                  <span class="f-label">Dígito Verificador</span>
                  <span class="f-value">{{ result()!.digitoVerificador }}</span>
                </div>
                <div class="info-field">
                  <span class="f-label">Data da Consulta</span>
                  <span class="f-value">{{ formatDate(result()!.dataConsultaRFB) }}</span>
                </div>
                <div class="info-field full-col">
                  <span class="f-label">Mensagem</span>
                  <span class="f-value success-value">{{ result()!.mensagem }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Endereços -->
          @if (result()!.enderecos.length) {
            <div class="info-section border-top">
              <p class="section-label">
                <mat-icon class="label-icon">location_on</mat-icon>
                Endereços
              </p>
              <div class="cards-list">
                @for (end of result()!.enderecos; track $index) {
                  <div class="sub-card">
                    <div class="sub-card-body">
                      <div class="info-field">
                        <span class="f-label">Logradouro</span>
                        <span class="f-value">
                          {{ end.logradouro }}, {{ end.numero }}
                          @if (end.complemento) { {{ end.complemento }} }
                        </span>
                      </div>
                      <div class="info-field">
                        <span class="f-label">Bairro</span>
                        <span class="f-value">{{ end.bairro }}</span>
                      </div>
                      <div class="info-field">
                        <span class="f-label">Cidade / Estado</span>
                        <span class="f-value">{{ end.cidade }} - {{ end.estado }}</span>
                      </div>
                      <div class="info-field">
                        <span class="f-label">CEP</span>
                        <span class="f-value mono">{{ formatCep(end.cep) }}</span>
                      </div>
                      @if (end.geoLocalizacao) {
                        <div class="info-field full-col">
                          <span class="f-label">Geolocalização</span>
                          <span class="f-value geo-value">
                            <mat-icon>my_location</mat-icon>
                            Lat {{ end.geoLocalizacao.latitude | number:'1.4-6' }} /
                            Lon {{ end.geoLocalizacao.longitude | number:'1.4-6' }}
                            &nbsp;·&nbsp; {{ end.geoLocalizacao.plusCodes }}
                          </span>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Telefones / Emails em linha -->
          @if (result()!.telefones.length || result()!.emails.length) {
            <div class="info-grid two-col border-top">
              @if (result()!.telefones.length) {
                <div class="info-section">
                  <p class="section-label">
                    <mat-icon class="label-icon">phone</mat-icon>
                    Telefones
                  </p>
                  <div class="contact-list">
                    @for (tel of result()!.telefones; track $index) {
                      <div class="contact-item">
                        <mat-icon>{{ tipoTelefoneIcon(tel.tipoTelefone) }}</mat-icon>
                        <span>{{ formatPhone(tel.numero) }}</span>
                        <span class="contact-tag">{{ tipoTelefoneLabel(tel.tipoTelefone) }}</span>
                      </div>
                    }
                  </div>
                </div>
              }

              @if (result()!.emails.length) {
                <div class="info-section">
                  <p class="section-label">
                    <mat-icon class="label-icon">email</mat-icon>
                    E-mails
                  </p>
                  <div class="contact-list">
                    @for (e of result()!.emails; track $index) {
                      <div class="contact-item">
                        <mat-icon>alternate_email</mat-icon>
                        <span>{{ e.email }}</span>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          }

          <!-- Participações em empresas -->
          @if (result()!.participacoes.length) {
            <div class="info-section border-top">
              <p class="section-label">
                <mat-icon class="label-icon">business</mat-icon>
                Participações em Empresas
              </p>
              <div class="cards-list">
                @for (p of result()!.participacoes; track $index) {
                  <div class="sub-card empresa-card">
                    <div class="empresa-icon">
                      <mat-icon>domain</mat-icon>
                    </div>
                    <div class="sub-card-body">
                      <div class="info-field">
                        <span class="f-label">Razão Social</span>
                        <span class="f-value">{{ p.nome }}</span>
                      </div>
                      <div class="info-field">
                        <span class="f-label">CNPJ</span>
                        <span class="f-value mono">{{ formatCnpj(p.documento) }}</span>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Rodapé -->
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
    .search-form { width: 100%; }

    .fields-row {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      flex-wrap: wrap;
    }

    .field-cpf { flex: 0 0 260px; }

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
      margin-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .nome-social {
      font-size: 13px;
      color: var(--text-sec);
      margin-bottom: 6px;
    }

    .result-meta {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 13px;
      color: var(--text-sec);

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

      &.regular { background: var(--active-bg); color: var(--active-color); }
      &.irregular { background: var(--inactive-bg); color: var(--inactive-color); }
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

    .geo-value {
      display: flex;
      align-items: center;
      gap: 5px;
      font-family: 'Consolas', monospace;
      font-size: 12px;
      color: var(--text-sec) !important;

      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }

    /* Cards internos (endereços / participações) */
    .cards-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .sub-card {
      background: rgba(0,0,0,0.06);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 14px 18px;
      display: flex;
      gap: 14px;
    }

    .empresa-card { align-items: center; }

    .empresa-icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      background: rgba(61, 90, 254, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      mat-icon { color: var(--primary-dark, #3d5afe); }
    }

    .sub-card-body {
      flex: 1;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 20px;
    }

    /* Telefones / Emails */
    .contact-list { display: flex; flex-direction: column; gap: 8px; }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      color: var(--text);

      mat-icon { font-size: 18px; width: 18px; height: 18px; color: var(--body-label); }
    }

    .contact-tag {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 10px;
      background: var(--border);
      color: var(--text-sec);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.4px;
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

    .footer-code {
      background: var(--border);
      padding: 2px 10px;
      border-radius: 10px;
      font-size: 12px;
      color: var(--text-sec);
    }

    .footer-desc { color: var(--text-sec); }

    /* Responsivo */
    @media (max-width: 900px) {
      .two-col { grid-template-columns: 1fr; }
      .info-section { border-right: none; border-bottom: 1px solid var(--border); }
      .info-section:last-child { border-bottom: none; }
    }

    @media (max-width: 768px) {
      .fields-row { flex-direction: column; }
      .field-cpf { flex: 1 1 100%; }
      .btn-consultar { width: 100%; justify-content: center; margin-top: 0; }
      .result-top { flex-direction: column; align-items: flex-start; }
      .sub-card-body { grid-template-columns: 1fr; }
    }
  `]
})
export class CpfEstendidaComponent {
  private service = inject(CpfEstendidaService);

  loading = signal(false);
  error   = signal<string | null>(null);
  result  = signal<CpfEstendidaResult | null>(null);

  form = new FormGroup({
    cpf: new FormControl('', [Validators.required, Validators.minLength(14)]),
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

    this.loading.set(true);
    this.error.set(null);
    this.result.set(null);

    this.service.consultar(cpfRaw).subscribe({
      next: (data: CpfEstendidaResult) => {
        this.result.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        const msg =
          err?.error?.mensagem ??
          err?.error?.message ??
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

  formatPhone(num: string): string {
    const d = num.replace(/\D/g, '');
    if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
    if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
    return num;
  }

  formatDate(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString('pt-BR');
  }

  tipoTelefoneLabel(tipo: number): string {
    const labels: Record<number, string> = { 1: 'Fixo', 2: 'Comercial', 3: 'Celular', 4: 'Fax' };
    return labels[tipo] ?? 'Outro';
  }

  tipoTelefoneIcon(tipo: number): string {
    return tipo === 3 ? 'smartphone' : 'phone';
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
