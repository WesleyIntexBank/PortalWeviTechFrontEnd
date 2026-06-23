import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { BnyService, BnyPaymentAccepted } from '../../core/services/bny.service';

@Component({
  selector: 'app-bny-envio',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatCardModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <mat-icon>account_balance</mat-icon>
        <h1>Envio BNY Mellon</h1>
      </div>

      <div class="cards-wrap">
        <!-- Formulário -->
        <mat-card class="form-card">
          <mat-card-header>
            <div class="header-icon-wrap">
              <mat-icon mat-card-avatar class="card-avatar-icon">send</mat-icon>
            </div>
            <mat-card-title>Novo Pagamento MT103</mat-card-title>
          </mat-card-header>

          <mat-card-content>
            <form [formGroup]="form" (ngSubmit)="submit()" class="form-body">

              <mat-form-field appearance="outline" class="field-full">
                <mat-label>Client Reference ID</mat-label>
                <mat-icon matPrefix>tag</mat-icon>
                <input matInput formControlName="clientReferenceId" placeholder="Ex: REF-2024-001" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="field-full">
                <mat-label>Descrição</mat-label>
                <mat-icon matPrefix>description</mat-icon>
                <input matInput formControlName="clientDescription" placeholder="Ex: Payment for Services" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="field-full">
                <mat-label>Mensagem MT103</mat-label>
                <textarea
                  matInput
                  formControlName="message"
                  rows="14"
                  placeholder="{1:F01IRVTUS3NAXXX...}{2:O103...}{3:{121:uuid}}{4:&#10;:20:REF001&#10;:23B:CRED&#10;:32A:240101USD1000,00&#10;...&#10;-}"
                  class="mt103-area"
                ></textarea>
                @if (form.get('message')?.invalid && form.get('message')?.touched) {
                  <mat-error>A mensagem MT103 é obrigatória.</mat-error>
                }
              </mat-form-field>

              <div class="form-actions">
                <button
                  mat-flat-button
                  color="primary"
                  type="submit"
                  [disabled]="form.invalid || loading()"
                >
                  @if (loading()) {
                    <mat-spinner diameter="20" class="btn-spinner"></mat-spinner>
                  } @else {
                    <mat-icon>send</mat-icon>
                  }
                  Enviar Pagamento
                </button>

                <button mat-stroked-button type="button" (click)="resetForm()">
                  <mat-icon>clear</mat-icon>
                  Limpar
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>

        <!-- Resultado -->
        @if (error()) {
          <div class="error-card">
            <mat-icon>error_outline</mat-icon>
            <div>
              <p class="error-title">Erro ao enviar pagamento</p>
              <p class="error-msg">{{ error() }}</p>
            </div>
          </div>
        }

        @if (result()) {
          <mat-card class="result-card">
            <mat-card-header>
              <div class="header-icon-wrap success">
                <mat-icon mat-card-avatar class="card-avatar-icon">check_circle</mat-icon>
              </div>
              <mat-card-title>Pagamento Enfileirado</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="result-grid">
                <div class="result-item">
                  <span class="result-label">ID interno</span>
                  <span class="result-value mono">{{ result()!.id }}</span>
                </div>
                <div class="result-item">
                  <span class="result-label">Client Reference</span>
                  <span class="result-value mono">{{ result()!.clientReferenceId || '—' }}</span>
                </div>
                <div class="result-item">
                  <span class="result-label">Status</span>
                  <span class="badge badge-queued">{{ result()!.status }}</span>
                </div>
                <div class="result-item">
                  <span class="result-label">Enfileirado em</span>
                  <span class="result-value">{{ result()!.queuedAt | date:'dd/MM/yyyy HH:mm:ss' }}</span>
                </div>
              </div>
              <p class="result-info">
                <mat-icon>info</mat-icon>
                {{ result()!.message }}
              </p>
            </mat-card-content>
          </mat-card>
        }

        <!-- Consulta de status -->
        <mat-card class="list-card">
          <mat-card-header>
            <div class="header-icon-wrap">
              <mat-icon mat-card-avatar class="card-avatar-icon">search</mat-icon>
            </div>
            <mat-card-title>Consultar Status</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="status-row">
              <mat-form-field appearance="outline" class="field-xref">
                <mat-label>XRefId BNY</mat-label>
                <mat-icon matPrefix>confirmation_number</mat-icon>
                <input matInput [(ngModel)]="xrefId" placeholder="Ex: abc123..." />
              </mat-form-field>
              <button mat-flat-button color="accent"
                [disabled]="!xrefId || loadingStatus()"
                (click)="consultarStatus()">
                @if (loadingStatus()) { <mat-spinner diameter="20" class="btn-spinner"></mat-spinner> }
                @else { <mat-icon>search</mat-icon> }
                Consultar
              </button>
            </div>

            @if (statusResult()) {
              <pre class="status-json">{{ statusResult() | json }}</pre>
            }
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .cards-wrap {
      display: flex;
      flex-direction: column;
      gap: 24px;
      margin-top: 8px;
    }

    .form-card, .result-card, .list-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      box-shadow: var(--card-shadow);

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

    ::ng-deep .form-card .mat-mdc-text-field-wrapper,
    ::ng-deep .list-card .mat-mdc-text-field-wrapper { background: var(--input-bg) !important; }

    ::ng-deep .form-card .mat-mdc-card-title,
    ::ng-deep .result-card .mat-mdc-card-title,
    ::ng-deep .list-card .mat-mdc-card-title { color: var(--text) !important; }

    .header-icon-wrap {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: rgba(61,90,254,0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
    }
    .header-icon-wrap.success { background: rgba(67,160,71,0.12); }
    .header-icon-wrap.success .card-avatar-icon { color: #43a047; }
    .card-avatar-icon { color: var(--accent, #3d5afe); font-size: 22px; width: 22px; height: 22px; }

    .form-body { display: flex; flex-direction: column; gap: 4px; padding-top: 16px; }
    .field-full { width: 100%; }

    .mt103-area {
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 12px;
      line-height: 1.6;
      color: var(--text);
    }

    .form-actions {
      display: flex;
      gap: 12px;
      align-items: center;
      margin-top: 8px;
      flex-wrap: wrap;
    }

    button[mat-flat-button], button[mat-stroked-button] {
      height: 44px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 20px;
    }

    .btn-spinner { margin-right: 4px; }

    .error-card {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      background: rgba(244,67,54,0.08);
      border: 1px solid rgba(244,67,54,0.3);
      border-radius: 12px;
      padding: 16px 20px;
      mat-icon { color: #f44336; font-size: 22px; width: 22px; height: 22px; flex-shrink: 0; }
    }
    .error-title { font-weight: 600; font-size: 14px; color: #f44336; margin-bottom: 4px; }
    .error-msg   { font-size: 13px; color: var(--text-sec); }

    .result-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 16px;
      margin-top: 12px;
    }
    .result-item { display: flex; flex-direction: column; gap: 4px; }
    .result-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: var(--text-ter); }
    .result-value { font-size: 14px; color: var(--text); }
    .result-info {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 16px;
      font-size: 13px;
      color: var(--text-sec);
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }

    .mono { font-family: 'Consolas', monospace; font-size: 12px; word-break: break-all; }

    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
    }
    .badge-queued { background: rgba(61,90,254,0.12); color: var(--accent, #3d5afe); }

    .status-row {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
      margin-top: 8px;
    }
    .field-xref { flex: 1 1 280px; }

    .status-json {
      margin-top: 16px;
      padding: 16px;
      background: rgba(0,0,0,0.04);
      border: 1px solid var(--border);
      border-radius: 8px;
      font-family: 'Consolas', monospace;
      font-size: 12px;
      color: var(--text);
      white-space: pre-wrap;
      word-break: break-all;
      max-height: 300px;
      overflow-y: auto;
    }

    @media (max-width: 600px) {
      .form-actions { flex-direction: column; }
      .status-row { flex-direction: column; }
      .field-xref { flex: 1 1 100%; }
    }
  `]
})
export class BnyEnvioComponent {
  private bnyService = inject(BnyService);
  private fb = inject(FormBuilder);

  loading = signal(false);
  loadingStatus = signal(false);
  error = signal<string | null>(null);
  result = signal<BnyPaymentAccepted | null>(null);
  statusResult = signal<any>(null);
  xrefId = '';

  form = this.fb.group({
    clientReferenceId: [''],
    clientDescription: [''],
    message: ['', Validators.required],
  });

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    this.result.set(null);

    const v = this.form.value;
    this.bnyService.sendPayment({
      message: v.message ?? '',
      clientReferenceId: v.clientReferenceId ?? '',
      clientDescription: v.clientDescription ?? '',
    }).subscribe({
      next: (res) => { this.result.set(res); this.loading.set(false); },
      error: (err) => {
        this.error.set(err?.error?.message ?? err?.message ?? 'Erro ao enviar pagamento.');
        this.loading.set(false);
      }
    });
  }

  consultarStatus() {
    if (!this.xrefId) return;
    this.loadingStatus.set(true);
    this.statusResult.set(null);

    this.bnyService.getStatus(this.xrefId).subscribe({
      next: (res) => { this.statusResult.set(res); this.loadingStatus.set(false); },
      error: (err) => {
        this.statusResult.set({ error: err?.error ?? err?.message ?? 'Erro ao consultar.' });
        this.loadingStatus.set(false);
      }
    });
  }

  resetForm() {
    this.form.reset();
    this.error.set(null);
    this.result.set(null);
  }
}
