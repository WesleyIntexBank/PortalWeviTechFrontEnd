import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MoneyGramKafkaService, MoneyGramPayload, MoneyGramResultado } from '../../core/services/moneygram-kafka.service';

@Component({
  selector: 'app-moneygram-envio',
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
    MatExpansionModule,
    MatTooltipModule,
    MatSelectModule,
  ],
  template: `
    <div class="page-wrapper">

      <!-- Cabeçalho -->
      <div class="page-header">
        <div class="header-icon-wrap">
          <mat-icon class="header-icon">send_money</mat-icon>
        </div>
        <div>
          <h1>Envio MoneyGram</h1>
          <p class="subtitle">Monte a lista de remessas e envie para processamento via Kafka → WorkerMoneyGram (SOAP)</p>
        </div>
      </div>

      <div class="layout-grid">

        <!-- Formulário -->
        <mat-card class="form-card">
          <mat-card-header>
            <mat-icon mat-card-avatar class="card-avatar-icon">edit_note</mat-icon>
            <mat-card-title>Novo Registro</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="form">

              <!-- Identificação -->
              <div class="section-title"><mat-icon>badge</mat-icon> Identificação</div>
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
                    <mat-error>Obrigatório</mat-error>
                  }
                </mat-form-field>
                <mat-form-field appearance="outline" class="field-sm">
                  <mat-label>País Destino *</mat-label>
                  <input matInput formControlName="PAIS_DESTINO" placeholder="USA">
                  @if (form.get('PAIS_DESTINO')?.hasError('required') && form.get('PAIS_DESTINO')?.touched) {
                    <mat-error>Obrigatório</mat-error>
                  }
                </mat-form-field>
              </div>

              <mat-accordion class="form-accordion" multi>

                <!-- Pagador -->
                <mat-expansion-panel [expanded]="true">
                  <mat-expansion-panel-header>
                    <mat-panel-title><mat-icon>person</mat-icon>&nbsp;Dados do Pagador (Remetente)</mat-panel-title>
                  </mat-expansion-panel-header>
                  <div class="form-row">
                    <mat-form-field appearance="outline" class="field-lg">
                      <mat-label>Nome Completo *</mat-label>
                      <input matInput formControlName="NOME" placeholder="João da Silva">
                      @if (form.get('NOME')?.hasError('required') && form.get('NOME')?.touched) {
                        <mat-error>Obrigatório</mat-error>
                      }
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-md">
                      <mat-label>CPF *</mat-label>
                      <input matInput formControlName="CPF" placeholder="000.000.000-00">
                      @if (form.get('CPF')?.hasError('required') && form.get('CPF')?.touched) {
                        <mat-error>Obrigatório</mat-error>
                      }
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-md">
                      <mat-label>Data Nascimento</mat-label>
                      <input matInput type="date" formControlName="DATA_NASCIMENTO">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-md">
                      <mat-label>Telefone</mat-label>
                      <input matInput formControlName="TELEFONE" placeholder="11999999999">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-full">
                      <mat-label>Endereço (Rua)</mat-label>
                      <input matInput formControlName="ENDERECO_RUA" placeholder="Av. Paulista, 1000">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-lg">
                      <mat-label>Cidade</mat-label>
                      <input matInput formControlName="ENDERECO_CIDADE" placeholder="Sao Paulo">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-md">
                      <mat-label>CEP</mat-label>
                      <input matInput formControlName="ENDERECO_CEP" placeholder="01310100">
                    </mat-form-field>
                  </div>
                </mat-expansion-panel>

                <!-- Beneficiário -->
                <mat-expansion-panel [expanded]="true">
                  <mat-expansion-panel-header>
                    <mat-panel-title><mat-icon>person_outline</mat-icon>&nbsp;Dados do Beneficiário (Destinatário)</mat-panel-title>
                  </mat-expansion-panel-header>
                  <div class="form-row">
                    <mat-form-field appearance="outline" class="field-full">
                      <mat-label>Nome Completo *</mat-label>
                      <input matInput formControlName="NOME_BENEFICIARIO" placeholder="Jane Doe">
                      @if (form.get('NOME_BENEFICIARIO')?.hasError('required') && form.get('NOME_BENEFICIARIO')?.touched) {
                        <mat-error>Obrigatório</mat-error>
                      }
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-md">
                      <mat-label>Tipo de Entrega *</mat-label>
                      <mat-select formControlName="TIPO_ENTREGA">
                        <mat-option value="WILL_CALL">WILL_CALL (Saque em espécie)</mat-option>
                        <mat-option value="BANK_DEPOSIT">BANK_DEPOSIT (Depósito em conta)</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>
                  @if (form.get('TIPO_ENTREGA')?.value === 'BANK_DEPOSIT') {
                    <div class="form-row">
                      <mat-form-field appearance="outline" class="field-lg">
                        <mat-label>Número da Conta</mat-label>
                        <input matInput formControlName="CONTA_BENEFICIARIO" placeholder="123456789">
                      </mat-form-field>
                      <mat-form-field appearance="outline" class="field-md">
                        <mat-label>Routing Number (9 dígitos)</mat-label>
                        <input matInput formControlName="ROUTING_BENEFICIARIO" placeholder="021000021">
                      </mat-form-field>
                      <mat-form-field appearance="outline" class="field-sm">
                        <mat-label>Tipo Conta</mat-label>
                        <mat-select formControlName="TIPO_CONTA">
                          <mat-option value="CHECKING">CHECKING</mat-option>
                          <mat-option value="SAVINGS">SAVINGS</mat-option>
                        </mat-select>
                      </mat-form-field>
                    </div>
                  }
                </mat-expansion-panel>

                <!-- Valores -->
                <mat-expansion-panel>
                  <mat-expansion-panel-header>
                    <mat-panel-title><mat-icon>attach_money</mat-icon>&nbsp;Valores</mat-panel-title>
                  </mat-expansion-panel-header>
                  <div class="form-row">
                    <mat-form-field appearance="outline" class="field-md">
                      <mat-label>Valor ME (moeda destino) *</mat-label>
                      <input matInput type="number" formControlName="VALOR_ME" placeholder="0.00">
                      @if (form.get('VALOR_ME')?.hasError('required') && form.get('VALOR_ME')?.touched) {
                        <mat-error>Obrigatório</mat-error>
                      }
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="field-md">
                      <mat-label>Valor MN (R$)</mat-label>
                      <input matInput type="number" formControlName="VALOR_MN" placeholder="0.00">
                    </mat-form-field>
                  </div>
                </mat-expansion-panel>

              </mat-accordion>
            </form>
          </mat-card-content>
          <mat-card-actions align="end">
            <button mat-stroked-button (click)="limpar()" class="btn-limpar">
              <mat-icon>clear</mat-icon> Limpar
            </button>
            <button mat-flat-button color="primary" (click)="adicionar()">
              <mat-icon>playlist_add</mat-icon> Adicionar à Lista
            </button>
          </mat-card-actions>
        </mat-card>

        <!-- Lista + Envio -->
        <div class="list-column">
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
                        <th>#</th><th>Boleto</th><th>Pagador</th><th>Beneficiário</th>
                        <th>País</th><th>Moeda</th><th>Valor ME</th><th>Entrega</th><th></th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (item of lista(); track $index) {
                        <tr [class.row-success]="isSuccess($index)" [class.row-error]="isError($index)">
                          <td class="td-index">{{ $index + 1 }}</td>
                          <td class="td-boleto">{{ item.BOLETO }}</td>
                          <td class="td-nome">{{ item.NOME || '—' }}</td>
                          <td class="td-nome">{{ item.NOME_BENEFICIARIO || '—' }}</td>
                          <td>{{ item.PAIS_DESTINO }}</td>
                          <td><span class="chip-moeda">{{ item.MOEDA }}</span></td>
                          <td class="td-valor">{{ item.VALOR_ME | number:'1.2-2' }}</td>
                          <td><span class="chip-entrega" [class.chip-bank]="item.TIPO_ENTREGA === 'BANK_DEPOSIT'">{{ item.TIPO_ENTREGA }}</span></td>
                          <td class="td-actions">
                            @if (resultadosMap()[$index]) {
                              <mat-icon class="status-icon"
                                [class.icon-ok]="resultadosMap()[$index].sucesso"
                                [class.icon-err]="!resultadosMap()[$index].sucesso"
                                [matTooltip]="resultadosMap()[$index].sucesso ? 'offset=' + resultadosMap()[$index].offset : (resultadosMap()[$index].erro ?? '')">
                                {{ resultadosMap()[$index].sucesso ? 'check_circle' : 'error' }}
                              </mat-icon>
                            } @else {
                              <button mat-icon-button color="warn" (click)="remover($index)" [disabled]="enviando()">
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
                  <mat-icon>delete_sweep</mat-icon> Limpar Lista
                </button>
                <button mat-flat-button color="accent" (click)="enviar()" [disabled]="enviando() || lista().length === 0">
                  @if (enviando()) {
                    <mat-spinner diameter="20"></mat-spinner>&nbsp;Enviando...
                  } @else {
                    <mat-icon>rocket_launch</mat-icon>
                    Enviar {{ lista().length }} registro{{ lista().length > 1 ? 's' : '' }}
                  }
                </button>
              </mat-card-actions>
            }
          </mat-card>

          @if (resultados().length > 0) {
            <mat-card class="result-card">
              <mat-card-header>
                <mat-icon mat-card-avatar class="card-avatar-icon"
                  [class.icon-ok]="totalSucesso() === resultados().length"
                  [class.icon-err]="totalSucesso() < resultados().length">
                  {{ totalSucesso() === resultados().length ? 'check_circle' : 'warning' }}
                </mat-icon>
                <mat-card-title>Resultado do Envio</mat-card-title>
                <mat-card-subtitle>{{ totalSucesso() }} de {{ resultados().length }} enviados com sucesso</mat-card-subtitle>
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
    .page-wrapper { padding: 24px; max-width: 1600px; margin: 0 auto; }
    .page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid var(--border); }
    .header-icon-wrap { display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 12px; background: rgba(255, 152, 0, 0.12); flex-shrink: 0; }
    .header-icon { font-size: 26px; width: 26px; height: 26px; color: #ff9800; }
    h1 { font-size: 20px; font-weight: 700; margin: 0 0 3px; color: var(--text); letter-spacing: -0.3px; }
    .subtitle { margin: 0; font-size: 12px; color: var(--text-ter); line-height: 1.5; }
    .layout-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start; }
    @media (max-width: 1100px) { .layout-grid { grid-template-columns: 1fr; } }
    .form-card, .list-card, .result-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; box-shadow: var(--card-shadow); overflow: hidden; }
    .form-card {
      --mdc-outlined-text-field-label-text-color: var(--text);
      --mdc-outlined-text-field-input-text-color: var(--text);
      --mdc-outlined-text-field-outline-color: var(--border);
      --mdc-outlined-text-field-focus-outline-color: #ff9800;
      --mdc-outlined-text-field-focus-label-text-color: #ff9800;
      --mdc-outlined-text-field-caret-color: #ff9800;
      --mdc-outlined-text-field-container-color: transparent;
    }
    .result-card { margin-top: 16px; }
    .card-avatar-icon { color: #ff9800; font-size: 26px; width: 26px; height: 26px; }
    .section-title { display: flex; align-items: center; gap: 7px; font-size: 11px; font-weight: 700; color: var(--text-ter); text-transform: uppercase; letter-spacing: 0.8px; margin: 20px 0 10px; }
    .section-title mat-icon { font-size: 15px; width: 15px; height: 15px; }
    .form-row { display: flex; flex-wrap: wrap; gap: 10px; padding: 6px 0; }
    .field-sm   { flex: 0 0 110px; }
    .field-md   { flex: 1 1 160px; }
    .field-lg   { flex: 1 1 200px; }
    .field-full { flex: 1 1 100%; }
    .form-accordion { margin-top: 10px; }
    .form-accordion mat-expansion-panel { background: transparent !important; border: 1px solid var(--border) !important; border-radius: 10px !important; margin-bottom: 6px !important; box-shadow: none !important; }
    ::ng-deep .form-card .mat-mdc-text-field-wrapper { background: var(--input-bg) !important; }
    ::ng-deep mat-expansion-panel { background: var(--surface) !important; }
    ::ng-deep .mat-expansion-panel-header-title { color: var(--text-sec) !important; }
    ::ng-deep .form-card .mat-mdc-card-title { color: var(--text) !important; }
    ::ng-deep .list-card .mat-mdc-card-title { color: var(--text) !important; }
    ::ng-deep .result-card .mat-mdc-card-title { color: var(--text) !important; }
    .badge { display: inline-flex; align-items: center; justify-content: center; background: #ff9800; color: #fff; border-radius: 10px; min-width: 20px; height: 20px; padding: 0 6px; font-size: 11px; font-weight: 800; margin-left: 10px; vertical-align: middle; }
    .list-table-wrap { overflow-x: auto; margin-top: 6px; border-radius: 8px; border: 1px solid var(--border); }
    .list-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .list-table th { text-align: left; padding: 9px 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: var(--text-ter); background: var(--sidebar, #151520); border-bottom: 1px solid var(--border); white-space: nowrap; }
    .list-table td { padding: 10px 12px; border-bottom: 1px solid var(--border); vertical-align: middle; color: var(--text-sec); }
    .list-table tr:last-child td { border-bottom: none; }
    .list-table tbody tr:hover td { background: var(--row-hover, rgba(255,255,255,.04)); color: var(--text); }
    .td-index  { color: var(--text-ter); width: 32px; font-size: 11px; }
    .td-boleto { font-weight: 600; color: var(--text); font-size: 12px; }
    .td-nome   { max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .td-valor  { text-align: right; font-variant-numeric: tabular-nums; font-size: 12px; }
    .td-actions { width: 44px; text-align: center; }
    .chip-moeda { display: inline-block; background: rgba(255, 152, 0, 0.15); color: #ff9800; border: 1px solid rgba(255, 152, 0, 0.3); border-radius: 6px; padding: 1px 7px; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; }
    .chip-entrega { display: inline-block; background: rgba(120,120,120,0.12); color: var(--text-sec); border-radius: 6px; padding: 1px 7px; font-size: 10px; font-weight: 600; }
    .chip-bank { background: rgba(255, 152, 0, 0.12); color: #ff9800; }
    .row-success td { background: rgba(255, 152, 0, 0.06) !important; }
    .row-error   td { background: rgba(239, 83, 80, 0.06) !important; }
    .status-icon { vertical-align: middle; font-size: 20px; }
    .icon-ok  { color: #ff9800; }
    .icon-err { color: #ef5350; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 52px 0; color: var(--text-ter); }
    .empty-state mat-icon { font-size: 44px; width: 44px; height: 44px; opacity: 0.4; }
    .empty-state p { margin: 0; font-size: 13px; opacity: 0.7; }
    .btn-limpar { margin-right: 8px; }
    .list-column { display: flex; flex-direction: column; }
    .result-list { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; }
    .result-item { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; border-radius: 8px; border: 1px solid transparent; }
    .result-ok { background: rgba(255, 152, 0, 0.08); border-color: rgba(255, 152, 0, 0.2); }
    .result-err { background: rgba(239, 83, 80, 0.08); border-color: rgba(239, 83, 80, 0.2); }
    .result-ok mat-icon  { color: #ff9800; font-size: 20px; }
    .result-err mat-icon { color: #ef5350; font-size: 20px; }
    .result-info { display: flex; flex-direction: column; gap: 2px; }
    .result-info strong { font-size: 13px; color: var(--text); }
    .result-detail { font-size: 11px; color: var(--text-ter); font-family: 'Fira Mono', monospace; }
    .result-err-msg { color: #ef5350; font-family: inherit; }
  `],
})
export class MoneyGramEnvioComponent {
  private service = inject(MoneyGramKafkaService);

  form = new FormGroup({
    BOLETO:              new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    MOEDA:               new FormControl('USD', { nonNullable: true, validators: [Validators.required] }),
    PAIS_DESTINO:        new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    NOME:                new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    CPF:                 new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    DATA_NASCIMENTO:     new FormControl('', { nonNullable: true }),
    TELEFONE:            new FormControl('', { nonNullable: true }),
    ENDERECO_RUA:        new FormControl('', { nonNullable: true }),
    ENDERECO_CIDADE:     new FormControl('', { nonNullable: true }),
    ENDERECO_CEP:        new FormControl('', { nonNullable: true }),
    NOME_BENEFICIARIO:   new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    TIPO_ENTREGA:        new FormControl('WILL_CALL', { nonNullable: true }),
    CONTA_BENEFICIARIO:  new FormControl('', { nonNullable: true }),
    ROUTING_BENEFICIARIO: new FormControl('', { nonNullable: true }),
    TIPO_CONTA:          new FormControl('CHECKING', { nonNullable: true }),
    VALOR_ME:            new FormControl<number>(0, { nonNullable: true, validators: [Validators.required] }),
    VALOR_MN:            new FormControl<number>(0, { nonNullable: true }),
  });

  lista      = signal<MoneyGramPayload[]>([]);
  enviando   = signal(false);
  resultados = signal<MoneyGramResultado[]>([]);

  resultadosMap = computed<Record<number, MoneyGramResultado>>(() => {
    const map: Record<number, MoneyGramResultado> = {};
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
    const payload: MoneyGramPayload = {
      BOLETO:              v.BOLETO,
      NOME:                v.NOME || undefined,
      CPF:                 v.CPF || undefined,
      DATA_NASCIMENTO:     v.DATA_NASCIMENTO || undefined,
      TELEFONE:            v.TELEFONE || undefined,
      ENDERECO_RUA:        v.ENDERECO_RUA || undefined,
      ENDERECO_CIDADE:     v.ENDERECO_CIDADE || undefined,
      ENDERECO_CEP:        v.ENDERECO_CEP || undefined,
      NOME_BENEFICIARIO:   v.NOME_BENEFICIARIO || undefined,
      PAIS_DESTINO:        v.PAIS_DESTINO || undefined,
      MOEDA:               v.MOEDA || undefined,
      VALOR_ME:            Number(v.VALOR_ME),
      VALOR_MN:            Number(v.VALOR_MN) || undefined,
      TIPO_ENTREGA:        v.TIPO_ENTREGA || undefined,
      CONTA_BENEFICIARIO:  v.TIPO_ENTREGA === 'BANK_DEPOSIT' ? v.CONTA_BENEFICIARIO || undefined : undefined,
      ROUTING_BENEFICIARIO: v.TIPO_ENTREGA === 'BANK_DEPOSIT' ? v.ROUTING_BENEFICIARIO || undefined : undefined,
      TIPO_CONTA:          v.TIPO_ENTREGA === 'BANK_DEPOSIT' ? v.TIPO_CONTA || undefined : undefined,
    };

    this.lista.update(l => [...l, payload]);
    this.resultados.set([]);
    this.form.reset({ MOEDA: 'USD', TIPO_ENTREGA: 'WILL_CALL', TIPO_CONTA: 'CHECKING', VALOR_ME: 0, VALOR_MN: 0 });
  }

  remover(index: number): void {
    this.lista.update(l => l.filter((_, i) => i !== index));
    this.resultados.set([]);
  }

  limpar(): void {
    this.form.reset({ MOEDA: 'USD', TIPO_ENTREGA: 'WILL_CALL', TIPO_CONTA: 'CHECKING', VALOR_ME: 0, VALOR_MN: 0 });
  }

  limparLista(): void {
    this.lista.set([]);
    this.resultados.set([]);
  }

  enviar(): void {
    if (this.lista().length === 0) return;
    this.enviando.set(true);
    this.resultados.set([]);

    this.service.enviar(this.lista()).subscribe({
      next: (res) => { this.resultados.set(res); this.enviando.set(false); },
      error: (err) => {
        const msg = err?.error?.message ?? 'Erro ao comunicar com o servidor.';
        this.resultados.set(this.lista().map(item => ({ boleto: item.BOLETO, sucesso: false, erro: msg })));
        this.enviando.set(false);
      },
    });
  }
}
