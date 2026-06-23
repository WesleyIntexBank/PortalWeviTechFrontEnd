import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { ConveraKafkaService, ConveraPayload, ConveraKafkaResultado } from '../../core/services/convera-kafka.service';

@Component({
  selector: 'app-convera-envio',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatDividerModule,
    MatExpansionModule,
    MatTooltipModule,
    MatChipsModule,
  ],
  template: `
    <div class="page-wrapper">

      <!-- ── Cabeçalho ─────────────────────────────────────────────── -->
      <div class="page-header">
        <div class="header-icon-wrap">
          <mat-icon class="header-icon">send_to_mobile</mat-icon>
        </div>
        <div>
          <h1>Envio Convera</h1>
          <p class="subtitle">Monte a lista de registros e envie para processamento via Kafka → WorkerConvera</p>
        </div>
      </div>

      <div class="layout-grid">

        <!-- ── COLUNA ESQUERDA: FORMULÁRIO ───────────────────────── -->
        <mat-card class="form-card">
          <mat-card-header>
            <mat-icon mat-card-avatar class="card-avatar-icon">edit_note</mat-icon>
            <mat-card-title>Novo Registro</mat-card-title>
            <mat-card-subtitle>Preencha os campos e clique em "Adicionar à Lista"</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <form [formGroup]="form">

              <!-- Identificação (sempre visível) -->
              <div class="section-title">
                <mat-icon>badge</mat-icon>
                Identificação
              </div>
              <div class="form-row">
                <mat-form-field appearance="outline" class="field-lg">
                  <mat-label>Boleto / Referência *</mat-label>
                  <input matInput formControlName="BOLETO" placeholder="REF-001">
                  @if (form.get('BOLETO')?.hasError('required') && form.get('BOLETO')?.touched) {
                    <mat-error>Campo obrigatório</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="field-sm">
                  <mat-label>Moeda *</mat-label>
                  <input matInput formControlName="MOEDA" placeholder="USD">
                  @if (form.get('MOEDA')?.hasError('required') && form.get('MOEDA')?.touched) {
                    <mat-error>Campo obrigatório</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="field-sm">
                  <mat-label>Tipo</mat-label>
                  <input matInput formControlName="TIPO" placeholder="TED">
                </mat-form-field>

                <mat-form-field appearance="outline" class="field-sm">
                  <mat-label>Subtipo</mat-label>
                  <input matInput formControlName="SUBTIPO" placeholder="">
                </mat-form-field>
              </div>

              <!-- Acordeão com seções opcionais -->
              <mat-accordion class="form-accordion" multi>

                <!-- Beneficiário -->
                <mat-expansion-panel>
                  <mat-expansion-panel-header>
                    <mat-panel-title><mat-icon>person</mat-icon>&nbsp;Beneficiário</mat-panel-title>
                  </mat-expansion-panel-header>
                  <div class="form-row">
                    <mat-form-field appearance="outline" class="field-lg">
                      <mat-label>Nome</mat-label>
                      <input matInput formControlName="NOME">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-lg">
                      <mat-label>Nome Estrangeiro</mat-label>
                      <input matInput formControlName="NOMEE">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-lg">
                      <mat-label>IBAN / Conta (INTERNET)</mat-label>
                      <input matInput formControlName="INTERNET">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-sm">
                      <mat-label>SWIFT</mat-label>
                      <input matInput formControlName="SWIFT">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-sm">
                      <mat-label>ABA</mat-label>
                      <input matInput formControlName="ABA">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-lg">
                      <mat-label>Nome do Banco</mat-label>
                      <input matInput formControlName="BANCO_NOME">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-md">
                      <mat-label>Banco Beneficiário (BANCOBEN)</mat-label>
                      <input matInput formControlName="BANCOBEN">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-md">
                      <mat-label>Banco Intermediário (BANCOINT)</mat-label>
                      <input matInput formControlName="BANCOINT">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-md">
                      <mat-label>CHIPS</mat-label>
                      <input matInput formControlName="BANCO_CHIPS">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-sm">
                      <mat-label>País (sigla)</mat-label>
                      <input matInput formControlName="PAIS_SIGLA" placeholder="US">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-sm">
                      <mat-label>Country</mat-label>
                      <input matInput formControlName="Country" placeholder="United States">
                    </mat-form-field>
                  </div>
                </mat-expansion-panel>

                <!-- Endereço Beneficiário -->
                <mat-expansion-panel>
                  <mat-expansion-panel-header>
                    <mat-panel-title><mat-icon>location_on</mat-icon>&nbsp;Endereço Beneficiário</mat-panel-title>
                  </mat-expansion-panel-header>
                  <div class="form-row">
                    <mat-form-field appearance="outline" class="field-full">
                      <mat-label>Endereço</mat-label>
                      <input matInput formControlName="ENDERECO">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-md">
                      <mat-label>Cidade</mat-label>
                      <input matInput formControlName="CIDADE">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-sm">
                      <mat-label>Estado</mat-label>
                      <input matInput formControlName="ESTADO">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-sm">
                      <mat-label>CEP / ZIP</mat-label>
                      <input matInput formControlName="CEP">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-md">
                      <mat-label>País</mat-label>
                      <input matInput formControlName="PAIS">
                    </mat-form-field>
                  </div>
                </mat-expansion-panel>

                <!-- Pagador -->
                <mat-expansion-panel>
                  <mat-expansion-panel-header>
                    <mat-panel-title><mat-icon>account_balance_wallet</mat-icon>&nbsp;Dados do Pagador</mat-panel-title>
                  </mat-expansion-panel-header>
                  <div class="form-row">
                    <mat-form-field appearance="outline" class="field-lg">
                      <mat-label>Pagador (PAGADOR)</mat-label>
                      <input matInput formControlName="PAGADOR">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-lg">
                      <mat-label>Endereço Pagador (PAGADORE)</mat-label>
                      <input matInput formControlName="PAGADORE">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-md">
                      <mat-label>Cidade Pagador (PAGADORC)</mat-label>
                      <input matInput formControlName="PAGADORC">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-sm">
                      <mat-label>UF Pagador (PAGADORUF)</mat-label>
                      <input matInput formControlName="PAGADORUF">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-md">
                      <mat-label>País Pagador (PAGADORCD)</mat-label>
                      <input matInput formControlName="PAGADORCD">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-sm">
                      <mat-label>CEP Pagador (PAGADORCEP)</mat-label>
                      <input matInput formControlName="PAGADORCEP">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-md">
                      <mat-label>Telefone</mat-label>
                      <input matInput formControlName="TELEFONE">
                    </mat-form-field>
                  </div>
                </mat-expansion-panel>

                <!-- Valores -->
                <mat-expansion-panel>
                  <mat-expansion-panel-header>
                    <mat-panel-title><mat-icon>attach_money</mat-icon>&nbsp;Valores e Taxas</mat-panel-title>
                  </mat-expansion-panel-header>
                  <div class="form-row">
                    <mat-form-field appearance="outline" class="field-md">
                      <mat-label>Valor ME</mat-label>
                      <input matInput type="number" formControlName="VALORME" placeholder="0.00">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-md">
                      <mat-label>Valor MN (R$)</mat-label>
                      <input matInput type="number" formControlName="VALORMN" placeholder="0.00">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-sm">
                      <mat-label>Taxa NV</mat-label>
                      <input matInput type="number" formControlName="TAXANV" placeholder="0.0000">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-sm">
                      <mat-label>Taxa OP</mat-label>
                      <input matInput type="number" formControlName="TAXAOP" placeholder="0.0000">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-sm">
                      <mat-label>IOF</mat-label>
                      <input matInput type="number" formControlName="IOF" placeholder="0.00">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-sm">
                      <mat-label>IOF Taxa</mat-label>
                      <input matInput type="number" formControlName="IOFTAXA" placeholder="0.0000">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-sm">
                      <mat-label>Yield</mat-label>
                      <input matInput type="number" formControlName="YIELD" placeholder="0.0000">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-sm">
                      <mat-label>Valor R</mat-label>
                      <input matInput type="number" formControlName="VALORR">
                    </mat-form-field>
                  </div>
                </mat-expansion-panel>

                <!-- Datas e Outros -->
                <mat-expansion-panel>
                  <mat-expansion-panel-header>
                    <mat-panel-title><mat-icon>calendar_today</mat-icon>&nbsp;Datas e Outros</mat-panel-title>
                  </mat-expansion-panel-header>
                  <div class="form-row">
                    <mat-form-field appearance="outline" class="field-md">
                      <mat-label>Data ME</mat-label>
                      <input matInput type="date" formControlName="DataME">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-md">
                      <mat-label>Dt Início</mat-label>
                      <input matInput type="date" formControlName="DtInicio">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-md">
                      <mat-label>Data N</mat-label>
                      <input matInput type="date" formControlName="DATAN">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-md">
                      <mat-label>DATAME</mat-label>
                      <input matInput type="date" formControlName="DATAME">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-md">
                      <mat-label>DATAFX</mat-label>
                      <input matInput formControlName="DATAFX" placeholder="YYYY-MM-DD">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-sm">
                      <mat-label>Código</mat-label>
                      <input matInput formControlName="CODIGO">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-lg">
                      <mat-label>Nome SRF</mat-label>
                      <input matInput formControlName="NOMESRF">
                    </mat-form-field>
                  </div>
                </mat-expansion-panel>

              </mat-accordion>

            </form>
          </mat-card-content>

          <mat-card-actions align="end">
            <button mat-stroked-button (click)="limpar()" class="btn-limpar">
              <mat-icon>clear</mat-icon>
              Limpar
            </button>
            <button mat-flat-button color="primary" (click)="adicionar()">
              <mat-icon>playlist_add</mat-icon>
              Adicionar à Lista
            </button>
          </mat-card-actions>
        </mat-card>

        <!-- ── COLUNA DIREITA: LISTA E ENVIO ─────────────────────── -->
        <div class="list-column">

          <!-- Cabeçalho da lista -->
          <mat-card class="list-card">
            <mat-card-header>
              <mat-icon mat-card-avatar class="card-avatar-icon">list_alt</mat-icon>
              <mat-card-title>
                Lista de Registros
                @if (lista().length > 0) {
                  <span class="badge">{{ lista().length }}</span>
                }
              </mat-card-title>
              <mat-card-subtitle>Registros prontos para envio ao Kafka</mat-card-subtitle>
            </mat-card-header>

            <mat-card-content>

              @if (lista().length === 0) {
                <div class="empty-state">
                  <mat-icon>inbox</mat-icon>
                  <p>Nenhum registro adicionado ainda.</p>
                </div>
              }

              @if (lista().length > 0) {
                <div class="list-table-wrap">
                  <table class="list-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Boleto</th>
                        <th>Nome</th>
                        <th>Moeda</th>
                        <th>Valor ME</th>
                        <th>SWIFT</th>
                        <th>ABA</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (item of lista(); track $index) {
                        <tr [class.row-success]="isSuccess($index)" [class.row-error]="isError($index)">
                          <td class="td-index">{{ $index + 1 }}</td>
                          <td class="td-boleto">{{ item.BOLETO }}</td>
                          <td class="td-nome">{{ item.NOME || item.NOMEE || '—' }}</td>
                          <td class="td-moeda">
                            <span class="chip-moeda">{{ item.MOEDA }}</span>
                          </td>
                          <td class="td-valor">{{ item.VALORME | number:'1.2-2' }}</td>
                          <td class="td-code">{{ item.SWIFT || '—' }}</td>
                          <td class="td-code">{{ item.ABA || '—' }}</td>
                          <td class="td-actions">
                            @if (resultadosMap()[$index]) {
                              <mat-icon class="status-icon" [class.icon-ok]="resultadosMap()[$index].sucesso" [class.icon-err]="!resultadosMap()[$index].sucesso"
                                [matTooltip]="resultadosMap()[$index].sucesso ? 'Enviado: offset ' + resultadosMap()[$index].offset : resultadosMap()[$index].erro ?? ''">
                                {{ resultadosMap()[$index].sucesso ? 'check_circle' : 'error' }}
                              </mat-icon>
                            } @else {
                              <button mat-icon-button color="warn" (click)="remover($index)" matTooltip="Remover" [disabled]="enviando()">
                                <mat-icon>delete</mat-icon>
                              </button>
                            }
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }

            </mat-card-content>

            @if (lista().length > 0) {
              <mat-card-actions align="end">
                <button mat-stroked-button color="warn" (click)="limparLista()" [disabled]="enviando()">
                  <mat-icon>delete_sweep</mat-icon>
                  Limpar Lista
                </button>
                <button mat-flat-button color="accent" (click)="enviar()" [disabled]="enviando() || lista().length === 0">
                  @if (enviando()) {
                    <mat-spinner diameter="20"></mat-spinner>
                    &nbsp;Enviando...
                  } @else {
                    <mat-icon>rocket_launch</mat-icon>
                    Enviar {{ lista().length }} registro{{ lista().length > 1 ? 's' : '' }} ao Kafka
                  }
                </button>
              </mat-card-actions>
            }
          </mat-card>

          <!-- Resultado do envio -->
          @if (resultados().length > 0) {
            <mat-card class="result-card">
              <mat-card-header>
                <mat-icon mat-card-avatar [class.icon-ok]="totalSucesso() === resultados().length" [class.icon-err]="totalSucesso() < resultados().length" class="card-avatar-icon">
                  {{ totalSucesso() === resultados().length ? 'check_circle' : 'warning' }}
                </mat-icon>
                <mat-card-title>Resultado do Envio</mat-card-title>
                <mat-card-subtitle>
                  {{ totalSucesso() }} de {{ resultados().length }} registros enviados com sucesso
                </mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="result-list">
                  @for (r of resultados(); track $index) {
                    <div class="result-item" [class.result-ok]="r.sucesso" [class.result-err]="!r.sucesso">
                      <mat-icon>{{ r.sucesso ? 'check_circle' : 'cancel' }}</mat-icon>
                      <div class="result-info">
                        <strong>{{ r.boleto }}</strong>
                        @if (r.sucesso) {
                          <span class="result-detail">topic={{ r.topic }} | partition={{ r.partition }} | offset={{ r.offset }}</span>
                        } @else {
                          <span class="result-detail result-err-msg">{{ r.erro }}</span>
                        }
                      </div>
                    </div>
                  }
                </div>
              </mat-card-content>
            </mat-card>
          }

        </div>

      </div>
    </div>
  `,
  styles: [`
    /* ── Wrapper ────────────────────────────────────────────────── */
    .page-wrapper {
      padding: 24px;
      max-width: 1600px;
      margin: 0 auto;
    }

    /* ── Header ─────────────────────────────────────────────────── */
    .page-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 28px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border);
    }

    .header-icon-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: rgba(112, 199, 60, 0.12);
      flex-shrink: 0;
    }

    .header-icon {
      font-size: 26px;
      width: 26px;
      height: 26px;
      color: var(--accent, #70c73c);
    }

    h1 {
      font-size: 20px;
      font-weight: 700;
      margin: 0 0 3px;
      color: var(--text);
      letter-spacing: -0.3px;
    }

    .subtitle {
      margin: 0;
      font-size: 12px;
      color: var(--text-ter);
      line-height: 1.5;
    }

    /* ── Layout grid ─────────────────────────────────────────────── */
    .layout-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      align-items: start;
    }

    @media (max-width: 1100px) {
      .layout-grid { grid-template-columns: 1fr; }
    }

    /* ── Cards ───────────────────────────────────────────────────── */
    .form-card, .list-card, .result-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      box-shadow: var(--card-shadow);
      overflow: hidden;
    }

    /* ── Material form fields (padrão ds160) ───────────────────── */
    ::ng-deep .mat-mdc-form-field {
      .mat-mdc-text-field-wrapper {
        background: var(--input-bg) !important;
      }

      .mdc-text-field--outlined:not(.mdc-text-field--disabled) .mdc-notched-outline__leading,
      .mdc-text-field--outlined:not(.mdc-text-field--disabled) .mdc-notched-outline__notch,
      .mdc-text-field--outlined:not(.mdc-text-field--disabled) .mdc-notched-outline__trailing {
        border-color: var(--border) !important;
      }

      .mdc-text-field--outlined:not(.mdc-text-field--disabled):hover .mdc-notched-outline__leading,
      .mdc-text-field--outlined:not(.mdc-text-field--disabled):hover .mdc-notched-outline__notch,
      .mdc-text-field--outlined:not(.mdc-text-field--disabled):hover .mdc-notched-outline__trailing {
        border-color: var(--primary) !important;
      }

      .mdc-text-field--focused .mdc-notched-outline__leading,
      .mdc-text-field--focused .mdc-notched-outline__notch,
      .mdc-text-field--focused .mdc-notched-outline__trailing {
        border-color: var(--accent) !important;
      }

      .mdc-floating-label,
      .mat-mdc-floating-label {
        color: var(--text) !important;
      }

      .mdc-text-field--focused .mdc-floating-label,
      .mdc-text-field--focused .mat-mdc-floating-label {
        color: var(--accent) !important;
      }

      .mdc-text-field__input, input, textarea {
        color: var(--text) !important;
        caret-color: var(--accent) !important;
      }
    }

    ::ng-deep input[type="date"]::-webkit-calendar-picker-indicator {
      filter: var(--calendar-icon-filter, invert(0.6));
      cursor: pointer;
    }

    /* ── Expansion panel: herda surface ─────────────────────────── */
    ::ng-deep mat-expansion-panel {
      background: var(--surface) !important;
    }

    ::ng-deep .mat-expansion-panel-header-title,
    ::ng-deep .mat-expansion-indicator::after {
      color: var(--text-sec) !important;
    }

    .result-card { margin-top: 16px; }

    .card-avatar-icon {
      color: var(--accent, #70c73c);
      font-size: 26px;
      width: 26px;
      height: 26px;
    }

    /* ── Section label ───────────────────────────────────────────── */
    .section-title {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 11px;
      font-weight: 700;
      color: var(--text-ter);
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin: 20px 0 10px;
    }

    .section-title mat-icon { font-size: 15px; width: 15px; height: 15px; }

    /* ── Form rows ───────────────────────────────────────────────── */
    .form-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      padding: 6px 0;
    }

    .field-sm   { flex: 0 0 100px; }
    .field-md   { flex: 1 1 160px; }
    .field-lg   { flex: 1 1 200px; }
    .field-full { flex: 1 1 100%; }

    /* ── Accordion ───────────────────────────────────────────────── */
    .form-accordion { margin-top: 10px; }

    .form-accordion mat-expansion-panel {
      background: transparent !important;
      border: 1px solid var(--border) !important;
      border-radius: 10px !important;
      margin-bottom: 6px !important;
      box-shadow: none !important;
    }

    .form-accordion mat-expansion-panel-header {
      border-radius: 10px !important;
    }

    /* ── Badge ───────────────────────────────────────────────────── */
    .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--accent, #70c73c);
      color: #0d0d0d;
      border-radius: 10px;
      min-width: 20px;
      height: 20px;
      padding: 0 6px;
      font-size: 11px;
      font-weight: 800;
      margin-left: 10px;
      vertical-align: middle;
    }

    /* ── List table ──────────────────────────────────────────────── */
    .list-table-wrap {
      overflow-x: auto;
      margin-top: 6px;
      border-radius: 8px;
      border: 1px solid var(--border);
    }

    .list-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    .list-table th {
      text-align: left;
      padding: 9px 12px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: var(--text-ter);
      background: var(--sidebar, #151520);
      border-bottom: 1px solid var(--border);
      white-space: nowrap;
    }

    .list-table td {
      padding: 10px 12px;
      border-bottom: 1px solid var(--border);
      vertical-align: middle;
      color: var(--text-sec);
    }

    .list-table tr:last-child td { border-bottom: none; }

    .list-table tbody tr:hover td {
      background: var(--row-hover, rgba(255,255,255,.04));
      color: var(--text);
    }

    .td-index  { color: var(--text-ter); width: 32px; font-size: 11px; }
    .td-boleto { font-weight: 600; color: var(--text); font-size: 12px; }
    .td-nome   { max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .td-code   { font-family: 'Fira Mono', 'Consolas', monospace; font-size: 11px; color: var(--text-sec); }
    .td-valor  { text-align: right; font-variant-numeric: tabular-nums; font-size: 12px; }
    .td-actions { width: 44px; text-align: center; }

    /* ── Moeda chip ──────────────────────────────────────────────── */
    .chip-moeda {
      display: inline-block;
      background: rgba(112, 199, 60, 0.15);
      color: var(--accent, #70c73c);
      border: 1px solid rgba(112, 199, 60, 0.3);
      border-radius: 6px;
      padding: 1px 7px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    /* ── Row states ──────────────────────────────────────────────── */
    .row-success td { background: rgba(112, 199, 60, 0.06) !important; }
    .row-error   td { background: rgba(239, 83,  80, 0.06) !important; }

    /* ── Status icons ────────────────────────────────────────────── */
    .status-icon { vertical-align: middle; font-size: 20px; }
    .icon-ok  { color: var(--accent, #70c73c); }
    .icon-err { color: #ef5350; }

    /* ── Empty state ─────────────────────────────────────────────── */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 52px 0;
      color: var(--text-ter);
    }

    .empty-state mat-icon {
      font-size: 44px;
      width: 44px;
      height: 44px;
      opacity: 0.4;
    }

    .empty-state p {
      margin: 0;
      font-size: 13px;
      opacity: 0.7;
    }

    /* ── Buttons ─────────────────────────────────────────────────── */
    .btn-limpar { margin-right: 8px; }

    /* ── Result panel ────────────────────────────────────────────── */
    .result-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-top: 8px;
    }

    .result-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 8px;
      font-size: 13px;
      border: 1px solid transparent;
    }

    .result-ok {
      background: rgba(112, 199, 60, 0.08);
      border-color: rgba(112, 199, 60, 0.2);
    }

    .result-err {
      background: rgba(239, 83, 80, 0.08);
      border-color: rgba(239, 83, 80, 0.2);
    }

    .result-ok  mat-icon { color: var(--accent, #70c73c); font-size: 20px; }
    .result-err mat-icon { color: #ef5350; font-size: 20px; }

    .result-info { display: flex; flex-direction: column; gap: 2px; }

    .result-info strong { font-size: 13px; color: var(--text); }

    .result-detail {
      font-size: 11px;
      color: var(--text-ter);
      font-family: 'Fira Mono', 'Consolas', monospace;
    }

    .result-err-msg { color: #ef5350; font-family: inherit; }

    /* ── List column ─────────────────────────────────────────────── */
    .list-column { display: flex; flex-direction: column; }
  `],
})
export class ConveraEnvioComponent {
  private service = inject(ConveraKafkaService);

  form = new FormGroup({
    BOLETO:     new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    MOEDA:      new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    TIPO:       new FormControl('', { nonNullable: true }),
    SUBTIPO:    new FormControl('', { nonNullable: true }),
    // Beneficiário
    NOME:       new FormControl('', { nonNullable: true }),
    NOMEE:      new FormControl('', { nonNullable: true }),
    INTERNET:   new FormControl('', { nonNullable: true }),
    SWIFT:      new FormControl('', { nonNullable: true }),
    ABA:        new FormControl('', { nonNullable: true }),
    BANCO_NOME: new FormControl('', { nonNullable: true }),
    BANCOBEN:   new FormControl('', { nonNullable: true }),
    BANCOINT:   new FormControl('', { nonNullable: true }),
    BANCO_CHIPS:new FormControl('', { nonNullable: true }),
    PAIS_SIGLA: new FormControl('', { nonNullable: true }),
    Country:    new FormControl('', { nonNullable: true }),
    // Endereço beneficiário
    ENDERECO:   new FormControl('', { nonNullable: true }),
    CIDADE:     new FormControl('', { nonNullable: true }),
    ESTADO:     new FormControl('', { nonNullable: true }),
    CEP:        new FormControl('', { nonNullable: true }),
    PAIS:       new FormControl('', { nonNullable: true }),
    // Pagador
    PAGADOR:    new FormControl('', { nonNullable: true }),
    PAGADORE:   new FormControl('', { nonNullable: true }),
    PAGADORC:   new FormControl('', { nonNullable: true }),
    PAGADORUF:  new FormControl('', { nonNullable: true }),
    PAGADORCD:  new FormControl('', { nonNullable: true }),
    PAGADORCEP: new FormControl('', { nonNullable: true }),
    TELEFONE:   new FormControl('', { nonNullable: true }),
    // Valores
    VALORME:  new FormControl<number>(0, { nonNullable: true }),
    VALORMN:  new FormControl<number>(0, { nonNullable: true }),
    TAXANV:   new FormControl<number>(0, { nonNullable: true }),
    TAXAOP:   new FormControl<number>(0, { nonNullable: true }),
    IOF:      new FormControl<number>(0, { nonNullable: true }),
    IOFTAXA:  new FormControl<number>(0, { nonNullable: true }),
    YIELD:    new FormControl<number>(0, { nonNullable: true }),
    VALORR:   new FormControl<number | null>(null),
    // Datas e outros
    DataME:   new FormControl('', { nonNullable: true }),
    DtInicio: new FormControl('', { nonNullable: true }),
    DATAN:    new FormControl('', { nonNullable: true }),
    DATAME:   new FormControl('', { nonNullable: true }),
    DATAFX:   new FormControl('', { nonNullable: true }),
    CODIGO:   new FormControl('', { nonNullable: true }),
    NOMESRF:  new FormControl('', { nonNullable: true }),
  });

  lista   = signal<ConveraPayload[]>([]);
  enviando  = signal(false);
  resultados = signal<ConveraKafkaResultado[]>([]);

  resultadosMap = computed<Record<number, ConveraKafkaResultado>>(() => {
    const map: Record<number, ConveraKafkaResultado> = {};
    this.resultados().forEach((r, i) => { map[i] = r; });
    return map;
  });

  totalSucesso = computed(() => this.resultados().filter(r => r.sucesso).length);

  isSuccess(i: number): boolean { return !!this.resultadosMap()[i]?.sucesso; }
  isError(i: number):   boolean { return this.resultadosMap()[i] !== undefined && !this.resultadosMap()[i].sucesso; }

  adicionar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    const payload: ConveraPayload = {
      ...v,
      VALORME:  Number(v.VALORME),
      VALORMN:  Number(v.VALORMN),
      TAXANV:   Number(v.TAXANV),
      TAXAOP:   Number(v.TAXAOP),
      IOF:      Number(v.IOF),
      IOFTAXA:  Number(v.IOFTAXA),
      YIELD:    Number(v.YIELD),
      VALORR:   v.VALORR != null ? Number(v.VALORR) : null,
      DataME:   v.DataME  || null,
      DtInicio: v.DtInicio || null,
      DATAN:    v.DATAN   || null,
      DATAME:   v.DATAME  || null,
    };

    this.lista.update(l => [...l, payload]);
    this.resultados.set([]);
    this.form.reset({ VALORME: 0, VALORMN: 0, TAXANV: 0, TAXAOP: 0, IOF: 0, IOFTAXA: 0, YIELD: 0 });
  }

  remover(index: number): void {
    this.lista.update(l => l.filter((_, i) => i !== index));
    this.resultados.set([]);
  }

  limpar(): void {
    this.form.reset({ VALORME: 0, VALORMN: 0, TAXANV: 0, TAXAOP: 0, IOF: 0, IOFTAXA: 0, YIELD: 0 });
  }

  limparLista(): void {
    this.lista.set([]);
    this.resultados.set([]);
  }

  enviar(): void {
    if (this.lista().length === 0) return;

    this.enviando.set(true);
    this.resultados.set([]);

    this.service.enviarLote(this.lista()).subscribe({
      next: (res) => {
        this.resultados.set(res);
        this.enviando.set(false);
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Erro ao comunicar com o servidor.';
        this.resultados.set(
          this.lista().map(item => ({ boleto: item.BOLETO, sucesso: false, erro: msg }))
        );
        this.enviando.set(false);
      },
    });
  }
}
