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
        <mat-icon class="header-icon">send_to_mobile</mat-icon>
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
    .page-wrapper {
      padding: 24px;
      max-width: 1600px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      margin-bottom: 24px;
    }

    .header-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: var(--primary);
      margin-top: 2px;
    }

    h1 {
      font-size: 22px;
      font-weight: 700;
      margin: 0 0 4px;
      color: var(--text);
    }

    .subtitle {
      margin: 0;
      font-size: 13px;
      color: #888;
    }

    /* Layout em duas colunas */
    .layout-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      align-items: start;
    }

    @media (max-width: 1100px) {
      .layout-grid { grid-template-columns: 1fr; }
    }

    /* Cards */
    .form-card, .list-card, .result-card {
      border: 1px solid var(--border);
      border-radius: 12px;
    }

    .result-card { margin-top: 16px; }

    .card-avatar-icon {
      color: var(--primary);
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    /* Sections */
    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 700;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 20px 0 12px;
    }

    .section-title mat-icon { font-size: 16px; width: 16px; height: 16px; }

    /* Form rows */
    .form-row {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      padding: 8px 0;
    }

    .field-sm  { flex: 0 0 110px; }
    .field-md  { flex: 1 1 170px; }
    .field-lg  { flex: 1 1 220px; }
    .field-full { flex: 1 1 100%; }

    /* Accordion */
    .form-accordion {
      margin-top: 8px;
    }

    .form-accordion mat-expansion-panel {
      border: 1px solid var(--border);
      border-radius: 8px !important;
      margin-bottom: 6px;
      box-shadow: none !important;
    }

    /* Badge count */
    .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--primary);
      color: #fff;
      border-radius: 10px;
      min-width: 22px;
      height: 22px;
      padding: 0 6px;
      font-size: 12px;
      font-weight: 700;
      margin-left: 10px;
      vertical-align: middle;
    }

    /* List table */
    .list-table-wrap {
      overflow-x: auto;
      margin-top: 8px;
    }

    .list-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    .list-table th {
      text-align: left;
      padding: 8px 10px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: #888;
      border-bottom: 2px solid var(--border);
      white-space: nowrap;
    }

    .list-table td {
      padding: 10px 10px;
      border-bottom: 1px solid var(--border);
      vertical-align: middle;
    }

    .list-table tr:last-child td { border-bottom: none; }
    .list-table tr:hover td { background: rgba(0,0,0,.02); }

    .td-index { color: #aaa; width: 32px; }
    .td-boleto { font-weight: 600; }
    .td-nome { max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .td-code { font-family: monospace; font-size: 12px; }
    .td-valor { text-align: right; font-variant-numeric: tabular-nums; }
    .td-actions { width: 48px; text-align: center; }

    .chip-moeda {
      background: #e8f5e9;
      color: #2e7d32;
      border-radius: 6px;
      padding: 2px 8px;
      font-size: 11px;
      font-weight: 700;
    }

    .row-success td { background: rgba(46,125,50,.05); }
    .row-error td   { background: rgba(198,40,40,.05); }

    /* Status icons inline */
    .status-icon { vertical-align: middle; }
    .icon-ok { color: #2e7d32; }
    .icon-err { color: #c62828; }

    /* Empty state */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: 48px 0;
      color: #bbb;
    }

    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .empty-state p { margin: 0; font-size: 14px; }

    /* Buttons */
    .btn-limpar { margin-right: 8px; }

    /* Result panel */
    .result-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 8px;
    }

    .result-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 13px;
    }

    .result-ok  { background: #e8f5e9; }
    .result-err { background: #fdecea; }

    .result-ok  mat-icon { color: #2e7d32; }
    .result-err mat-icon { color: #c62828; }

    .result-info { display: flex; flex-direction: column; gap: 2px; }

    .result-detail {
      font-size: 11px;
      color: #666;
    }

    .result-err-msg { color: #c62828; }

    /* Chip moeda no input */
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
