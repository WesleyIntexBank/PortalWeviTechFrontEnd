import { Component, signal, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { PixBtgService, PixBtgRequest, PixBtgPagamento } from '../../core/services/pixbtg.service';

@Component({
  selector: 'app-pixbtg-envio',
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
    MatSelectModule,
    MatTooltipModule,
    MatTabsModule,
    MatChipsModule,
  ],
  template: `
    <div class="page-wrapper">

      <!-- Cabeçalho -->
      <div class="page-header">
        <div class="header-icon-wrap">
          <mat-icon class="header-icon">qr_code_2</mat-icon>
        </div>
        <div>
          <h1>Envio Pix BTG</h1>
          <p class="subtitle">Gere QR Codes Pix ou envie pagamentos via BTG Pactual com confirmação em tempo real</p>
        </div>
      </div>

      <div class="layout-grid">

        <!-- Formulário -->
        <mat-card class="form-card">
          <mat-card-header>
            <mat-icon mat-card-avatar class="card-icon">edit_note</mat-icon>
            <mat-card-title>Nova Transação</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="form">

              <!-- Tipo -->
              <div class="form-row">
                <mat-form-field appearance="outline" class="field-full">
                  <mat-label>Tipo de Operação *</mat-label>
                  <mat-select formControlName="tipo">
                    <mat-option value="GERAR_QR">
                      <mat-icon style="vertical-align:middle;margin-right:6px;font-size:18px">qr_code</mat-icon>
                      Gerar QR Code (receber Pix)
                    </mat-option>
                    <mat-option value="ENVIAR_PIX">
                      <mat-icon style="vertical-align:middle;margin-right:6px;font-size:18px">send</mat-icon>
                      Enviar Pix (pagar chave Pix)
                    </mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <!-- Identificação -->
              <div class="section-label"><mat-icon>badge</mat-icon> Identificação</div>
              <div class="form-row">
                <mat-form-field appearance="outline" class="field-lg">
                  <mat-label>Boleto / Referência *</mat-label>
                  <input matInput formControlName="boleto" placeholder="REF-PIX-001">
                  @if (form.get('boleto')?.hasError('required') && form.get('boleto')?.touched) {
                    <mat-error>Obrigatório</mat-error>
                  }
                </mat-form-field>
                <mat-form-field appearance="outline" class="field-sm">
                  <mat-label>Moeda</mat-label>
                  <input matInput formControlName="moeda" placeholder="BRL">
                </mat-form-field>
              </div>

              <!-- Valores -->
              <div class="section-label"><mat-icon>attach_money</mat-icon> Valores</div>
              <div class="form-row">
                <mat-form-field appearance="outline" class="field-md">
                  <mat-label>Valor ME (moeda) *</mat-label>
                  <input matInput type="number" formControlName="valorME" placeholder="0.00" step="0.01">
                  @if (form.get('valorME')?.hasError('required') && form.get('valorME')?.touched) {
                    <mat-error>Obrigatório</mat-error>
                  }
                </mat-form-field>
                <mat-form-field appearance="outline" class="field-md">
                  <mat-label>Valor MN (R$)</mat-label>
                  <input matInput type="number" formControlName="valorMN" placeholder="0.00" step="0.01">
                </mat-form-field>
              </div>

              <!-- Beneficiário -->
              <div class="section-label"><mat-icon>person_outline</mat-icon> Beneficiário / Destinatário</div>
              <div class="form-row">
                <mat-form-field appearance="outline" class="field-lg">
                  <mat-label>Nome Beneficiário</mat-label>
                  <input matInput formControlName="nomeBeneficiario" placeholder="João da Silva">
                </mat-form-field>
                <mat-form-field appearance="outline" class="field-md">
                  <mat-label>CPF/CNPJ Beneficiário</mat-label>
                  <input matInput formControlName="cpfCnpjBeneficiario" placeholder="000.000.000-00">
                </mat-form-field>
              </div>

              @if (tipoSelecionado() === 'ENVIAR_PIX') {
                <div class="form-row">
                  <mat-form-field appearance="outline" class="field-full">
                    <mat-label>Chave Pix Beneficiário *</mat-label>
                    <input matInput formControlName="chavePixBeneficiario" placeholder="CPF, email, telefone ou chave aleatória">
                    @if (form.get('chavePixBeneficiario')?.hasError('required') && form.get('chavePixBeneficiario')?.touched) {
                      <mat-error>Obrigatório para ENVIAR_PIX</mat-error>
                    }
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="field-md">
                    <mat-label>Banco Destino</mat-label>
                    <input matInput formControlName="bancoDestino" placeholder="BTG, Itaú...">
                  </mat-form-field>
                </div>
              }

              <!-- Remetente -->
              <div class="section-label"><mat-icon>person</mat-icon> Remetente</div>
              <div class="form-row">
                <mat-form-field appearance="outline" class="field-full">
                  <mat-label>Nome Remetente</mat-label>
                  <input matInput formControlName="nomeRemetente" placeholder="Nome do pagador / empresa">
                </mat-form-field>
              </div>

            </form>
          </mat-card-content>
          <mat-card-actions align="end">
            <button mat-stroked-button (click)="limpar()" [disabled]="enviando()">
              <mat-icon>clear</mat-icon> Limpar
            </button>
            <button mat-flat-button color="primary" (click)="enviar()" [disabled]="enviando()">
              @if (enviando()) {
                <mat-spinner diameter="18"></mat-spinner>&nbsp;Processando...
              } @else {
                <mat-icon>{{ tipoSelecionado() === 'GERAR_QR' ? 'qr_code' : 'send' }}</mat-icon>
                {{ tipoSelecionado() === 'GERAR_QR' ? 'Gerar QR Code' : 'Enviar Pix' }}
              }
            </button>
          </mat-card-actions>
        </mat-card>

        <!-- Resultado / Status -->
        <div class="right-column">

          @if (erro()) {
            <mat-card class="result-card error-card">
              <mat-card-content>
                <div class="status-banner error">
                  <mat-icon>error_outline</mat-icon>
                  <span>{{ erro() }}</span>
                </div>
              </mat-card-content>
            </mat-card>
          }

          @if (pagamento()) {
            <mat-card class="result-card">
              <mat-card-header>
                <mat-icon mat-card-avatar class="card-icon"
                  [class.icon-queued]="pagamento()!.status === 'QUEUED'"
                  [class.icon-processing]="pagamento()!.status === 'PROCESSING'"
                  [class.icon-ok]="['QR_GENERATED','SENT','CONFIRMED'].includes(pagamento()!.status)"
                  [class.icon-err]="pagamento()!.status === 'ERROR'">
                  {{ statusIcon(pagamento()!.status) }}
                </mat-icon>
                <mat-card-title>Transação: {{ pagamento()!.boleto }}</mat-card-title>
                <mat-card-subtitle>
                  <span class="chip-status" [class]="'chip-' + pagamento()!.status.toLowerCase()">
                    {{ pagamento()!.status }}
                  </span>
                </mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>

                <div class="info-grid">
                  <div class="info-item"><span class="info-label">Tipo</span><span class="info-val">{{ pagamento()!.tipo }}</span></div>
                  <div class="info-item"><span class="info-label">Valor ME</span><span class="info-val">{{ pagamento()!.valorME | number:'1.2-2' }} {{ pagamento()!.moeda }}</span></div>
                  @if (pagamento()!.txId) {
                    <div class="info-item"><span class="info-label">TxID</span><span class="info-val mono">{{ pagamento()!.txId }}</span></div>
                  }
                  @if (pagamento()!.idPixBtg) {
                    <div class="info-item"><span class="info-label">Pactual ID</span><span class="info-val mono">{{ pagamento()!.idPixBtg }}</span></div>
                  }
                  @if (pagamento()!.endToEndId) {
                    <div class="info-item"><span class="info-label">E2E ID</span><span class="info-val mono">{{ pagamento()!.endToEndId }}</span></div>
                  }
                  @if (pagamento()!.nomeBeneficiario) {
                    <div class="info-item"><span class="info-label">Beneficiário</span><span class="info-val">{{ pagamento()!.nomeBeneficiario }}</span></div>
                  }
                  @if (pagamento()!.error) {
                    <div class="info-item full"><span class="info-label">Erro</span><span class="info-val err-text">{{ pagamento()!.error }}</span></div>
                  }
                </div>

                <!-- QR Code -->
                @if (pagamento()!.emvPayload) {
                  <div class="qr-section">
                    <div class="section-label"><mat-icon>qr_code</mat-icon> Pix Copia e Cola</div>
                    <div class="emv-box">
                      <span class="emv-text">{{ pagamento()!.emvPayload }}</span>
                      <button mat-icon-button (click)="copiarEmv()" [matTooltip]="'Copiar código'">
                        <mat-icon>content_copy</mat-icon>
                      </button>
                    </div>
                    @if (copiado()) {
                      <span class="copiado-badge">Copiado!</span>
                    }
                  </div>
                }

                @if (pagamento()!.imageBase64) {
                  <div class="qr-img-section">
                    <div class="section-label"><mat-icon>image</mat-icon> QR Code</div>
                    <div class="qr-img-wrap">
                      <img [src]="'data:image/png;base64,' + pagamento()!.imageBase64"
                           alt="QR Code PIX" class="qr-img">
                      <button mat-stroked-button (click)="baixarQr()" class="btn-download">
                        <mat-icon>download</mat-icon> Baixar
                      </button>
                    </div>
                  </div>
                }

              </mat-card-content>
              @if (pagamento()!.status === 'QUEUED' || pagamento()!.status === 'PROCESSING') {
                <mat-card-actions align="end">
                  <button mat-stroked-button (click)="atualizarStatus()" [disabled]="consultando()">
                    @if (consultando()) {
                      <mat-spinner diameter="16"></mat-spinner>&nbsp;
                    } @else {
                      <mat-icon>refresh</mat-icon>
                    }
                    Atualizar Status
                  </button>
                </mat-card-actions>
              }
            </mat-card>
          }

          <!-- Histórico recente -->
          @if (historico().length > 0) {
            <mat-card class="hist-card">
              <mat-card-header>
                <mat-icon mat-card-avatar class="card-icon">history</mat-icon>
                <mat-card-title>Histórico da Sessão</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="hist-list">
                  @for (item of historico(); track item.boleto) {
                    <div class="hist-item" (click)="verDetalhe(item)">
                      <div class="hist-left">
                        <mat-icon class="hist-icon" [class]="'icon-' + item.status.toLowerCase().replace('_','-')">
                          {{ statusIcon(item.status) }}
                        </mat-icon>
                        <div>
                          <div class="hist-boleto">{{ item.boleto }}</div>
                          <div class="hist-info">{{ item.tipo }} · {{ item.valorME | number:'1.2-2' }} {{ item.moeda }}</div>
                        </div>
                      </div>
                      <span class="chip-status" [class]="'chip-' + item.status.toLowerCase()">{{ item.status }}</span>
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
    .page-wrapper { padding: 24px; max-width: 1400px; margin: 0 auto; }

    .page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid var(--border); }
    .header-icon-wrap { display: flex; align-items: center; justify-content: center; width: 52px; height: 52px; border-radius: 14px; background: rgba(0, 200, 130, 0.12); flex-shrink: 0; }
    .header-icon { font-size: 28px; width: 28px; height: 28px; color: #00c882; }
    h1 { font-size: 20px; font-weight: 700; margin: 0 0 3px; color: var(--text); }
    .subtitle { margin: 0; font-size: 12px; color: var(--text-ter); }

    .layout-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start; }
    @media (max-width: 1100px) { .layout-grid { grid-template-columns: 1fr; } }

    .form-card, .result-card, .hist-card, .error-card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 14px; box-shadow: var(--card-shadow); overflow: hidden;
    }
    .form-card {
      --mdc-outlined-text-field-label-text-color: var(--text);
      --mdc-outlined-text-field-input-text-color: var(--text);
      --mdc-outlined-text-field-outline-color: var(--border);
      --mdc-outlined-text-field-focus-outline-color: #00c882;
      --mdc-outlined-text-field-focus-label-text-color: #00c882;
      --mdc-outlined-text-field-caret-color: #00c882;
      --mdc-outlined-text-field-container-color: transparent;
    }
    ::ng-deep .form-card .mat-mdc-text-field-wrapper { background: var(--input-bg) !important; }
    ::ng-deep .form-card .mat-mdc-card-title { color: var(--text) !important; }
    ::ng-deep .result-card .mat-mdc-card-title { color: var(--text) !important; }
    ::ng-deep .hist-card .mat-mdc-card-title { color: var(--text) !important; }

    .card-icon { color: #00c882; font-size: 26px; width: 26px; height: 26px; }

    .section-label { display: flex; align-items: center; gap: 7px; font-size: 10px; font-weight: 700; color: var(--text-ter); text-transform: uppercase; letter-spacing: 0.8px; margin: 16px 0 8px; }
    .section-label mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .form-row { display: flex; flex-wrap: wrap; gap: 10px; }
    .field-sm   { flex: 0 0 100px; }
    .field-md   { flex: 1 1 160px; }
    .field-lg   { flex: 1 1 220px; }
    .field-full { flex: 1 1 100%; }

    .right-column { display: flex; flex-direction: column; gap: 16px; }
    .result-card { margin: 0; }
    .error-card { border-color: rgba(239, 83, 80, 0.4); }

    .status-banner { display: flex; align-items: center; gap: 10px; padding: 14px; border-radius: 8px; }
    .status-banner.error { background: rgba(239, 83, 80, 0.1); color: #ef5350; }
    .status-banner mat-icon { font-size: 20px; flex-shrink: 0; }
    .status-banner span { font-size: 13px; }

    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 12px; }
    .info-item { display: flex; flex-direction: column; gap: 2px; background: var(--row-hover, rgba(255,255,255,.03)); border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px; }
    .info-item.full { grid-column: 1 / -1; }
    .info-label { font-size: 10px; font-weight: 700; color: var(--text-ter); text-transform: uppercase; letter-spacing: 0.5px; }
    .info-val { font-size: 13px; color: var(--text); }
    .info-val.mono { font-family: 'Fira Mono', monospace; font-size: 11px; word-break: break-all; }
    .err-text { color: #ef5350; font-size: 12px; }

    .chip-status { display: inline-block; padding: 2px 9px; border-radius: 8px; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; border: 1px solid transparent; }
    .chip-queued     { background: rgba(100,100,100,.15); color: var(--text-sec); border-color: rgba(100,100,100,.2); }
    .chip-processing { background: rgba(33,150,243,.15);  color: #2196f3; border-color: rgba(33,150,243,.3); }
    .chip-qr_generated,.chip-qr-generated { background: rgba(0,200,130,.15); color: #00c882; border-color: rgba(0,200,130,.3); }
    .chip-sent       { background: rgba(0,200,130,.15);   color: #00c882;  border-color: rgba(0,200,130,.3); }
    .chip-confirmed  { background: rgba(0,200,130,.15);   color: #00c882;  border-color: rgba(0,200,130,.3); }
    .chip-error      { background: rgba(239,83,80,.15);   color: #ef5350;  border-color: rgba(239,83,80,.3); }
    .chip-reversed   { background: rgba(255,152,0,.15);   color: #ff9800;  border-color: rgba(255,152,0,.3); }

    .icon-ok         { color: #00c882; }
    .icon-queued     { color: var(--text-ter); }
    .icon-processing { color: #2196f3; }
    .icon-err        { color: #ef5350; }

    .qr-section { margin-top: 18px; }
    .emv-box { display: flex; align-items: center; gap: 8px; background: var(--row-hover, rgba(0,0,0,.06)); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; margin-top: 6px; }
    .emv-text { flex: 1; font-family: 'Fira Mono', monospace; font-size: 10px; color: var(--text-sec); word-break: break-all; line-height: 1.6; }
    .copiado-badge { display: inline-block; margin-top: 6px; background: rgba(0,200,130,.15); color: #00c882; border-radius: 6px; padding: 2px 10px; font-size: 11px; font-weight: 700; }

    .qr-img-section { margin-top: 18px; }
    .qr-img-wrap { display: flex; flex-direction: column; align-items: center; gap: 12px; margin-top: 8px; }
    .qr-img { width: 200px; height: 200px; object-fit: contain; border-radius: 12px; border: 1px solid var(--border); background: #fff; padding: 8px; }
    .btn-download { font-size: 12px; }

    .hist-card { margin: 0; }
    .hist-list { display: flex; flex-direction: column; gap: 4px; margin-top: 8px; }
    .hist-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border); cursor: pointer; transition: background .15s; }
    .hist-item:hover { background: var(--row-hover, rgba(255,255,255,.04)); }
    .hist-left { display: flex; align-items: center; gap: 10px; }
    .hist-icon { font-size: 20px; width: 20px; height: 20px; }
    .hist-boleto { font-size: 13px; font-weight: 600; color: var(--text); }
    .hist-info { font-size: 11px; color: var(--text-ter); margin-top: 2px; }
  `],
})
export class PixBtgEnvioComponent {
  private service = inject(PixBtgService);

  form = new FormGroup({
    tipo:                new FormControl<'GERAR_QR' | 'ENVIAR_PIX'>('GERAR_QR', { nonNullable: true }),
    boleto:              new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    moeda:               new FormControl('BRL', { nonNullable: true }),
    valorME:             new FormControl<number | null>(null, { validators: [Validators.required] }),
    valorMN:             new FormControl<number | null>(null),
    nomeBeneficiario:    new FormControl('', { nonNullable: true }),
    cpfCnpjBeneficiario: new FormControl('', { nonNullable: true }),
    chavePixBeneficiario:new FormControl('', { nonNullable: true }),
    bancoDestino:        new FormControl('', { nonNullable: true }),
    nomeRemetente:       new FormControl('', { nonNullable: true }),
  });

  tipoSelecionado = signal<'GERAR_QR' | 'ENVIAR_PIX'>('GERAR_QR');
  enviando   = signal(false);
  consultando= signal(false);
  erro       = signal<string | null>(null);
  copiado    = signal(false);
  pagamento  = signal<PixBtgPagamento | null>(null);
  historico  = signal<PixBtgPagamento[]>([]);

  constructor() {
    effect(() => {
      const tipo = this.form.get('tipo')!.value as 'GERAR_QR' | 'ENVIAR_PIX';
      this.tipoSelecionado.set(tipo);
    });
  }

  statusIcon(status: string): string {
    const map: Record<string, string> = {
      QUEUED: 'schedule', PROCESSING: 'autorenew',
      QR_GENERATED: 'qr_code', SENT: 'send', CONFIRMED: 'check_circle',
      ERROR: 'error', REVERSED: 'undo',
    };
    return map[status] ?? 'help_outline';
  }

  enviar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const v = this.form.getRawValue();

    if (v.tipo === 'ENVIAR_PIX' && !v.chavePixBeneficiario) {
      this.erro.set('Chave Pix do beneficiário é obrigatória para ENVIAR_PIX.');
      return;
    }

    this.enviando.set(true);
    this.erro.set(null);

    const request: PixBtgRequest = {
      Boleto:               v.boleto,
      Tipo:                 v.tipo,
      ValorME:              v.valorME ?? undefined,
      ValorMN:              v.valorMN ?? undefined,
      Moeda:                v.moeda || 'BRL',
      NomeBeneficiario:     v.nomeBeneficiario || undefined,
      CpfCnpjBeneficiario:  v.cpfCnpjBeneficiario || undefined,
      ChavePixBeneficiario: v.chavePixBeneficiario || undefined,
      BancoDestino:         v.bancoDestino || undefined,
      NomeRemetente:        v.nomeRemetente || undefined,
    };

    this.service.enviar(request).subscribe({
      next: (res) => {
        this.enviando.set(false);
        // Polling de status após enfileirar
        this.pollStatus(v.boleto);
      },
      error: (err) => {
        this.enviando.set(false);
        this.erro.set(err?.error?.message ?? 'Erro ao enviar transação. Tente novamente.');
      },
    });
  }

  private pollStatus(boleto: string, tentativas = 0): void {
    if (tentativas > 10) return;
    this.consultando.set(true);

    this.service.consultarStatus(boleto).subscribe({
      next: (p) => {
        this.pagamento.set(p);
        this.consultando.set(false);
        this.historico.update(h => {
          const idx = h.findIndex(x => x.boleto === boleto);
          return idx >= 0 ? h.map((x, i) => i === idx ? p : x) : [p, ...h].slice(0, 20);
        });

        if (p.status === 'QUEUED' || p.status === 'PROCESSING') {
          setTimeout(() => this.pollStatus(boleto, tentativas + 1), 3000);
        }
      },
      error: () => {
        this.consultando.set(false);
        setTimeout(() => this.pollStatus(boleto, tentativas + 1), 3000);
      },
    });
  }

  atualizarStatus(): void {
    const p = this.pagamento();
    if (!p) return;
    this.pollStatus(p.boleto);
  }

  verDetalhe(item: PixBtgPagamento): void {
    this.pagamento.set(item);
  }

  copiarEmv(): void {
    const emv = this.pagamento()?.emvPayload;
    if (!emv) return;
    navigator.clipboard.writeText(emv).then(() => {
      this.copiado.set(true);
      setTimeout(() => this.copiado.set(false), 2000);
    });
  }

  baixarQr(): void {
    const img = this.pagamento()?.imageBase64;
    const boleto = this.pagamento()?.boleto ?? 'qrcode';
    if (!img) return;
    const a = document.createElement('a');
    a.href = `data:image/png;base64,${img}`;
    a.download = `pix-qr-${boleto}.png`;
    a.click();
  }

  limpar(): void {
    this.form.reset({ tipo: 'GERAR_QR', moeda: 'BRL' });
    this.tipoSelecionado.set('GERAR_QR');
    this.erro.set(null);
    this.pagamento.set(null);
  }
}
