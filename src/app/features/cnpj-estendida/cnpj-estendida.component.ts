import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CnpjEstendidaService } from '../../core/services/cnpj-estendida.service';

interface Transacao {
  status: boolean;
  codigoStatus: string | null;
  codigoStatusDescricao: string | null;
}

interface Socio {
  documentoPai: string;
  documento: string;
  razaoSocial: string;
  dataEntrada: string;
  participacaoValor: number;
  participacaoPercentual: number;
  pessoa: string;
  cargo: string;
  protocoloRF: string | null;
  situacaoRFB: string;
  atividadeProfissional: string | null;
  rendaPresumida: string | null;
  obito: boolean;
  aposentado: boolean;
  lavaJato: boolean;
  funcionarioPublico: boolean;
  empresario: boolean;
  mei: boolean;
  clt: boolean;
  produtorRural: boolean;
  bolsaFamilia: boolean;
  auxilioEmergencial: boolean;
  ofac: boolean;
  interpol: boolean;
  onu: boolean;
  cvm: boolean;
  mandadoPrisao: boolean;
  inidoneo: boolean;
  ppn: boolean;
  escolaridade: string | null;
  transacao: Transacao;
  nomeRepresentanteLegal: string | null;
  cargoRepresentanteLegal: string | null;
}

interface Endereco {
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
}

interface CnpjEstendidaResult {
  documentoPai: string;
  documento: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  dataFundacao: string;
  capital: string | null;
  situacaoRFB: string;
  codigoAtividadeEconomica: string | null;
  codigoAtividadeEconomicaDescricao: string | null;
  matrizFilial: string;
  dataSituacaoRFB: string | null;
  dataConsultaRFB: string | null;
  administradores: any[];
  codigoNaturezaJuridica: string | null;
  codigoNaturezaJuridicaDescricao: string | null;
  cnaes: any[] | null;
  enderecos: Endereco[] | null;
  telefone: string | null;
  email: string | null;
  quadroSocial: Socio[];
}

interface RiskFlag {
  key: keyof Socio;
  label: string;
  icon: string;
  danger: boolean;
}

const RISK_FLAGS: RiskFlag[] = [
  { key: 'lavaJato',           label: 'Lava Jato',           icon: 'policy',        danger: true  },
  { key: 'mandadoPrisao',      label: 'Mandado de Prisão',   icon: 'gavel',         danger: true  },
  { key: 'inidoneo',           label: 'Inidôneo',            icon: 'block',         danger: true  },
  { key: 'ofac',               label: 'OFAC',                icon: 'public_off',    danger: true  },
  { key: 'interpol',           label: 'Interpol',            icon: 'travel_explore',danger: true  },
  { key: 'onu',                label: 'ONU',                  icon: 'flag',          danger: true  },
  { key: 'cvm',                label: 'CVM',                  icon: 'account_balance',danger: true },
  { key: 'ppn',                label: 'PPN',                  icon: 'warning',       danger: true  },
  { key: 'obito',              label: 'Óbito',               icon: 'person_off',    danger: true  },
  { key: 'funcionarioPublico', label: 'Func. Público',       icon: 'badge',         danger: false },
  { key: 'empresario',         label: 'Empresário',          icon: 'business_center',danger: false},
  { key: 'aposentado',         label: 'Aposentado',          icon: 'elderly',       danger: false },
  { key: 'mei',                label: 'MEI',                  icon: 'storefront',    danger: false },
  { key: 'clt',                label: 'CLT',                  icon: 'work',          danger: false },
  { key: 'produtorRural',      label: 'Prod. Rural',         icon: 'agriculture',   danger: false },
  { key: 'bolsaFamilia',       label: 'Bolsa Família',       icon: 'volunteer_activism',danger: false},
  { key: 'auxilioEmergencial', label: 'Auxílio Emergencial', icon: 'support',       danger: false },
];

@Component({
  selector: 'app-cnpj-estendida',
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
        <mat-icon>domain_verification</mat-icon>
        <h1>Consulta CNPJ Estendida</h1>
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

          <!-- ── Cabeçalho da empresa ── -->
          <div class="result-top">
            <div class="result-avatar">
              <mat-icon>domain</mat-icon>
            </div>
            <div class="result-identity">
              <h2 class="result-nome">{{ result()!.razaoSocial }}</h2>
              @if (result()!.nomeFantasia && result()!.nomeFantasia !== result()!.razaoSocial) {
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

          <!-- ── Atividade e Natureza ── -->
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
                @if (result()!.telefone) {
                  <div class="info-field">
                    <span class="f-label">Telefone</span>
                    <span class="f-value">{{ result()!.telefone }}</span>
                  </div>
                }
                @if (result()!.email) {
                  <div class="info-field">
                    <span class="f-label">E-mail</span>
                    <span class="f-value">{{ result()!.email }}</span>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- ── Endereços ── -->
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
                          <span class="f-value mono">{{ formatCep(end.cep!) }}</span>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- ── Quadro Social ── -->
          @if (result()!.quadroSocial.length) {
            <div class="info-section border-top">
              <p class="section-label">
                <mat-icon class="label-icon">groups</mat-icon>
                Quadro Social · {{ result()!.quadroSocial.length }} sócio(s)
              </p>

              <div class="socios-list">
                @for (socio of result()!.quadroSocial; track socio.documento) {
                  <div class="socio-card">

                    <!-- Topo do sócio -->
                    <div class="socio-header">
                      <div class="socio-avatar" [class.pf]="socio.pessoa === 'Fisica'" [class.pj]="socio.pessoa !== 'Fisica'">
                        <mat-icon>{{ socio.pessoa === 'Fisica' ? 'person' : 'business' }}</mat-icon>
                      </div>
                      <div class="socio-identity">
                        <span class="socio-nome">{{ socio.razaoSocial }}</span>
                        <div class="socio-meta">
                          <span class="meta-item">
                            <mat-icon>{{ socio.pessoa === 'Fisica' ? 'badge' : 'domain' }}</mat-icon>
                            {{ socio.pessoa === 'Fisica' ? formatCpf(socio.documento) : formatCnpj(socio.documento) }}
                          </span>
                          <span class="meta-item">
                            <mat-icon>work</mat-icon>
                            {{ socio.cargo }}
                          </span>
                          <span class="meta-item">
                            <mat-icon>login</mat-icon>
                            Entrada: {{ formatDateBr(socio.dataEntrada) }}
                          </span>
                        </div>
                      </div>
                      <div class="socio-participacao">
                        <span class="participacao-pct">{{ socio.participacaoPercentual }}%</span>
                        <span class="participacao-val">R$ {{ socio.participacaoValor | number:'1.2-2':'pt-BR' }}</span>
                        <span class="situacao-mini" [class.regular]="socio.situacaoRFB === 'REGULAR'" [class.irregular]="socio.situacaoRFB !== 'REGULAR'">
                          {{ socio.situacaoRFB }}
                        </span>
                      </div>
                    </div>

                    <!-- Dados do sócio -->
                    <div class="socio-body">
                      @if (socio.atividadeProfissional) {
                        <div class="info-field">
                          <span class="f-label">Atividade Profissional</span>
                          <span class="f-value">{{ socio.atividadeProfissional }}</span>
                        </div>
                      }
                      @if (socio.rendaPresumida) {
                        <div class="info-field">
                          <span class="f-label">Renda Presumida</span>
                          <span class="f-value">{{ socio.rendaPresumida }}</span>
                        </div>
                      }
                      @if (socio.escolaridade) {
                        <div class="info-field">
                          <span class="f-label">Escolaridade</span>
                          <span class="f-value">{{ socio.escolaridade }}</span>
                        </div>
                      }
                      @if (socio.protocoloRF) {
                        <div class="info-field">
                          <span class="f-label">Protocolo RF</span>
                          <span class="f-value mono">{{ socio.protocoloRF }}</span>
                        </div>
                      }
                      @if (socio.nomeRepresentanteLegal) {
                        <div class="info-field">
                          <span class="f-label">Representante Legal</span>
                          <span class="f-value">{{ socio.nomeRepresentanteLegal }} — {{ socio.cargoRepresentanteLegal }}</span>
                        </div>
                      }
                    </div>

                    <!-- Flags de risco e perfil -->
                    @if (activeFlags(socio).length) {
                      <div class="socio-flags">
                        @for (flag of activeFlags(socio); track flag.key) {
                          <span class="flag-badge" [class.flag-danger]="flag.danger" [class.flag-info]="!flag.danger" [matTooltip]="flag.label">
                            <mat-icon>{{ flag.icon }}</mat-icon>
                            {{ flag.label }}
                          </span>
                        }
                      </div>
                    }

                  </div>
                }
              </div>
            </div>
          }

          <!-- ── Organograma Societário ── -->
          @if (result()!.quadroSocial.length) {
            <div class="info-section border-top">
              <p class="section-label">
                <mat-icon class="label-icon">account_tree</mat-icon>
                Organograma Societário
              </p>

              <div class="org-chart">
                <!-- Empresa (raiz) -->
                <div class="org-root-wrapper">
                  <div class="org-node org-root-node">
                    <div class="org-icon pj-icon"><mat-icon>domain</mat-icon></div>
                    <div class="org-info">
                      <span class="org-name">{{ result()!.razaoSocial }}</span>
                      <span class="org-doc">{{ formatCnpj(result()!.documento) }}</span>
                    </div>
                  </div>
                </div>

                <!-- Conector vertical root → sócios -->
                <div class="org-vline-root"></div>

                <!-- Sócios -->
                <div class="org-socios-row">
                  @for (socio of result()!.quadroSocial; track socio.documento; let first = $first; let last = $last) {
                    <div class="org-socio-col" [class.org-first]="first" [class.org-last]="last">
                      <div class="org-node" [class.org-pf]="socio.pessoa === 'Fisica'" [class.org-pj]="socio.pessoa !== 'Fisica'">
                        <div class="org-icon" [class.pf-icon]="socio.pessoa === 'Fisica'" [class.pj-icon]="socio.pessoa !== 'Fisica'">
                          <mat-icon>{{ socio.pessoa === 'Fisica' ? 'person' : 'business' }}</mat-icon>
                        </div>
                        <div class="org-info">
                          <span class="org-name">{{ socio.razaoSocial }}</span>
                          <span class="org-role">{{ socio.cargo }}</span>
                          <span class="org-pct">{{ socio.participacaoPercentual }}%</span>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>
          }

          <!-- ── Rodapé ── -->
          <div class="result-footer">
            <mat-icon class="ok">check_circle</mat-icon>
            <span>Consulta realizada com sucesso</span>
            <span class="footer-code">{{ formatCnpj(result()!.documento) }}</span>
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

    /* ── Erro ── */
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
    .error-msg   { font-size: 13px; color: var(--text-sec) !important; }

    /* ── Resultado ── */
    .result-wrapper {
      margin-top: 20px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      overflow: hidden;
      box-shadow: var(--card-shadow);
    }

    /* Topo empresa */
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

      mat-icon { font-size: 18px; width: 18px; height: 18px; }

      &.ativa   { background: var(--active-bg);   color: var(--active-color);   }
      &.inativa { background: var(--inactive-bg);  color: var(--inactive-color); }
    }

    /* ── Grid de seções ── */
    .info-grid      { display: grid; gap: 0; }
    .two-col        { grid-template-columns: 1fr 1fr; }
    .border-top     { border-top: 1px solid var(--border); }

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
    .full-col   { grid-column: 1 / -1; }

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

    /* ── Cards internos ── */
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

    /* ── Quadro Social ── */
    .socios-list { display: flex; flex-direction: column; gap: 16px; }

    .socio-card {
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
      background: rgba(0,0,0,0.03);
    }

    /* Cabeçalho do sócio */
    .socio-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      flex-wrap: wrap;
    }

    .socio-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      mat-icon { font-size: 22px; width: 22px; height: 22px; }

      &.pf {
        background: rgba(112, 199, 60, 0.15);
        color: #70c73c;
      }
      &.pj {
        background: rgba(61, 90, 254, 0.15);
        color: var(--primary-dark, #3d5afe);
      }
    }

    .socio-identity { flex: 1; min-width: 0; }

    .socio-nome {
      display: block;
      font-size: 15px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 5px;
    }

    .socio-meta {
      display: flex;
      gap: 14px;
      flex-wrap: wrap;
    }

    .socio-participacao {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
      flex-shrink: 0;
    }

    .participacao-pct {
      font-size: 22px;
      font-weight: 800;
      color: var(--primary-dark, #3d5afe);
      line-height: 1;
    }

    .participacao-val {
      font-size: 12px;
      color: var(--text-sec);
      font-variant-numeric: tabular-nums;
    }

    .situacao-mini {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 10px;
      letter-spacing: 0.4px;
      text-transform: uppercase;

      &.regular   { background: var(--active-bg);  color: var(--active-color);   }
      &.irregular { background: var(--inactive-bg); color: var(--inactive-color); }
    }

    /* Corpo do sócio */
    .socio-body {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 20px;
      padding: 14px 20px;
    }

    /* Flags */
    .socio-flags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 10px 20px 14px;
      border-top: 1px solid var(--border);
    }

    .flag-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 10px 3px 7px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      cursor: default;

      mat-icon { font-size: 13px; width: 13px; height: 13px; }

      &.flag-danger {
        background: rgba(244, 67, 54, 0.12);
        color: #e53935;
        border: 1px solid rgba(244, 67, 54, 0.25);
      }

      &.flag-info {
        background: rgba(61, 90, 254, 0.10);
        color: var(--primary-dark, #3d5afe);
        border: 1px solid rgba(61, 90, 254, 0.2);
      }
    }

    /* ── Rodapé ── */
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

    /* ── Organograma ── */
    .org-chart {
      display: flex;
      flex-direction: column;
      align-items: center;
      overflow-x: auto;
      padding: 4px 8px 16px;
    }

    .org-root-wrapper { position: relative; }

    .org-root-node {
      background: rgba(61, 90, 254, 0.08) !important;
      border: 2px solid rgba(61, 90, 254, 0.4) !important;
    }

    .org-vline-root {
      width: 2px;
      height: 24px;
      background: var(--border);
      margin: 0 auto;
    }

    .org-socios-row {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      position: relative;
    }

    .org-socio-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0 8px;
      position: relative;

      /* linha horizontal no topo */
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: var(--border);
      }

      /* linha começa no centro do primeiro filho */
      &.org-first::before { left: 50%; }

      /* linha termina no centro do último filho */
      &.org-last::before { right: 50%; }

      /* único filho: sem linha horizontal */
      &.org-first.org-last::before { display: none; }

      /* linha vertical de cada filho */
      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 2px;
        height: 24px;
        background: var(--border);
      }
    }

    .org-node {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      border-radius: 10px;
      border: 1.5px solid var(--border);
      background: var(--surface);
      min-width: 160px;
      max-width: 210px;
      margin-top: 24px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);

      &.org-pf { border-color: rgba(112, 199, 60, 0.55); background: rgba(112, 199, 60, 0.05); }
      &.org-pj { border-color: rgba(61, 90, 254, 0.38);  background: rgba(61, 90, 254, 0.04);  }
    }

    .org-icon {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      mat-icon { font-size: 18px; width: 18px; height: 18px; }

      &.pf-icon { background: rgba(112, 199, 60, 0.15); color: #70c73c; }
      &.pj-icon { background: rgba(61, 90, 254, 0.15);  color: var(--primary-dark, #3d5afe); }
    }

    .org-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .org-name {
      font-size: 12px;
      font-weight: 700;
      color: var(--text);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 148px;
    }

    .org-doc {
      font-size: 10px;
      color: var(--text-ter);
      font-family: 'Consolas', 'Monaco', monospace;
      letter-spacing: 0.5px;
    }

    .org-role {
      font-size: 10px;
      color: var(--text-sec);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 148px;
    }

    .org-pct {
      font-size: 14px;
      font-weight: 800;
      color: var(--primary-dark, #3d5afe);
      line-height: 1.2;
    }

    /* ── Responsivo ── */
    @media (max-width: 900px) {
      .two-col { grid-template-columns: 1fr; }
      .info-section { border-right: none; border-bottom: 1px solid var(--border); }
      .info-section:last-child { border-bottom: none; }
    }

    @media (max-width: 768px) {
      .fields-row     { flex-direction: column; }
      .field-cnpj     { flex: 1 1 100%; }
      .btn-consultar  { width: 100%; justify-content: center; margin-top: 0; }
      .result-top     { flex-direction: column; align-items: flex-start; }
      .sub-card-body  { grid-template-columns: 1fr; }
      .socio-body     { grid-template-columns: 1fr; }
      .socio-header   { flex-wrap: wrap; }
      .socio-participacao { flex-direction: row; align-items: center; gap: 10px; }
    }
  `]
})
export class CnpjEstendidaComponent {
  private service = inject(CnpjEstendidaService);

  loading = signal(false);
  error   = signal<string | null>(null);
  result  = signal<CnpjEstendidaResult | null>(null);

  form = new FormGroup({
    cnpj: new FormControl('', [Validators.required, Validators.minLength(18)]),
  });

  maskCnpj(event: Event) {
    const input = event.target as HTMLInputElement;
    let v = input.value.replace(/\D/g, '').slice(0, 14);
    if (v.length > 12)     v = `${v.slice(0,2)}.${v.slice(2,5)}.${v.slice(5,8)}/${v.slice(8,12)}-${v.slice(12)}`;
    else if (v.length > 8) v = `${v.slice(0,2)}.${v.slice(2,5)}.${v.slice(5,8)}/${v.slice(8)}`;
    else if (v.length > 5) v = `${v.slice(0,2)}.${v.slice(2,5)}.${v.slice(5)}`;
    else if (v.length > 2) v = `${v.slice(0,2)}.${v.slice(2)}`;
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
      next: (data: CnpjEstendidaResult) => {
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

  activeFlags(socio: Socio): RiskFlag[] {
    return RISK_FLAGS.filter(f => socio[f.key] === true);
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

  formatCpf(doc: string): string {
    const d = doc.replace(/\D/g, '');
    if (d.length !== 11) return doc;
    return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
  }

  formatCep(cep: string): string {
    const d = cep.replace(/\D/g, '');
    if (d.length !== 8) return cep;
    return `${d.slice(0,5)}-${d.slice(5)}`;
  }

  formatDateBr(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('pt-BR');
  }
}
