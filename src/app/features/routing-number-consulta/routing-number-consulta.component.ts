import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RoutingNumberService } from '../../core/services/routing-number.service';

interface RoutingNumberResponse {
  telephone: string;
  zip: string;
  code: number;
  message: string;
  record_type_code: string;
  office_code: string;
  institution_status_code: string;
  rn: string;
  city: string;
  data_view_code: string;
  customer_name: string;
  change_date: string;
  new_routing_number: string;
  state: string;
  address: string;
  routing_number: string;
}

@Component({
  selector: 'app-routing-number-consulta',
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
        <mat-icon>account_balance</mat-icon>
        <h1>Consulta Routing Number (ABA)</h1>
      </div>

      <!-- Formulário -->
      <div class="card-container">
        <form [formGroup]="form" (ngSubmit)="consultar()" class="search-form">
          <div class="fields-row">
            <mat-form-field appearance="outline" class="field-rn">
              <mat-label>Routing Number (ABA)</mat-label>
              <mat-icon matPrefix>account_balance</mat-icon>
              <input
                matInput
                formControlName="number"
                placeholder="Ex: 021000021"
                maxlength="9"
                style="font-family: monospace; letter-spacing: 2px"
                (input)="onlyDigits($event)"
              >
              @if (form.get('number')?.hasError('required') && form.get('number')?.touched) {
                <mat-error>Routing Number é obrigatório</mat-error>
              }
              @if (form.get('number')?.hasError('pattern') && form.get('number')?.touched) {
                <mat-error>Deve conter exatamente 9 dígitos numéricos</mat-error>
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
          <div class="result-summary">
            <div class="summary-icon">
              <mat-icon>account_balance</mat-icon>
            </div>
            <div class="summary-info">
              <h2 class="summary-title">{{ result()!.customer_name }}</h2>
              <p class="summary-sub">
                Routing Number: <span class="mono">{{ result()!.routing_number }}</span>
                &bull; {{ result()!.city }}, {{ result()!.state }}
              </p>
            </div>
            <span class="status-badge" [class.success]="result()!.code === 200">
              <mat-icon>{{ result()!.code === 200 ? 'check_circle' : 'cancel' }}</mat-icon>
              {{ result()!.code === 200 ? 'Encontrado' : 'Não encontrado' }}
            </span>
          </div>

          <!-- Detalhes -->
          <div class="detail-card">
            <div class="detail-section">
              <p class="section-label">Identificação</p>
              <div class="detail-grid">
                <div class="detail-field">
                  <span class="d-label">Routing Number</span>
                  <span class="d-value mono">{{ result()!.routing_number || result()!.rn }}</span>
                </div>
                @if (result()!.new_routing_number) {
                  <div class="detail-field">
                    <span class="d-label">Novo Routing Number</span>
                    <span class="d-value mono">{{ result()!.new_routing_number }}</span>
                  </div>
                }
                <div class="detail-field">
                  <span class="d-label">Código do Tipo de Registro</span>
                  <span class="d-value mono">{{ result()!.record_type_code }}</span>
                </div>
                <div class="detail-field">
                  <span class="d-label">Código do Escritório</span>
                  <span class="d-value mono">{{ result()!.office_code }}</span>
                </div>
                <div class="detail-field">
                  <span class="d-label">Status Institucional</span>
                  <span class="d-value mono">{{ result()!.institution_status_code }}</span>
                </div>
                @if (result()!.data_view_code) {
                  <div class="detail-field">
                    <span class="d-label">Data View Code</span>
                    <span class="d-value mono">{{ result()!.data_view_code }}</span>
                  </div>
                }
              </div>
            </div>

            <div class="detail-section">
              <p class="section-label">Endereço</p>
              <div class="detail-grid">
                @if (result()!.address) {
                  <div class="detail-field full">
                    <span class="d-label">Logradouro</span>
                    <span class="d-value">{{ result()!.address }}</span>
                  </div>
                }
                @if (result()!.city) {
                  <div class="detail-field">
                    <span class="d-label">Cidade</span>
                    <span class="d-value">{{ result()!.city }}</span>
                  </div>
                }
                @if (result()!.state) {
                  <div class="detail-field">
                    <span class="d-label">Estado</span>
                    <span class="d-value">{{ result()!.state }}</span>
                  </div>
                }
                @if (result()!.zip) {
                  <div class="detail-field">
                    <span class="d-label">ZIP Code</span>
                    <span class="d-value mono">{{ result()!.zip }}</span>
                  </div>
                }
                @if (result()!.telephone) {
                  <div class="detail-field">
                    <span class="d-label">Telefone</span>
                    <span class="d-value">{{ result()!.telephone }}</span>
                  </div>
                }
              </div>
            </div>

            @if (result()!.change_date) {
              <div class="detail-section">
                <p class="section-label">Atualização</p>
                <div class="detail-grid">
                  <div class="detail-field">
                    <span class="d-label">Data de Alteração</span>
                    <span class="d-value mono">{{ result()!.change_date }}</span>
                  </div>
                </div>
              </div>
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

    .field-rn { flex: 1 1 280px; max-width: 360px; }

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

    .btn-spinner { margin-right: 4px; }

    /* Erro */
    .error-card {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      background: rgba(244,67,54,0.08);
      border: 1px solid rgba(244,67,54,0.3);
      border-radius: 12px;
      padding: 16px 20px;
      margin-top: 20px;
    }
    .error-card > mat-icon { color: #f44336; font-size: 22px; width: 22px; height: 22px; flex-shrink: 0; margin-top: 2px; }
    .error-body { flex: 1; }
    .error-title { font-weight: 600; font-size: 14px; color: #f44336 !important; margin-bottom: 4px; }
    .error-msg   { font-size: 13px; color: var(--text-sec) !important; }

    /* Resultado */
    .result-wrapper {
      margin-top: 20px;
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .result-summary {
      display: flex;
      align-items: center;
      gap: 18px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px 14px 0 0;
      padding: 20px 24px;
      border-bottom: none;
      flex-wrap: wrap;
    }

    .summary-icon {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      background: rgba(63,81,181,0.12);
      color: #3f51b5;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      mat-icon { font-size: 26px; width: 26px; height: 26px; }
    }

    .summary-info { flex: 1; }
    .summary-title { font-size: 18px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
    .summary-sub   { font-size: 13px; color: var(--text-sec); }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px 6px 10px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 700;
      background: var(--inactive-bg);
      color: var(--inactive-color);
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &.success { background: var(--active-bg); color: var(--active-color); }
    }

    /* Card de detalhes */
    .detail-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 0 0 14px 14px;
      display: flex;
      flex-wrap: wrap;
      gap: 0;
      overflow: hidden;
    }

    .detail-section {
      flex: 1 1 300px;
      padding: 20px 24px;
      border-right: 1px solid var(--border);
      border-bottom: 1px solid var(--border);

      &:last-child { border-right: none; }
    }

    .section-label {
      font-size: 10px !important;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--body-label) !important;
      margin-bottom: 14px;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 20px;
    }

    .detail-field { display: flex; flex-direction: column; gap: 3px; }
    .full { grid-column: 1 / -1; }

    .d-label {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-ter);
    }

    .d-value {
      font-size: 13px;
      font-weight: 500;
      color: var(--text);

      &.mono {
        font-family: 'Consolas', 'Monaco', monospace;
        font-size: 13px;
        letter-spacing: 1px;
        color: var(--primary-dark, #3f51b5);
      }
    }

    .mono {
      font-family: 'Consolas', 'Monaco', monospace;
      font-weight: 700;
    }

    @media (max-width: 768px) {
      .fields-row { flex-direction: column; }
      .field-rn { flex: 1 1 100%; max-width: 100%; }
      .btn-consultar { width: 100%; justify-content: center; margin-top: 0; }
      .detail-section { flex: 1 1 100%; border-right: none; }
      .detail-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class RoutingNumberConsultaComponent {
  private service = inject(RoutingNumberService);

  loading = signal(false);
  error   = signal<string | null>(null);
  result  = signal<RoutingNumberResponse | null>(null);

  form = new FormGroup({
    number: new FormControl('', [
      Validators.required,
      Validators.pattern(/^\d{9}$/),
    ]),
  });

  onlyDigits(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/\D/g, '').slice(0, 9);
    this.form.get('number')!.setValue(input.value, { emitEvent: false });
  }

  consultar() {
    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);
    this.error.set(null);
    this.result.set(null);

    const number = this.form.value.number!;
    this.service.get(number).subscribe({
      next: (data: RoutingNumberResponse) => {
        if (data.code !== 200) {
          this.error.set(data.message || 'Routing Number não encontrado.');
        } else {
          this.result.set(data);
        }
        this.loading.set(false);
      },
      error: (err) => {
        const msg =
          err?.error?.message ??
          err?.error?.mensagem ??
          'Não foi possível realizar a consulta. Verifique o número e tente novamente.';
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }
}
