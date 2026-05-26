import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
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
    MatExpansionModule,
    MatDividerModule,
  ],
  template: `
    <div class="page-container">

      <!-- ── Cabeçalho ── -->
      <div class="page-header">
        <mat-icon>gavel</mat-icon>
        <h1>Processos Judiciais</h1>
      </div>

      <!-- ── Formulário de consulta ── -->
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

      <!-- ── Erro ── -->
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

      <!-- ── Resultados ── -->
      @if (result() && !loading()) {

        <!-- Cartão da entidade -->
        <div class="entity-card">
          <div class="entity-icon-wrap">
            <mat-icon>{{ result().tipo_pessoa === 'JURIDICA' ? 'business' : 'person' }}</mat-icon>
          </div>
          <div class="entity-info">
            <h2 class="entity-name">{{ result().nome || documentoFormatado() }}</h2>
            <span class="entity-tipo">
              {{ result().tipo_pessoa === 'JURIDICA' ? 'Pessoa Jurídica' : 'Pessoa Física' }}
            </span>
          </div>
          <div class="entity-badge-wrap">
            <span class="entity-doc-badge">{{ documentoFormatado() }}</span>
          </div>
        </div>

        <!-- Painel de métricas -->
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-icon-wrap primary">
              <mat-icon>folder_open</mat-icon>
            </div>
            <div class="stat-body">
              <span class="stat-label">Total de Processos</span>
              <span class="stat-value primary">{{ totalProcessos() }}</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon-wrap success">
              <mat-icon>play_circle_outline</mat-icon>
            </div>
            <div class="stat-body">
              <span class="stat-label">Em Andamento</span>
              <span class="stat-value success">{{ qtdAtivos() }}</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon-wrap muted">
              <mat-icon>archive</mat-icon>
            </div>
            <div class="stat-body">
              <span class="stat-label">Arquivados / Outros</span>
              <span class="stat-value muted">{{ qtdArquivados() }}</span>
            </div>
          </div>

          @if (qtdComAudiencia() > 0) {
            <div class="stat-card">
              <div class="stat-icon-wrap warn">
                <mat-icon>event_available</mat-icon>
              </div>
              <div class="stat-body">
                <span class="stat-label">Com Audiência</span>
                <span class="stat-value warn">{{ qtdComAudiencia() }}</span>
              </div>
            </div>
          }

          @if (totalValorCausas()) {
            <div class="stat-card stat-wide">
              <div class="stat-icon-wrap primary">
                <mat-icon>payments</mat-icon>
              </div>
              <div class="stat-body">
                <span class="stat-label">Total Valor das Causas</span>
                <span class="stat-value primary">{{ totalValorCausas() }}</span>
              </div>
            </div>
          }
        </div>

        <!-- Cabeçalho da lista -->
        @if (processos().length > 0) {
          <div class="list-header">
            <div class="list-header-left">
              <mat-icon>list_alt</mat-icon>
              <span class="list-title">Processos encontrados</span>
              <span class="list-count">{{ processos().length }}</span>
              @if (totalProcessos() > processos().length) {
                <span class="list-total">de {{ totalProcessos() }} no total</span>
              }
            </div>
          </div>

          <!-- Acordeão de processos -->
          <mat-accordion multi class="processos-accordion">
            @for (processo of processos(); track processo.numero_cnj ?? $index) {
              <mat-expansion-panel class="processo-panel" [class.panel-ativo]="isStatusAtivo(processo)" [class.panel-arquivado]="!isStatusAtivo(processo)">

                <mat-expansion-panel-header collapsedHeight="auto" expandedHeight="auto">
                  <mat-panel-title>
                    <div class="ph-layout">

                      <!-- Esquerda: CNJ + badges -->
                      <div class="ph-left">
                        <div class="ph-cnj-row">
                          <mat-icon class="ph-gavel">gavel</mat-icon>
                          <span class="ph-cnj">{{ processo.numero_cnj || 'Nº não informado' }}</span>
                        </div>
                        <div class="ph-badges">
                          @if (isStatusAtivo(processo)) {
                            <span class="badge badge-ativo">
                              <mat-icon>radio_button_checked</mat-icon>Ativo
                            </span>
                          } @else if (statusPredito(processo)) {
                            <span class="badge badge-inativo">
                              <mat-icon>archive</mat-icon>{{ statusPredito(processo) | titlecase }}
                            </span>
                          }
                          @if (grauFormatado(processo)) {
                            <span class="badge badge-grau">{{ grauFormatado(processo) }}</span>
                          }
                          @if (isSegredoJustica(processo)) {
                            <span class="badge badge-segredo">
                              <mat-icon>lock</mat-icon>Segredo de Justiça
                            </span>
                          }
                          @if (processo.fontes_tribunais_estao_arquivadas) {
                            <span class="badge badge-arq-fonte">Fonte arquivada</span>
                          }
                        </div>
                      </div>

                      <!-- Direita: estado + tribunal + data -->
                      <div class="ph-right">
                        @if (processo.estado_origem?.sigla) {
                          <span class="ph-tag estado-tag">{{ processo.estado_origem.sigla }}</span>
                        }
                        @if (tribunalSigla(processo)) {
                          <span class="ph-tag tribunal-tag" [matTooltip]="tribunalNome(processo)">{{ tribunalSigla(processo) }}</span>
                        }
                        @if (processo.data_inicio) {
                          <span class="ph-tag date-tag">
                            <mat-icon>event</mat-icon>{{ formatDate(processo.data_inicio) }}
                          </span>
                        }
                        @if (processo.quantidade_movimentacoes) {
                          <span class="ph-tag mov-tag" matTooltip="Movimentações">
                            <mat-icon>sync_alt</mat-icon>{{ processo.quantidade_movimentacoes }}
                          </span>
                        }
                      </div>

                    </div>
                  </mat-panel-title>
                </mat-expansion-panel-header>

                <!-- ── Conteúdo expandido ── -->
                <div class="panel-body">

                  <!-- Polo ativo → Polo passivo -->
                  <div class="polo-row">
                    <div class="polo polo-ativo">
                      <span class="polo-label"><mat-icon>arrow_upward</mat-icon>Polo Ativo</span>
                      <span class="polo-val">{{ processo.titulo_polo_ativo || '—' }}</span>
                    </div>
                    <div class="polo-vs">
                      <mat-icon>compare_arrows</mat-icon>
                    </div>
                    <div class="polo polo-passivo">
                      <span class="polo-label"><mat-icon>arrow_downward</mat-icon>Polo Passivo</span>
                      <span class="polo-val">{{ processo.titulo_polo_passivo || '—' }}</span>
                    </div>
                  </div>

                  <mat-divider></mat-divider>

                  <!-- Informações do processo -->
                  <div class="section-block">
                    <div class="section-label">
                      <mat-icon>description</mat-icon>
                      Dados do Processo
                    </div>
                    <div class="info-grid">

                      @if (tribunalNome(processo)) {
                        <div class="info-field">
                          <span class="ifl">Tribunal</span>
                          <span class="ifv">{{ tribunalNome(processo) }}</span>
                        </div>
                      }

                      @if (areaProcesso(processo)) {
                        <div class="info-field">
                          <span class="ifl">Área</span>
                          <span class="ifv">{{ areaProcesso(processo) }}</span>
                        </div>
                      }

                      @if (classeProcessual(processo)) {
                        <div class="info-field full">
                          <span class="ifl">Classe Processual</span>
                          <span class="ifv">{{ classeProcessual(processo) }}</span>
                        </div>
                      }

                      @if (assuntoPrincipal(processo)) {
                        <div class="info-field full">
                          <span class="ifl">Assunto Principal</span>
                          <span class="ifv">{{ assuntoPrincipal(processo) }}</span>
                        </div>
                      }

                      @if (orgaoJulgador(processo)) {
                        <div class="info-field full">
                          <span class="ifl">Órgão Julgador</span>
                          <span class="ifv">{{ orgaoJulgador(processo) }}</span>
                        </div>
                      }

                      @if (valorCausaNum(processo) > 0) {
                        <div class="info-field">
                          <span class="ifl">Valor da Causa</span>
                          <span class="ifv valor-destaque">{{ valorCausa(processo) }}</span>
                        </div>
                      }

                      @if (dataDistribuicao(processo)) {
                        <div class="info-field">
                          <span class="ifl">Data de Distribuição</span>
                          <span class="ifv">{{ formatDate(dataDistribuicao(processo)) }}</span>
                        </div>
                      }

                      @if (processo.data_ultima_movimentacao) {
                        <div class="info-field">
                          <span class="ifl">Última Movimentação</span>
                          <span class="ifv">{{ formatDate(processo.data_ultima_movimentacao) }}</span>
                        </div>
                      }

                      @if (processo.quantidade_movimentacoes) {
                        <div class="info-field">
                          <span class="ifl">Nº de Movimentações</span>
                          <span class="ifv">{{ processo.quantidade_movimentacoes }}</span>
                        </div>
                      }

                      @if (processo.tempo_desde_ultima_verificacao) {
                        <div class="info-field">
                          <span class="ifl">Verificado</span>
                          <span class="ifv muted">{{ processo.tempo_desde_ultima_verificacao }}</span>
                        </div>
                      }

                    </div>
                  </div>

                  <!-- Informações complementares -->
                  @if (infosComplementares(processo).length > 0) {
                    <mat-divider></mat-divider>
                    <div class="section-block">
                      <div class="section-label">
                        <mat-icon>info_outline</mat-icon>
                        Informações Complementares
                      </div>
                      <div class="infos-chips">
                        @for (info of infosComplementares(processo); track $index) {
                          <div class="info-chip">
                            <span class="ic-label">{{ info.tipo }}</span>
                            <span class="ic-val">{{ info.valor }}</span>
                          </div>
                        }
                      </div>
                    </div>
                  }

                  <!-- Audiências -->
                  @if (audiencias(processo).length > 0) {
                    <mat-divider></mat-divider>
                    <div class="section-block">
                      <div class="section-label">
                        <mat-icon>event_note</mat-icon>
                        Audiências ({{ audiencias(processo).length }})
                      </div>
                      <div class="audiencias-list">
                        @for (aud of audiencias(processo); track $index) {
                          <div class="audiencia-item">
                            <div class="aud-icon-wrap">
                              <mat-icon>calendar_today</mat-icon>
                            </div>
                            <div class="aud-info">
                              <span class="aud-tipo">{{ aud.tipo }}</span>
                              <span class="aud-data">{{ formatDate(aud.data) }}</span>
                            </div>
                            @if (aud.situacao) {
                              <span class="aud-situacao">{{ aud.situacao }}</span>
                            }
                          </div>
                        }
                      </div>
                    </div>
                  }

                  <!-- Envolvidos -->
                  @if (envolvidos(processo).length > 0) {
                    <mat-divider></mat-divider>
                    <div class="section-block">
                      <div class="section-label">
                        <mat-icon>people_outline</mat-icon>
                        Envolvidos ({{ envolvidos(processo).length }})
                      </div>
                      <div class="envolvidos-grid">
                        @for (env of envolvidos(processo); track $index) {
                          <div class="envolvido-card"
                            [class.ec-ativo]="env.polo === 'ATIVO'"
                            [class.ec-passivo]="env.polo === 'PASSIVO'"
                            [class.ec-juiz]="isJuiz(env.tipo_normalizado || env.tipo)"
                            [class.ec-adv]="isAdvogado(env.tipo_normalizado || env.tipo)">
                            <div class="ec-header">
                              <div class="ec-icon">
                                <mat-icon>{{ isJuiz(env.tipo_normalizado || env.tipo) ? 'gavel' : isAdvogado(env.tipo_normalizado || env.tipo) ? 'balance' : (env.tipo_pessoa === 'JURIDICA' ? 'business' : 'person') }}</mat-icon>
                              </div>
                              <div class="ec-info">
                                <span class="ec-nome">{{ env.nome }}</span>
                                <div class="ec-tags">
                                  <span class="ec-tipo">{{ env.tipo_normalizado || env.tipo }}</span>
                                  @if (env.polo && env.polo !== 'DESCONHECIDO') {
                                    <span class="ec-polo" [class.polo-a]="env.polo === 'ATIVO'" [class.polo-p]="env.polo === 'PASSIVO'">
                                      {{ env.polo }}
                                    </span>
                                  }
                                  @if (env.cpf) {
                                    <span class="ec-doc">CPF: {{ maskCpf(env.cpf) }}</span>
                                  }
                                  @if (env.cnpj) {
                                    <span class="ec-doc">CNPJ: {{ maskCnpj(env.cnpj) }}</span>
                                  }
                                </div>
                              </div>
                            </div>
                            @if (env.advogados && env.advogados.length > 0) {
                              <div class="ec-advogados">
                                <span class="adv-title">
                                  <mat-icon>balance</mat-icon>
                                  {{ env.advogados.length === 1 ? 'Advogado' : 'Advogados' }}
                                </span>
                                @for (adv of env.advogados; track $index) {
                                  <div class="adv-item">
                                    <span class="adv-nome">{{ adv.nome }}</span>
                                    @if (adv.oabs && adv.oabs.length > 0) {
                                      <span class="adv-oab">OAB/{{ adv.oabs[0].uf }} {{ adv.oabs[0].numero }}</span>
                                    }
                                  </div>
                                }
                              </div>
                            }
                          </div>
                        }
                      </div>
                    </div>
                  }

                  <!-- Rodapé do painel -->
                  @if (processoUrl(processo)) {
                    <mat-divider></mat-divider>
                    <div class="panel-footer">
                      <a [href]="processoUrl(processo)" target="_blank" rel="noopener noreferrer"
                         mat-stroked-button color="primary" class="btn-tribunal">
                        <mat-icon>open_in_new</mat-icon>
                        Ver processo no tribunal
                      </a>
                    </div>
                  }

                </div>
              </mat-expansion-panel>
            }
          </mat-accordion>

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
    /* ─── Formulário ─── */
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
      padding: 0 28px;
      font-size: 15px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
      margin-top: 4px;
    }

    /* ─── Erro ─── */
    .error-card {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      background: rgba(244, 67, 54, 0.07);
      border: 1px solid rgba(244, 67, 54, 0.28);
      border-radius: 12px;
      padding: 16px 20px;
      margin-top: 20px;
    }
    .error-card > mat-icon { color: #f44336; font-size: 22px; width: 22px; height: 22px; flex-shrink: 0; margin-top: 2px; }
    .error-body { flex: 1; }
    .error-title { font-weight: 600; font-size: 14px; color: #f44336 !important; margin-bottom: 4px; }
    .error-msg { font-size: 13px; color: var(--text-sec) !important; }

    /* ─── Cartão da entidade ─── */
    .entity-card {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-top: 20px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 20px 24px;
    }

    .entity-icon-wrap {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      background: rgba(61, 90, 254, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      mat-icon { color: var(--primary-dark, #3d5afe); font-size: 28px; width: 28px; height: 28px; }
    }

    .entity-info { flex: 1; min-width: 0; }

    .entity-name {
      margin: 0 0 4px;
      font-size: 18px;
      font-weight: 700;
      color: var(--text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .entity-tipo {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: var(--text-ter);
    }

    .entity-badge-wrap { flex-shrink: 0; }
    .entity-doc-badge {
      display: inline-block;
      padding: 6px 14px;
      background: rgba(0,0,0,0.06);
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 13px;
      font-family: 'Consolas', 'Monaco', monospace;
      color: var(--text-sec);
    }

    /* ─── Painel de métricas ─── */
    .stats-row {
      display: flex;
      gap: 12px;
      margin-top: 12px;
      flex-wrap: wrap;
    }

    .stat-card {
      flex: 1;
      min-width: 140px;
      display: flex;
      align-items: center;
      gap: 14px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px 20px;
    }

    .stat-card.stat-wide { flex: 1.5; }

    .stat-icon-wrap {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      mat-icon { font-size: 20px; width: 20px; height: 20px; }

      &.primary { background: rgba(61,90,254,0.1); mat-icon { color: var(--primary-dark, #3d5afe); } }
      &.success { background: rgba(67,160,71,0.1); mat-icon { color: #43a047; } }
      &.warn    { background: rgba(251,140,0,0.1);  mat-icon { color: #fb8c00; } }
      &.muted   { background: rgba(0,0,0,0.06);     mat-icon { color: var(--text-ter); } }
    }

    .stat-body { display: flex; flex-direction: column; gap: 2px; }

    .stat-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.7px;
      color: var(--text-ter);
    }

    .stat-value {
      font-size: 20px;
      font-weight: 800;
      line-height: 1;
      &.primary { color: var(--primary-dark, #3d5afe); }
      &.success { color: #43a047; }
      &.warn    { color: #fb8c00; }
      &.muted   { color: var(--text-sec); }
    }

    /* ─── Cabeçalho da lista ─── */
    .list-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 24px;
      margin-bottom: 8px;
    }

    .list-header-left {
      display: flex;
      align-items: center;
      gap: 8px;
      mat-icon { color: var(--text-ter); font-size: 20px; width: 20px; height: 20px; }
    }

    .list-title {
      font-size: 15px;
      font-weight: 700;
      color: var(--text);
    }

    .list-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 26px;
      height: 22px;
      padding: 0 8px;
      background: var(--primary-dark, #3d5afe);
      color: #fff;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
    }

    .list-total {
      font-size: 12px;
      color: var(--text-ter);
    }

    /* ─── Acordeão ─── */
    .processos-accordion {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    ::ng-deep .processos-accordion .mat-expansion-panel {
      border-radius: 12px !important;
      border: 1px solid var(--border) !important;
      box-shadow: none !important;
      background: var(--surface);
      overflow: hidden;
    }

    ::ng-deep .processos-accordion .mat-expansion-panel.panel-ativo {
      border-left: 3px solid #43a047 !important;
    }

    ::ng-deep .processos-accordion .mat-expansion-panel.panel-arquivado {
      border-left: 3px solid var(--border) !important;
    }

    ::ng-deep .processos-accordion .mat-expansion-panel-header {
      padding: 14px 18px 14px 16px;
      height: auto !important;
      min-height: 56px;
    }

    ::ng-deep .processos-accordion mat-panel-title {
      flex: 1;
      min-width: 0;
      margin-right: 0 !important;
    }

    ::ng-deep .processos-accordion .mat-expansion-panel-header:hover {
      background: rgba(0,0,0,0.03) !important;
    }

    /* ─── Layout do cabeçalho do painel ─── */
    .ph-layout {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      width: 100%;
      flex-wrap: wrap;
      padding: 2px 0;
    }

    .ph-left { display: flex; flex-direction: column; gap: 6px; }

    .ph-cnj-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .ph-gavel {
      color: var(--primary-dark, #3d5afe);
      font-size: 18px;
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    .ph-cnj {
      font-size: 14px;
      font-weight: 700;
      font-family: 'Consolas', 'Monaco', monospace;
      color: var(--text);
      letter-spacing: 0.3px;
    }

    .ph-badges {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .ph-right {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
      flex-shrink: 0;
    }

    /* ─── Badges ─── */
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      padding: 3px 8px;
      border-radius: 16px;
      font-size: 11px;
      font-weight: 600;
      mat-icon { font-size: 12px; width: 12px; height: 12px; }
    }

    .badge-ativo    { background: rgba(67,160,71,0.12);  color: #2e7d32; }
    .badge-inativo  { background: rgba(0,0,0,0.07);       color: var(--text-sec); }
    .badge-grau     { background: rgba(61,90,254,0.08);   color: var(--primary-dark, #3d5afe); border: 1px solid rgba(61,90,254,0.2); }
    .badge-segredo  { background: rgba(255,152,0,0.12);   color: #e65100; }
    .badge-arq-fonte{ background: rgba(239,83,80,0.1);    color: #c62828; font-size: 10px; }

    /* ─── Tags do lado direito do header ─── */
    .ph-tag {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      padding: 4px 9px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      border: 1px solid var(--border);
      mat-icon { font-size: 13px; width: 13px; height: 13px; }
    }

    .estado-tag   { background: rgba(0,0,0,0.05); color: var(--text-sec); }
    .tribunal-tag { background: rgba(61,90,254,0.07); color: var(--primary-dark, #3d5afe); border-color: rgba(61,90,254,0.2); }
    .date-tag     { background: rgba(0,0,0,0.04); color: var(--text-sec); }
    .mov-tag      { background: rgba(0,0,0,0.04); color: var(--text-ter); }

    /* ─── Corpo do painel ─── */
    .panel-body {
      display: flex;
      flex-direction: column;
      padding: 0 4px 8px;
    }

    /* ─── Polo ativo / passivo ─── */
    .polo-row {
      display: flex;
      align-items: stretch;
      gap: 0;
      padding: 16px 16px 12px;
    }

    .polo {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 5px;
      padding: 12px 16px;
      border-radius: 10px;
    }

    .polo-ativo  { background: rgba(67,160,71,0.07);    border: 1px solid rgba(67,160,71,0.2); }
    .polo-passivo{ background: rgba(239,83,80,0.07);    border: 1px solid rgba(239,83,80,0.2); }

    .polo-label {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: var(--text-ter);
      mat-icon { font-size: 12px; width: 12px; height: 12px; }
    }

    .polo-ativo  .polo-label mat-icon { color: #43a047; }
    .polo-passivo .polo-label mat-icon { color: #ef5350; }

    .polo-val {
      font-size: 13px;
      font-weight: 600;
      color: var(--text);
      line-height: 1.4;
    }

    .polo-vs {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      flex-shrink: 0;
      mat-icon { color: var(--body-label); font-size: 22px; width: 22px; height: 22px; }
    }

    mat-divider { margin: 0 16px; opacity: 0.6; }

    /* ─── Seção de bloco ─── */
    .section-block {
      padding: 14px 16px;
    }

    .section-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: var(--text-ter);
      margin-bottom: 12px;
      mat-icon { font-size: 15px; width: 15px; height: 15px; }
    }

    /* ─── Grid de informações ─── */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 28px;
    }

    .info-field {
      display: flex;
      flex-direction: column;
      gap: 3px;
      &.full { grid-column: 1 / -1; }
    }

    .ifl {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: var(--text-ter);
    }

    .ifv {
      font-size: 13px;
      font-weight: 500;
      color: var(--text);
      line-height: 1.4;
      &.muted { color: var(--text-sec); font-style: italic; }
    }

    .valor-destaque {
      font-size: 14px;
      font-weight: 700;
      color: var(--primary-dark, #3d5afe);
    }

    /* ─── Informações complementares ─── */
    .infos-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .info-chip {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 8px 12px;
      background: rgba(0,0,0,0.04);
      border: 1px solid var(--border);
      border-radius: 8px;
      min-width: 120px;
    }

    .ic-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: var(--text-ter);
    }

    .ic-val {
      font-size: 13px;
      font-weight: 600;
      color: var(--text);
    }

    /* ─── Audiências ─── */
    .audiencias-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .audiencia-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      background: rgba(251,140,0,0.06);
      border: 1px solid rgba(251,140,0,0.2);
      border-radius: 8px;
    }

    .aud-icon-wrap {
      width: 32px;
      height: 32px;
      background: rgba(251,140,0,0.12);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      mat-icon { color: #fb8c00; font-size: 16px; width: 16px; height: 16px; }
    }

    .aud-info {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
    }

    .aud-tipo {
      font-size: 13px;
      font-weight: 600;
      color: var(--text);
    }

    .aud-data {
      font-size: 13px;
      color: var(--text-sec);
    }

    .aud-situacao {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 6px;
      background: rgba(0,0,0,0.06);
      color: var(--text-sec);
    }

    /* ─── Envolvidos ─── */
    .envolvidos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 10px;
    }

    .envolvido-card {
      border-radius: 10px;
      border: 1px solid var(--border);
      overflow: hidden;
      background: var(--surface);

      &.ec-ativo    { border-color: rgba(67,160,71,0.3); }
      &.ec-passivo  { border-color: rgba(239,83,80,0.3); }
      &.ec-juiz     { border-color: rgba(103,58,183,0.3); }
    }

    .ec-header {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px 14px;
    }

    .ec-icon {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }

      .ec-ativo    & { background: rgba(67,160,71,0.1);     mat-icon { color: #43a047; } }
      .ec-passivo  & { background: rgba(239,83,80,0.1);     mat-icon { color: #ef5350; } }
      .ec-juiz     & { background: rgba(103,58,183,0.1);    mat-icon { color: #673ab7; } }
      .envolvido-card:not(.ec-ativo):not(.ec-passivo):not(.ec-juiz) & { background: rgba(0,0,0,0.06); mat-icon { color: var(--text-sec); } }
    }

    .ec-info { display: flex; flex-direction: column; gap: 5px; min-width: 0; }

    .ec-nome {
      font-size: 13px;
      font-weight: 700;
      color: var(--text);
      line-height: 1.3;
    }

    .ec-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .ec-tipo {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 2px 7px;
      border-radius: 5px;
      background: rgba(0,0,0,0.06);
      color: var(--text-sec);
    }

    .ec-polo {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 5px;
      &.polo-a { background: rgba(67,160,71,0.1);  color: #2e7d32; }
      &.polo-p { background: rgba(239,83,80,0.1);  color: #c62828; }
    }

    .ec-doc {
      font-size: 10px;
      padding: 2px 7px;
      border-radius: 5px;
      background: rgba(0,0,0,0.04);
      color: var(--text-ter);
      font-family: 'Consolas', 'Monaco', monospace;
    }

    /* Advogados dentro do envolvido */
    .ec-advogados {
      border-top: 1px solid var(--border);
      padding: 8px 14px;
      display: flex;
      flex-direction: column;
      gap: 5px;
      background: rgba(0,0,0,0.02);
    }

    .adv-title {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-ter);
      margin-bottom: 2px;
      mat-icon { font-size: 12px; width: 12px; height: 12px; }
    }

    .adv-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .adv-nome {
      font-size: 12px;
      font-weight: 500;
      color: var(--text);
      flex: 1;
    }

    .adv-oab {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 7px;
      border-radius: 5px;
      background: rgba(61,90,254,0.08);
      color: var(--primary-dark, #3d5afe);
      white-space: nowrap;
    }

    /* ─── Rodapé do painel ─── */
    .panel-footer {
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .btn-tribunal {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }

    /* ─── Empty state ─── */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 56px 24px;
      color: var(--text-sec);
      margin-top: 20px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;

      mat-icon { font-size: 48px; width: 48px; height: 48px; color: var(--body-label); }
      p { font-size: 15px; margin: 0; }
    }

    /* ─── Responsividade ─── */
    @media (max-width: 768px) {
      .fields-row { flex-direction: column; }
      .field-doc { flex: 1 1 100%; }
      .btn-consultar { width: 100%; justify-content: center; margin-top: 0; }

      .entity-card { flex-wrap: wrap; }
      .entity-badge-wrap { width: 100%; }
      .stats-row { gap: 8px; }
      .stat-card { min-width: calc(50% - 4px); }

      .polo-row { flex-direction: column; }
      .polo-vs { width: 100%; height: 28px; transform: rotate(90deg); }
      .info-grid { grid-template-columns: 1fr; }
      .envolvidos-grid { grid-template-columns: 1fr; }
      .ph-layout { flex-direction: column; align-items: flex-start; gap: 6px; }
      .ph-right { width: 100%; }
    }
  `]
})
export class EscavadorProcessosComponent {
  private service = inject(EscavadorProcessosService);

  loading           = signal(false);
  error             = signal<string | null>(null);
  result            = signal<any>(null);
  processos         = signal<any[]>([]);
  documentoFormatado = signal('');

  // ── Estatísticas calculadas ──
  qtdAtivos = computed(() =>
    this.processos().filter(p => this.fonte(p)?.status_predito === 'ATIVO').length
  );
  qtdArquivados = computed(() =>
    this.processos().filter(p => this.fonte(p)?.status_predito !== 'ATIVO').length
  );
  qtdComAudiencia = computed(() =>
    this.processos().filter(p => (this.fonte(p)?.audiencias?.length ?? 0) > 0).length
  );
  totalValorCausas = computed(() => {
    const total = this.processos().reduce((sum, p) => {
      const v = parseFloat(this.capa(p)?.valor_causa?.valor ?? '0');
      return sum + (isNaN(v) ? 0 : v);
    }, 0);
    return total > 0 ? total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : null;
  });

  // ── Formulário ──
  form = new FormGroup({
    documento: new FormControl('', [Validators.required, Validators.minLength(11)]),
  });

  // ── Extratores de dados nested ──
  fonte(p: any)  { return p?.fontes?.[0]; }
  capa(p: any)   { return p?.fontes?.[0]?.capa; }

  statusPredito(p: any): string  { return this.fonte(p)?.status_predito ?? ''; }
  grauFormatado(p: any): string  { return this.fonte(p)?.grau_formatado ?? ''; }
  tribunalNome(p: any): string   { return this.fonte(p)?.nome ?? ''; }
  tribunalSigla(p: any): string  { return this.fonte(p)?.sigla ?? ''; }
  isSegredoJustica(p: any)       { return this.fonte(p)?.segredo_justica === true; }
  processoUrl(p: any): string    { return this.fonte(p)?.url ?? ''; }
  classeProcessual(p: any)       { return this.capa(p)?.classe ?? ''; }
  assuntoPrincipal(p: any)       {
    return this.capa(p)?.assunto_principal_normalizado?.nome_com_pai
      || this.capa(p)?.assunto_principal_normalizado?.nome
      || this.capa(p)?.assunto
      || '';
  }
  areaProcesso(p: any)           { return this.capa(p)?.area ?? ''; }
  orgaoJulgador(p: any)          { return this.capa(p)?.orgao_julgador ?? ''; }
  valorCausa(p: any): string     { return this.capa(p)?.valor_causa?.valor_formatado ?? ''; }
  valorCausaNum(p: any): number  { return parseFloat(this.capa(p)?.valor_causa?.valor ?? '0') || 0; }
  dataDistribuicao(p: any)       { return this.capa(p)?.data_distribuicao ?? ''; }
  infosComplementares(p: any)    { return this.capa(p)?.informacoes_complementares ?? []; }
  audiencias(p: any)             { return this.fonte(p)?.audiencias ?? []; }
  envolvidos(p: any)             { return this.fonte(p)?.envolvidos ?? []; }
  isStatusAtivo(p: any)          { return this.statusPredito(p) === 'ATIVO'; }
  isAdvogado(tipo: string)       { return (tipo ?? '').toLowerCase().includes('advogad'); }
  isJuiz(tipo: string)           { return (tipo ?? '').toLowerCase().includes('juiz') || (tipo ?? '').toLowerCase().includes('juíza'); }

  maskCpf(cpf: string): string {
    if (!cpf || cpf.length < 11) return cpf;
    return `${cpf.slice(0,3)}.***.***-${cpf.slice(9)}`;
  }

  maskCnpj(cnpj: string): string {
    if (!cnpj || cnpj.length < 14) return cnpj;
    return `${cnpj.slice(0,2)}.***.***/****-${cnpj.slice(12)}`;
  }

  // ── Máscara do campo documento ──
  maskDocumento(event: Event) {
    const input = event.target as HTMLInputElement;
    let v = input.value.replace(/\D/g, '');

    if (v.length <= 11) {
      if (v.length > 9)      v = `${v.slice(0,3)}.${v.slice(3,6)}.${v.slice(6,9)}-${v.slice(9,11)}`;
      else if (v.length > 6) v = `${v.slice(0,3)}.${v.slice(3,6)}.${v.slice(6)}`;
      else if (v.length > 3) v = `${v.slice(0,3)}.${v.slice(3)}`;
    } else {
      v = v.slice(0, 14);
      if (v.length > 12)     v = `${v.slice(0,2)}.${v.slice(2,5)}.${v.slice(5,8)}/${v.slice(8,12)}-${v.slice(12)}`;
      else if (v.length > 8) v = `${v.slice(0,2)}.${v.slice(2,5)}.${v.slice(5,8)}/${v.slice(8)}`;
      else if (v.length > 5) v = `${v.slice(0,2)}.${v.slice(2,5)}.${v.slice(5)}`;
      else if (v.length > 2) v = `${v.slice(0,2)}.${v.slice(2)}`;
    }

    this.form.get('documento')!.setValue(v, { emitEvent: false });
    input.value = v;
  }

  // ── Consulta ──
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
        this.result.set(data?.envolvido_encontrado ?? data);
        const lista = data?.items ?? data?.itens ?? data?.processos ?? data?.data ?? (Array.isArray(data) ? data : []);
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
    return this.result()?.quantidade_processos
      ?? this.result()?.quantidade_processos_encontrados
      ?? this.result()?.total
      ?? this.processos().length;
  }

  formatDate(date: string): string {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString('pt-BR');
    } catch {
      return date;
    }
  }
}
