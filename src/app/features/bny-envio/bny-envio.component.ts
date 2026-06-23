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
import { MatSelectModule } from '@angular/material/select';
import { BnyService, BnyListItem, BnyEnvioResultado } from '../../core/services/bny.service';

@Component({
  selector: 'app-bny-envio',
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
    MatSelectModule,
  ],
  template: `
    <div class="page-wrapper">

      <!-- ── Cabeçalho ─────────────────────────────────────────────── -->
      <div class="page-header">
        <div class="header-icon-wrap">
          <mat-icon class="header-icon">account_balance</mat-icon>
        </div>
        <div>
          <h1>Envio BNY Mellon</h1>
          <p class="subtitle">Preencha os campos, adicione à lista e envie via Kafka → WorkerBny → BNY Mellon API</p>
        </div>
      </div>

      <div class="layout-grid">

        <!-- ── COLUNA ESQUERDA: FORMULÁRIO ───────────────────────── -->
        <mat-card class="form-card">
          <mat-card-header>
            <mat-icon mat-card-avatar class="card-avatar-icon">edit_note</mat-icon>
            <mat-card-title>Nova Transferência MT103</mat-card-title>
          </mat-card-header>

          <mat-card-content>
            <form [formGroup]="form">

              <!-- Identificação -->
              <div class="section-title">
                <mat-icon>badge</mat-icon>
                Identificação
              </div>
              <div class="form-row">
                <mat-form-field appearance="outline" class="field-lg">
                  <mat-label>Referência *</mat-label>
                  <input matInput formControlName="referencia" placeholder="Ex: 4619566">
                  @if (form.get('referencia')?.hasError('required') && form.get('referencia')?.touched) {
                    <mat-error>Campo obrigatório</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="field-sm">
                  <mat-label>Moeda *</mat-label>
                  <input matInput formControlName="moeda" placeholder="USD">
                </mat-form-field>

                <mat-form-field appearance="outline" class="field-md">
                  <mat-label>Valor ME *</mat-label>
                  <input matInput type="number" formControlName="valorME" placeholder="0.00">
                  @if (form.get('valorME')?.hasError('required') && form.get('valorME')?.touched) {
                    <mat-error>Campo obrigatório</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="field-md">
                  <mat-label>Data Valor *</mat-label>
                  <input matInput type="date" formControlName="dataValor">
                  @if (form.get('dataValor')?.hasError('required') && form.get('dataValor')?.touched) {
                    <mat-error>Campo obrigatório</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="field-sm">
                  <mat-label>Encargos</mat-label>
                  <mat-select formControlName="encargos">
                    <mat-option value="OUR">OUR</mat-option>
                    <mat-option value="SHA">SHA</mat-option>
                    <mat-option value="BEN">BEN</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="field-lg">
                  <mat-label>Client Reference ID</mat-label>
                  <input matInput formControlName="clientReferenceId" placeholder="UUID ou referência única">
                  <mat-hint>Deixe vazio para gerar automaticamente</mat-hint>
                </mat-form-field>

                <mat-form-field appearance="outline" class="field-lg">
                  <mat-label>Descrição</mat-label>
                  <input matInput formControlName="clientDescription" placeholder="Payment for Services">
                </mat-form-field>
              </div>

              <!-- Acordeão com seções -->
              <mat-accordion class="form-accordion" multi>

                <!-- Pagador -->
                <mat-expansion-panel [expanded]="true">
                  <mat-expansion-panel-header>
                    <mat-panel-title><mat-icon>account_balance_wallet</mat-icon>&nbsp;Pagador (Debtor)</mat-panel-title>
                  </mat-expansion-panel-header>
                  <div class="form-row">
                    <mat-form-field appearance="outline" class="field-lg">
                      <mat-label>Conta Pagador</mat-label>
                      <input matInput formControlName="contaPagador" placeholder="48065243000134">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-full">
                      <mat-label>Nome Pagador</mat-label>
                      <input matInput formControlName="nomePagador" placeholder="FLEXPORT COMERCIAL IMPORTACAO E EXP">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-full">
                      <mat-label>Endereço Pagador</mat-label>
                      <input matInput formControlName="enderecoPagador" placeholder="AV GOVERNADOR ADOLFO KONDER 705">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-lg">
                      <mat-label>Cidade / UF / País Pagador</mat-label>
                      <input matInput formControlName="cidadePagador" placeholder="ITAJAI SC BR">
                    </mat-form-field>
                  </div>
                </mat-expansion-panel>

                <!-- Banco -->
                <mat-expansion-panel [expanded]="true">
                  <mat-expansion-panel-header>
                    <mat-panel-title><mat-icon>account_balance</mat-icon>&nbsp;Banco</mat-panel-title>
                  </mat-expansion-panel-header>
                  <div class="form-row">
                    <mat-form-field appearance="outline" class="field-lg">
                      <mat-label>Conta Liquidação (53B)</mat-label>
                      <input matInput formControlName="contaLiquidacao" placeholder="8901667072">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-md">
                      <mat-label>BIC Intermediário (56A)</mat-label>
                      <input matInput formControlName="bicIntermediario" placeholder="Opcional">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-md">
                      <mat-label>BIC Banco Destino (57A) *</mat-label>
                      <input matInput formControlName="bicDestino" placeholder="ICBKCNBJZJP">
                      @if (form.get('bicDestino')?.hasError('required') && form.get('bicDestino')?.touched) {
                        <mat-error>Campo obrigatório</mat-error>
                      }
                    </mat-form-field>
                  </div>
                </mat-expansion-panel>

                <!-- Beneficiário -->
                <mat-expansion-panel [expanded]="true">
                  <mat-expansion-panel-header>
                    <mat-panel-title><mat-icon>person</mat-icon>&nbsp;Beneficiário (Creditor)</mat-panel-title>
                  </mat-expansion-panel-header>
                  <div class="form-row">
                    <mat-form-field appearance="outline" class="field-lg">
                      <mat-label>Conta Beneficiário *</mat-label>
                      <input matInput formControlName="contaBeneficiario" placeholder="1202020309814010518">
                      @if (form.get('contaBeneficiario')?.hasError('required') && form.get('contaBeneficiario')?.touched) {
                        <mat-error>Campo obrigatório</mat-error>
                      }
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-full">
                      <mat-label>Nome Beneficiário *</mat-label>
                      <input matInput formControlName="nomeBeneficiario" placeholder="ZHEJIANG RUNYIJIA IMP AND EXP CO LTD">
                      @if (form.get('nomeBeneficiario')?.hasError('required') && form.get('nomeBeneficiario')?.touched) {
                        <mat-error>Campo obrigatório</mat-error>
                      }
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-full">
                      <mat-label>Endereço Beneficiário</mat-label>
                      <input matInput formControlName="enderecoBeneficiario" placeholder="NO666 HANGXING ROAD HANGZHOU">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-lg">
                      <mat-label>Cidade / País Beneficiário</mat-label>
                      <input matInput formControlName="cidadeBeneficiario" placeholder="ZHEJIANG">
                    </mat-form-field>
                  </div>
                </mat-expansion-panel>

                <!-- Informações -->
                <mat-expansion-panel>
                  <mat-expansion-panel-header>
                    <mat-panel-title><mat-icon>description</mat-icon>&nbsp;Informações da Remessa</mat-panel-title>
                  </mat-expansion-panel-header>
                  <div class="form-row">
                    <mat-form-field appearance="outline" class="field-full">
                      <mat-label>Remessa (70)</mat-label>
                      <input matInput formControlName="remessa" placeholder="INV 25SW1016CA /ACC/ DO NOT CONVERT">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-full">
                      <mat-label>Info Adicional (72)</mat-label>
                      <input matInput formControlName="infoAdicional" placeholder="/FULLPAY/ACC/...">
                    </mat-form-field>
                  </div>
                </mat-expansion-panel>

              </mat-accordion>

              <!-- Preview MT103 gerado -->
              @if (mt103Preview()) {
                <div class="mt103-preview">
                  <div class="preview-label">
                    <mat-icon>preview</mat-icon>
                    Preview MT103 gerado
                  </div>
                  <pre class="preview-code">{{ mt103Preview() }}</pre>
                </div>
              }

            </form>
          </mat-card-content>

          <mat-card-actions align="end">
            <button mat-stroked-button (click)="limpar()" class="btn-limpar">
              <mat-icon>clear</mat-icon>
              Limpar
            </button>
            <button mat-stroked-button color="primary" (click)="gerarPreview()" [disabled]="form.invalid">
              <mat-icon>visibility</mat-icon>
              Preview MT103
            </button>
            <button mat-flat-button color="primary" (click)="adicionar()">
              <mat-icon>playlist_add</mat-icon>
              Adicionar à Lista
            </button>
          </mat-card-actions>
        </mat-card>

        <!-- ── COLUNA DIREITA: LISTA E ENVIO ─────────────────────── -->
        <div class="list-column">

          <mat-card class="list-card">
            <mat-card-header>
              <mat-icon mat-card-avatar class="card-avatar-icon">list_alt</mat-icon>
              <mat-card-title>
                Lista de Pagamentos
                @if (lista().length > 0) {
                  <span class="badge">{{ lista().length }}</span>
                }
              </mat-card-title>
              <mat-card-subtitle>Pagamentos prontos para envio ao Kafka</mat-card-subtitle>
            </mat-card-header>

            <mat-card-content>

              @if (lista().length === 0) {
                <div class="empty-state">
                  <mat-icon>inbox</mat-icon>
                  <p>Nenhum pagamento adicionado ainda.</p>
                </div>
              }

              @if (lista().length > 0) {
                <div class="list-table-wrap">
                  <table class="list-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Referência</th>
                        <th>Beneficiário</th>
                        <th>Moeda</th>
                        <th>Valor ME</th>
                        <th>BIC Destino</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (item of lista(); track $index) {
                        <tr [class.row-success]="isSuccess($index)" [class.row-error]="isError($index)">
                          <td class="td-index">{{ $index + 1 }}</td>
                          <td class="td-ref">{{ item.referencia }}</td>
                          <td class="td-nome">{{ item.nomeBeneficiario }}</td>
                          <td class="td-moeda">
                            <span class="chip-moeda">{{ item.moeda }}</span>
                          </td>
                          <td class="td-valor">{{ item.valorME | number:'1.2-2' }}</td>
                          <td class="td-code">{{ item.bicDestino }}</td>
                          <td class="td-actions">
                            @if (resultadosMap()[$index]) {
                              <mat-icon
                                class="status-icon"
                                [class.icon-ok]="resultadosMap()[$index].sucesso"
                                [class.icon-err]="!resultadosMap()[$index].sucesso"
                                [matTooltip]="resultadosMap()[$index].sucesso
                                  ? 'Enviado: id=' + resultadosMap()[$index].id
                                  : (resultadosMap()[$index].erro ?? '')">
                                {{ resultadosMap()[$index].sucesso ? 'check_circle' : 'error' }}
                              </mat-icon>
                            } @else {
                              <button mat-icon-button color="warn" (click)="remover($index)"
                                matTooltip="Remover" [disabled]="enviando()">
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
                <button mat-flat-button color="accent" (click)="enviar()"
                  [disabled]="enviando() || lista().length === 0">
                  @if (enviando()) {
                    <mat-spinner diameter="20"></mat-spinner>
                    &nbsp;Enviando...
                  } @else {
                    <mat-icon>rocket_launch</mat-icon>
                    Enviar {{ lista().length }} pagamento{{ lista().length > 1 ? 's' : '' }} ao Kafka
                  }
                </button>
              </mat-card-actions>
            }
          </mat-card>

          <!-- Resultado do envio -->
          @if (resultados().length > 0) {
            <mat-card class="result-card">
              <mat-card-header>
                <mat-icon mat-card-avatar
                  [class.icon-ok]="totalSucesso() === resultados().length"
                  [class.icon-err]="totalSucesso() < resultados().length"
                  class="card-avatar-icon">
                  {{ totalSucesso() === resultados().length ? 'check_circle' : 'warning' }}
                </mat-icon>
                <mat-card-title>Resultado do Envio</mat-card-title>
                <mat-card-subtitle>
                  {{ totalSucesso() }} de {{ resultados().length }} pagamentos enfileirados com sucesso
                </mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="result-list">
                  @for (r of resultados(); track $index) {
                    <div class="result-item" [class.result-ok]="r.sucesso" [class.result-err]="!r.sucesso">
                      <mat-icon>{{ r.sucesso ? 'check_circle' : 'cancel' }}</mat-icon>
                      <div class="result-info">
                        <strong>{{ r.referencia }}</strong>
                        @if (r.sucesso) {
                          <span class="result-detail">id={{ r.id }} | status={{ r.status }}</span>
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
      background: rgba(61, 90, 254, 0.12);
      flex-shrink: 0;
    }

    .header-icon {
      font-size: 26px;
      width: 26px;
      height: 26px;
      color: var(--accent, #3d5afe);
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

    .layout-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      align-items: start;
    }

    @media (max-width: 1100px) {
      .layout-grid { grid-template-columns: 1fr; }
    }

    .form-card, .list-card, .result-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      box-shadow: var(--card-shadow);
      overflow: hidden;
    }

    .form-card {
      --mdc-outlined-text-field-label-text-color:        var(--text);
      --mdc-outlined-text-field-input-text-color:        var(--text);
      --mdc-outlined-text-field-outline-color:           var(--border);
      --mdc-outlined-text-field-hover-outline-color:     var(--primary);
      --mdc-outlined-text-field-focus-outline-color:     var(--accent);
      --mdc-outlined-text-field-focus-label-text-color:  var(--accent);
      --mdc-outlined-text-field-caret-color:             var(--accent);
      --mdc-outlined-text-field-container-color:         transparent;
      --mat-form-field-container-text-color:             var(--text);
    }

    ::ng-deep .form-card .mat-mdc-text-field-wrapper {
      background: var(--input-bg) !important;
    }

    ::ng-deep input[type="date"]::-webkit-calendar-picker-indicator {
      filter: var(--calendar-icon-filter, invert(0.6));
      cursor: pointer;
    }

    ::ng-deep mat-expansion-panel {
      background: var(--surface) !important;
    }

    ::ng-deep .mat-expansion-panel-header-title {
      color: var(--text-sec) !important;
    }

    ::ng-deep .mat-expansion-indicator::after {
      color: var(--text-sec) !important;
    }

    ::ng-deep .form-card .mat-mdc-card-title,
    ::ng-deep .list-card .mat-mdc-card-title,
    ::ng-deep .result-card .mat-mdc-card-title { color: var(--text) !important; }

    ::ng-deep .form-card .mat-mdc-card-subtitle,
    ::ng-deep .list-card .mat-mdc-card-subtitle,
    ::ng-deep .result-card .mat-mdc-card-subtitle { color: var(--text-sec) !important; }

    .result-card { margin-top: 16px; }

    .card-avatar-icon {
      color: var(--accent, #3d5afe);
      font-size: 26px;
      width: 26px;
      height: 26px;
    }

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

    /* Preview MT103 */
    .mt103-preview {
      margin-top: 16px;
      border: 1px solid var(--border);
      border-radius: 10px;
      overflow: hidden;
    }

    .preview-label {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      background: rgba(61, 90, 254, 0.08);
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: var(--accent, #3d5afe);
      border-bottom: 1px solid var(--border);
    }

    .preview-label mat-icon { font-size: 15px; width: 15px; height: 15px; }

    .preview-code {
      margin: 0;
      padding: 14px;
      font-family: 'Consolas', 'Fira Mono', monospace;
      font-size: 11px;
      line-height: 1.7;
      color: var(--text-sec);
      white-space: pre-wrap;
      word-break: break-all;
      background: var(--input-bg);
      max-height: 240px;
      overflow-y: auto;
    }

    /* Badge */
    .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--accent, #3d5afe);
      color: #fff;
      border-radius: 10px;
      min-width: 20px;
      height: 20px;
      padding: 0 6px;
      font-size: 11px;
      font-weight: 800;
      margin-left: 10px;
      vertical-align: middle;
    }

    /* List table */
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
    .td-ref    { font-weight: 600; color: var(--text); font-size: 12px; }
    .td-nome   { max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .td-code   { font-family: 'Fira Mono', 'Consolas', monospace; font-size: 11px; color: var(--text-sec); }
    .td-valor  { text-align: right; font-variant-numeric: tabular-nums; font-size: 12px; }
    .td-actions { width: 44px; text-align: center; }

    .chip-moeda {
      display: inline-block;
      background: rgba(61, 90, 254, 0.12);
      color: var(--accent, #3d5afe);
      border: 1px solid rgba(61, 90, 254, 0.3);
      border-radius: 6px;
      padding: 1px 7px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    .row-success td { background: rgba(67, 160, 71, 0.06) !important; }
    .row-error   td { background: rgba(239, 83, 80, 0.06) !important; }

    .status-icon { vertical-align: middle; font-size: 20px; }
    .icon-ok  { color: #43a047; }
    .icon-err { color: #ef5350; }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 52px 0;
      color: var(--text-ter);
    }

    .empty-state mat-icon { font-size: 44px; width: 44px; height: 44px; opacity: 0.4; }
    .empty-state p { margin: 0; font-size: 13px; opacity: 0.7; }

    .btn-limpar { margin-right: 4px; }

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

    .result-ok  { background: rgba(67, 160, 71, 0.08); border-color: rgba(67, 160, 71, 0.2); }
    .result-err { background: rgba(239, 83, 80, 0.08); border-color: rgba(239, 83, 80, 0.2); }
    .result-ok  mat-icon { color: #43a047; font-size: 20px; }
    .result-err mat-icon { color: #ef5350; font-size: 20px; }

    .result-info { display: flex; flex-direction: column; gap: 2px; }
    .result-info strong { font-size: 13px; color: var(--text); }
    .result-detail { font-size: 11px; color: var(--text-ter); font-family: 'Fira Mono', 'Consolas', monospace; }
    .result-err-msg { color: #ef5350; font-family: inherit; }

    .list-column { display: flex; flex-direction: column; }
  `],
})
export class BnyEnvioComponent {
  private service = inject(BnyService);

  form = new FormGroup({
    // Identificação
    referencia:        new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    moeda:             new FormControl('USD', { nonNullable: true, validators: [Validators.required] }),
    valorME:           new FormControl<number>(0, { nonNullable: true, validators: [Validators.required, Validators.min(0.01)] }),
    dataValor:         new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    encargos:          new FormControl('OUR', { nonNullable: true }),
    clientReferenceId: new FormControl('', { nonNullable: true }),
    clientDescription: new FormControl('Payment for Services', { nonNullable: true }),
    // Pagador
    contaPagador:      new FormControl('', { nonNullable: true }),
    nomePagador:       new FormControl('', { nonNullable: true }),
    enderecoPagador:   new FormControl('', { nonNullable: true }),
    cidadePagador:     new FormControl('', { nonNullable: true }),
    // Banco
    contaLiquidacao:   new FormControl('', { nonNullable: true }),
    bicIntermediario:  new FormControl('', { nonNullable: true }),
    bicDestino:        new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    // Beneficiário
    contaBeneficiario:   new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    nomeBeneficiario:    new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    enderecoBeneficiario: new FormControl('', { nonNullable: true }),
    cidadeBeneficiario:  new FormControl('', { nonNullable: true }),
    // Informações
    remessa:       new FormControl('', { nonNullable: true }),
    infoAdicional: new FormControl('', { nonNullable: true }),
  });

  lista      = signal<BnyListItem[]>([]);
  enviando   = signal(false);
  resultados = signal<BnyEnvioResultado[]>([]);
  mt103Preview = signal<string>('');

  resultadosMap = computed<Record<number, BnyEnvioResultado>>(() => {
    const map: Record<number, BnyEnvioResultado> = {};
    this.resultados().forEach((r, i) => { map[i] = r; });
    return map;
  });

  totalSucesso = computed(() => this.resultados().filter(r => r.sucesso).length);

  isSuccess(i: number): boolean { return !!this.resultadosMap()[i]?.sucesso; }
  isError(i: number):   boolean { return this.resultadosMap()[i] !== undefined && !this.resultadosMap()[i].sucesso; }

  private buildMt103(v: ReturnType<typeof this.form.getRawValue>): string {
    // Date: YYYY-MM-DD → YYMMDD
    const parts = (v.dataValor || '').split('-');
    const valueDate = parts.length === 3
      ? `${parts[0].slice(2)}${parts[1]}${parts[2]}`
      : '000000';

    const amount = Number(v.valorME).toFixed(2).replace('.', ',');

    let msg = `{1:F01IRVTUS3NAXXX0000000000}`;
    msg += `{2:O1030000${valueDate}IRVTUS3NAXXX0000000000${valueDate}0000N}`;
    msg += `{3:{108:${v.referencia}}{121:${crypto.randomUUID()}}}`;
    msg += `{4:`;
    msg += `:20:${v.referencia}`;
    msg += `:23B:CRED`;
    msg += `:32A:${valueDate}${v.moeda}${amount}`;

    // Tag 50K - pagador
    msg += `:50K:`;
    if (v.contaPagador) msg += `/${v.contaPagador}`;
    if (v.nomePagador) msg += `/**/${v.nomePagador}`;
    if (v.enderecoPagador) msg += `/**/${v.enderecoPagador}`;
    if (v.cidadePagador) msg += `/**/${v.cidadePagador}`;

    // Tag 53B - liquidação
    if (v.contaLiquidacao) msg += `:53B:/${v.contaLiquidacao}`;

    // Tag 56A - banco intermediário
    if (v.bicIntermediario) msg += `:56A:${v.bicIntermediario}`;

    // Tag 57A - banco destino
    msg += `:57A:${v.bicDestino}`;

    // Tag 59 - beneficiário
    msg += `:59:/${v.contaBeneficiario}`;
    if (v.nomeBeneficiario) msg += `/**/${v.nomeBeneficiario}`;
    if (v.enderecoBeneficiario) msg += `/**/${v.enderecoBeneficiario}`;
    if (v.cidadeBeneficiario) msg += `/**/${v.cidadeBeneficiario}/**/`;

    // Tag 70 - remessa
    if (v.remessa) msg += `:70:${v.remessa}`;

    // Tag 71A - encargos
    msg += `:71A:${v.encargos}`;

    // Tag 72 - info adicional
    if (v.infoAdicional) msg += `:72:${v.infoAdicional}`;

    msg += `-}`;
    return msg;
  }

  gerarPreview(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.mt103Preview.set(this.buildMt103(v));
  }

  adicionar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    const mt103 = this.buildMt103(v);
    const refId = v.clientReferenceId || crypto.randomUUID();

    const item: BnyListItem = {
      referencia:        v.referencia,
      moeda:             v.moeda,
      valorME:           Number(v.valorME),
      dataValor:         v.dataValor,
      nomeBeneficiario:  v.nomeBeneficiario,
      bicDestino:        v.bicDestino,
      clientReferenceId: refId,
      clientDescription: v.clientDescription,
      mt103,
    };

    this.lista.update(l => [...l, item]);
    this.resultados.set([]);
    this.mt103Preview.set('');
    this.form.reset({
      moeda: 'USD',
      encargos: 'OUR',
      clientDescription: 'Payment for Services',
      valorME: 0,
    });
  }

  remover(index: number): void {
    this.lista.update(l => l.filter((_, i) => i !== index));
    this.resultados.set([]);
  }

  limpar(): void {
    this.form.reset({
      moeda: 'USD',
      encargos: 'OUR',
      clientDescription: 'Payment for Services',
      valorME: 0,
    });
    this.mt103Preview.set('');
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
          this.lista().map(item => ({ referencia: item.referencia, sucesso: false, erro: msg }))
        );
        this.enviando.set(false);
      },
    });
  }
}
