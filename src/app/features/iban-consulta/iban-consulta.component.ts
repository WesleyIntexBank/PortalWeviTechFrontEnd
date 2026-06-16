import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConveraIbanService } from '../../core/services/convera-iban.service';

interface BankDirectory {
  recordKey: string;
  officeType: string;
  bic8Char: string;
  branchBic: string;
  bankCode: string;
  bankName: string;
  bankBranchName?: string;
  streetAddress1?: string;
  streetAddress2?: string;
  city?: string;
  countryProvinceState?: string;
  zipCode?: string;
  countryName: string;
  countryCode: string;
  networkConnectivity?: string;
  serviceCodes?: string;
  iBanKey?: string;
  nationalIdType?: string;
  institutionStatus: string;
}

interface OfficeType       { officeTypeCode: string; officeTypeDescription: string; }
interface LegalType        { legalTypeCode: string;  legalTypeDescription: string; }
interface InstitutionStatus { instStatusCode: string; instStatusDesc: string; instStatusParent?: string; }

interface BankEntry {
  BankDirectory: BankDirectory;
  OfficeType: OfficeType;
  LegalType: LegalType;
  InstitutionStatus: InstitutionStatus;
}

interface ConveraIbanResponse {
  httpStatus: string;
  timestamp: string;
  responseStatus: string;
  totalRecordFound: string;
  totalRecordSent: string;
  banks: BankEntry[];
}

@Component({
  selector: 'app-iban-consulta',
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
        <mat-icon>credit_card</mat-icon>
        <h1>Consulta IBAN</h1>
      </div>

      <!-- Formulário -->
      <div class="card-container">
        <form [formGroup]="form" (ngSubmit)="consultar()" class="search-form">
          <div class="fields-row">
            <mat-form-field appearance="outline" class="field-iban">
              <mat-label>IBAN</mat-label>
              <mat-icon matPrefix>credit_card</mat-icon>
              <input
                matInput
                formControlName="iBanValue"
                placeholder="Ex: AL35202111090000000001234567"
                maxlength="34"
                style="text-transform:uppercase; font-family: monospace; letter-spacing: 1px"
                (input)="ibanMask($event)"
              >
              @if (form.get('iBanValue')?.hasError('required') && form.get('iBanValue')?.touched) {
                <mat-error>IBAN é obrigatório</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="field-country">
              <mat-label>Código País (ISO)</mat-label>
              <mat-icon matPrefix>flag</mat-icon>
              <input
                matInput
                formControlName="isoCountryCode"
                placeholder="Ex: AL"
                maxlength="2"
                style="text-transform:uppercase"
                (input)="toUpperCase($event, 'isoCountryCode')"
              >
            </mat-form-field>

            <mat-form-field appearance="outline" class="field-country-name">
              <mat-label>Nome do País</mat-label>
              <mat-icon matPrefix>public</mat-icon>
              <input
                matInput
                formControlName="countryName"
                placeholder="Ex: Albania"
              >
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
      @if (response() && !loading()) {
        <div class="result-wrapper">

          <!-- Sumário -->
          <div class="result-summary">
            <div class="summary-icon">
              <mat-icon>credit_card</mat-icon>
            </div>
            <div class="summary-info">
              <h2 class="summary-title">Resultado da Consulta IBAN</h2>
              <p class="summary-sub">
                {{ response()!.totalRecordFound }} registro(s) encontrado(s) &bull;
                {{ response()!.totalRecordSent }} enviado(s) &bull;
                {{ response()!.timestamp }}
              </p>
            </div>
            <span class="status-badge" [class.success]="response()!.responseStatus === 'SUCCESS'">
              <mat-icon>{{ response()!.responseStatus === 'SUCCESS' ? 'check_circle' : 'cancel' }}</mat-icon>
              {{ response()!.responseStatus }}
            </span>
          </div>

          <!-- Lista de bancos -->
          <div class="banks-list">
            @for (entry of response()!.banks; track entry.BankDirectory.recordKey) {
              <div class="bank-card">

                <!-- Cabeçalho do banco -->
                <div class="bank-header">
                  <div class="bank-avatar">
                    <mat-icon>{{ entry.OfficeType.officeTypeCode === 'HO' ? 'domain' : 'corporate_fare' }}</mat-icon>
                  </div>
                  <div class="bank-identity">
                    <h3 class="bank-name">{{ entry.BankDirectory.bankName }}</h3>
                    @if (entry.BankDirectory.bankBranchName) {
                      <p class="bank-branch">{{ entry.BankDirectory.bankBranchName }}</p>
                    }
                    <div class="bank-meta">
                      <span class="swift-chip">
                        <mat-icon>code</mat-icon>
                        {{ entry.BankDirectory.bankCode }}
                      </span>
                      @if (entry.BankDirectory.iBanKey) {
                        <span class="iban-chip">
                          <mat-icon>credit_card</mat-icon>
                          {{ entry.BankDirectory.iBanKey }}
                        </span>
                      }
                      <span class="office-chip" [class.head]="entry.OfficeType.officeTypeCode === 'HO'">
                        {{ entry.OfficeType.officeTypeDescription }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Detalhes -->
                <div class="bank-body">
                  <div class="detail-group">
                    <p class="group-label">Identificação</p>
                    <div class="detail-grid">
                      <div class="detail-field">
                        <span class="d-label">BIC 8</span>
                        <span class="d-value mono">{{ entry.BankDirectory.bic8Char }}</span>
                      </div>
                      <div class="detail-field">
                        <span class="d-label">Branch BIC</span>
                        <span class="d-value mono">{{ entry.BankDirectory.branchBic }}</span>
                      </div>
                      <div class="detail-field">
                        <span class="d-label">Record Key</span>
                        <span class="d-value mono">{{ entry.BankDirectory.recordKey }}</span>
                      </div>
                      @if (entry.BankDirectory.nationalIdType) {
                        <div class="detail-field">
                          <span class="d-label">Tipo ID Nacional</span>
                          <span class="d-value mono">{{ entry.BankDirectory.nationalIdType }}</span>
                        </div>
                      }
                    </div>
                  </div>

                  <div class="detail-group">
                    <p class="group-label">Endereço</p>
                    <div class="detail-grid">
                      @if (entry.BankDirectory.streetAddress1) {
                        <div class="detail-field full">
                          <span class="d-label">Logradouro</span>
                          <span class="d-value">
                            {{ entry.BankDirectory.streetAddress1 }}
                            {{ entry.BankDirectory.streetAddress2 ? '/ ' + entry.BankDirectory.streetAddress2 : '' }}
                          </span>
                        </div>
                      }
                      @if (entry.BankDirectory.city) {
                        <div class="detail-field">
                          <span class="d-label">Cidade</span>
                          <span class="d-value">{{ entry.BankDirectory.city }}</span>
                        </div>
                      }
                      @if (entry.BankDirectory.countryProvinceState) {
                        <div class="detail-field">
                          <span class="d-label">Estado / Região</span>
                          <span class="d-value">{{ entry.BankDirectory.countryProvinceState }}</span>
                        </div>
                      }
                      @if (entry.BankDirectory.zipCode) {
                        <div class="detail-field">
                          <span class="d-label">CEP / ZIP</span>
                          <span class="d-value mono">{{ entry.BankDirectory.zipCode }}</span>
                        </div>
                      }
                      <div class="detail-field">
                        <span class="d-label">País</span>
                        <span class="d-value">{{ entry.BankDirectory.countryName }} ({{ entry.BankDirectory.countryCode }})</span>
                      </div>
                    </div>
                  </div>

                  <div class="detail-group">
                    <p class="group-label">Classificação</p>
                    <div class="detail-grid">
                      <div class="detail-field">
                        <span class="d-label">Tipo de Escritório</span>
                        <span class="d-value">{{ entry.OfficeType.officeTypeDescription }}</span>
                      </div>
                      <div class="detail-field">
                        <span class="d-label">Tipo Legal</span>
                        <span class="d-value">{{ entry.LegalType.legalTypeDescription }}</span>
                      </div>
                      <div class="detail-field">
                        <span class="d-label">Status Institucional</span>
                        <span class="d-value">{{ entry.InstitutionStatus.instStatusDesc }}</span>
                      </div>
                      @if (entry.InstitutionStatus.instStatusParent) {
                        <div class="detail-field">
                          <span class="d-label">Categoria</span>
                          <span class="d-value">{{ entry.InstitutionStatus.instStatusParent }}</span>
                        </div>
                      }
                      @if (entry.BankDirectory.networkConnectivity) {
                        <div class="detail-field">
                          <span class="d-label">Conectividade</span>
                          <span class="d-value mono">{{ entry.BankDirectory.networkConnectivity }}</span>
                        </div>
                      }
                      @if (entry.BankDirectory.serviceCodes) {
                        <div class="detail-field full">
                          <span class="d-label">Serviços</span>
                          <span class="d-value mono">{{ entry.BankDirectory.serviceCodes }}</span>
                        </div>
                      }
                    </div>
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

    .field-iban         { flex: 1 1 280px; }
    .field-country      { flex: 0 0 160px; }
    .field-country-name { flex: 1 1 200px; }

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

    /* Wrapper */
    .result-wrapper {
      margin-top: 20px;
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    /* Sumário */
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
      background: rgba(0,150,136,0.12);
      color: #00897b;
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

    /* Lista */
    .banks-list {
      display: flex;
      flex-direction: column;
      border: 1px solid var(--border);
      border-radius: 0 0 14px 14px;
      overflow: hidden;
    }

    .bank-card {
      background: var(--surface);
      border-top: 1px solid var(--border);

      &:first-child { border-top: none; }
    }

    /* Header banco */
    .bank-header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 18px 24px 14px;
      background: rgba(0,150,136,0.03);
      border-bottom: 1px solid var(--border);
    }

    .bank-avatar {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: rgba(0,150,136,0.12);
      color: #00897b;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      mat-icon { font-size: 22px; width: 22px; height: 22px; }
    }

    .bank-identity { flex: 1; }
    .bank-name   { font-size: 15px; font-weight: 700; color: var(--text); margin-bottom: 3px; }
    .bank-branch { font-size: 12px; color: var(--text-sec); margin-bottom: 8px; }

    .bank-meta {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      align-items: center;
    }

    .swift-chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: rgba(61,90,254,0.1);
      color: var(--primary-dark, #3d5afe);
      border-radius: 6px;
      padding: 3px 10px 3px 7px;
      font-size: 12px;
      font-weight: 700;
      font-family: 'Consolas', monospace;
      letter-spacing: 0.8px;
      mat-icon { font-size: 13px; width: 13px; height: 13px; }
    }

    .iban-chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: rgba(0,150,136,0.1);
      color: #00897b;
      border-radius: 6px;
      padding: 3px 10px 3px 7px;
      font-size: 12px;
      font-weight: 700;
      font-family: 'Consolas', monospace;
      letter-spacing: 0.8px;
      mat-icon { font-size: 13px; width: 13px; height: 13px; }
    }

    .office-chip {
      display: inline-flex;
      align-items: center;
      background: rgba(0,0,0,0.06);
      color: var(--text-sec);
      border-radius: 6px;
      padding: 3px 10px;
      font-size: 11px;
      font-weight: 600;

      &.head { background: rgba(255,193,7,0.15); color: #e65100; }
    }

    /* Body banco */
    .bank-body {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
    }

    .detail-group {
      padding: 16px 20px;
      border-right: 1px solid var(--border);

      &:last-child { border-right: none; }
    }

    .group-label {
      font-size: 10px !important;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--body-label) !important;
      margin-bottom: 12px;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 16px;
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
        font-size: 12px;
        letter-spacing: 0.8px;
        color: var(--primary-dark, #3d5afe);
      }
    }

    /* Responsivo */
    @media (max-width: 1100px) {
      .bank-body { grid-template-columns: 1fr 1fr; }
      .detail-group:nth-child(2) { border-right: none; }
      .detail-group:nth-child(3) { border-top: 1px solid var(--border); grid-column: 1 / -1; }
    }

    @media (max-width: 768px) {
      .bank-body { grid-template-columns: 1fr; }
      .detail-group { border-right: none !important; border-top: 1px solid var(--border); }
      .detail-group:first-child { border-top: none; }
      .fields-row { flex-direction: column; }
      .field-iban, .field-country, .field-country-name { flex: 1 1 100%; }
      .btn-consultar { width: 100%; justify-content: center; margin-top: 0; }
    }
  `]
})
export class IbanConsultaComponent {
  private service = inject(ConveraIbanService);

  loading  = signal(false);
  error    = signal<string | null>(null);
  response = signal<ConveraIbanResponse | null>(null);

  form = new FormGroup({
    iBanValue:      new FormControl('', [Validators.required]),
    isoCountryCode: new FormControl(''),
    countryName:    new FormControl(''),
  });

  ibanMask(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 34);
    this.form.get('iBanValue')!.setValue(input.value, { emitEvent: false });
  }

  toUpperCase(event: Event, controlName: string) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.toUpperCase();
    this.form.get(controlName)!.setValue(input.value, { emitEvent: false });
  }

  consultar() {
    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);
    this.error.set(null);
    this.response.set(null);

    const v = this.form.value;
    this.service.search({
      iBanValue:      v.iBanValue || undefined,
      isoCountryCode: v.isoCountryCode || undefined,
      countryName:    v.countryName || undefined,
      pageSize:   100,
      pageNumber: 1,
    }).subscribe({
      next: (data: ConveraIbanResponse) => {
        this.response.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        const msg =
          err?.error?.message ??
          err?.error?.mensagem ??
          'Não foi possível realizar a consulta IBAN. Verifique os dados e tente novamente.';
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }
}
