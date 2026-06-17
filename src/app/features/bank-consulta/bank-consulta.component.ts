import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConveraSwiftService } from '../../core/services/convera-swift.service';
import { ConveraIbanService } from '../../core/services/convera-iban.service';
import { RoutingNumberService } from '../../core/services/routing-number.service';

/* ── SWIFT types ─────────────────────────────────────── */
interface SwiftBankDirectory {
  recordKey: string; officeType: string; parentOfficeKey: string;
  headOfficeKey: string; legalType: string; groupType: string;
  institutionStatus: string; bic8Char: string; branchBic: string;
  bankCode: string; bankBranchCode?: string; bankName: string;
  bankBranchName?: string; streetAddress1?: string; streetAddress2?: string;
  city?: string; countryProvinceState?: string; zipCode?: string;
  countryName: string; countryCode: string; timezone?: string;
  networkConnectivity?: string; branchQualifiers?: string;
  serviceCodes?: string; nationalIdType?: string;
  fedwireRoutingCode?: string; fedachRoutingCode?: string;
}
interface OfficeType        { officeTypeCode: string; officeTypeDescription: string; }
interface LegalType         { legalTypeCode: string;  legalTypeDescription: string;  }
interface InstitutionStatus { instStatusCode: string; instStatusDesc: string; instStatusParent?: string; }
interface SwiftBankEntry    { BankDirectory: SwiftBankDirectory; OfficeType: OfficeType; LegalType: LegalType; InstitutionStatus: InstitutionStatus; }
interface SwiftResponse     { httpStatus: string; timestamp: string; responseStatus: string; totalRecordFound: string; totalRecordSent: string; banks: SwiftBankEntry[]; }

/* ── IBAN types ──────────────────────────────────────── */
interface IbanBankDirectory {
  recordKey: string; officeType: string; bic8Char: string; branchBic: string;
  bankCode: string; bankName: string; bankBranchName?: string;
  streetAddress1?: string; streetAddress2?: string; city?: string;
  countryProvinceState?: string; zipCode?: string; countryName: string;
  countryCode: string; networkConnectivity?: string; serviceCodes?: string;
  iBanKey?: string; nationalIdType?: string; institutionStatus: string;
}
interface IbanBankEntry  { BankDirectory: IbanBankDirectory; OfficeType: OfficeType; LegalType: LegalType; InstitutionStatus: InstitutionStatus; }
interface IbanResponse   { httpStatus: string; timestamp: string; responseStatus: string; totalRecordFound: string; totalRecordSent: string; banks: IbanBankEntry[]; }

/* ── Routing Number types ────────────────────────────── */
interface RoutingNumberResponse {
  telephone: string; zip: string; code: number; message: string;
  record_type_code: string; office_code: string; institution_status_code: string;
  rn: string; city: string; data_view_code: string; customer_name: string;
  change_date: string; new_routing_number: string; state: string;
  address: string; routing_number: string;
}

@Component({
  selector: 'app-bank-consulta',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTabsModule,
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
        <h1>Consulta Bancária Internacional</h1>
      </div>

      <mat-tab-group animationDuration="200ms" class="bank-tabs">

        <!-- ═══════════════════ SWIFT / BIC ═══════════════════ -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">code</mat-icon>
            SWIFT / BIC
          </ng-template>

          <div class="tab-content">
            <div class="card-container">
              <form [formGroup]="swiftForm" (ngSubmit)="consultarSwift()" class="search-form">
                <div class="fields-row">
                  <mat-form-field appearance="outline" class="field-swift">
                    <mat-label>Código SWIFT / BIC</mat-label>
                    <mat-icon matPrefix>code</mat-icon>
                    <input matInput formControlName="bankcode" placeholder="Ex: RBOSGB2L"
                      maxlength="11" style="text-transform:uppercase"
                      (input)="toUpperCase($event, swiftForm, 'bankcode')">
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="field-country">
                    <mat-label>Código País (ISO)</mat-label>
                    <mat-icon matPrefix>flag</mat-icon>
                    <input matInput formControlName="isoCountryCode" placeholder="Ex: GB"
                      maxlength="2" style="text-transform:uppercase"
                      (input)="toUpperCase($event, swiftForm, 'isoCountryCode')">
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="field-country-name">
                    <mat-label>Nome do País</mat-label>
                    <mat-icon matPrefix>public</mat-icon>
                    <input matInput formControlName="countryName" placeholder="Ex: UNITED KINGDOM"
                      style="text-transform:uppercase"
                      (input)="toUpperCase($event, swiftForm, 'countryName')">
                  </mat-form-field>

                  <button mat-flat-button color="primary" type="submit" class="btn-consultar"
                    [disabled]="swiftLoading()">
                    @if (swiftLoading()) { <mat-spinner diameter="20" class="btn-spinner"></mat-spinner> }
                    @else { <mat-icon>search</mat-icon> }
                    {{ swiftLoading() ? 'Consultando...' : 'Consultar' }}
                  </button>
                </div>
              </form>
            </div>

            @if (swiftError() && !swiftLoading()) {
              <div class="error-card">
                <mat-icon>error_outline</mat-icon>
                <div class="error-body">
                  <p class="error-title">Falha na consulta</p>
                  <p class="error-msg">{{ swiftError() }}</p>
                </div>
                <button mat-icon-button (click)="swiftError.set(null)" matTooltip="Fechar">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            }

            @if (swiftResponse() && !swiftLoading()) {
              <div class="result-wrapper">
                <div class="result-summary">
                  <div class="summary-icon primary">
                    <mat-icon>account_balance</mat-icon>
                  </div>
                  <div class="summary-info">
                    <h2 class="summary-title">Resultado da Consulta SWIFT</h2>
                    <p class="summary-sub">
                      {{ swiftResponse()!.totalRecordFound }} registro(s) encontrado(s) &bull;
                      {{ swiftResponse()!.totalRecordSent }} enviado(s) &bull;
                      {{ swiftResponse()!.timestamp }}
                    </p>
                  </div>
                  <span class="status-badge" [class.success]="swiftResponse()!.responseStatus === 'SUCCESS'">
                    <mat-icon>{{ swiftResponse()!.responseStatus === 'SUCCESS' ? 'check_circle' : 'cancel' }}</mat-icon>
                    {{ swiftResponse()!.responseStatus }}
                  </span>
                </div>

                <div class="banks-list">
                  @for (entry of swiftResponse()!.banks; track entry.BankDirectory.recordKey) {
                    <div class="bank-card">
                      <div class="bank-header primary-tint">
                        <div class="bank-avatar primary-avatar">
                          <mat-icon>{{ entry.OfficeType.officeTypeCode === 'HO' ? 'domain' : 'corporate_fare' }}</mat-icon>
                        </div>
                        <div class="bank-identity">
                          <h3 class="bank-name">{{ entry.BankDirectory.bankName }}</h3>
                          @if (entry.BankDirectory.bankBranchName) {
                            <p class="bank-branch">{{ entry.BankDirectory.bankBranchName }}</p>
                          }
                          <div class="bank-meta">
                            <span class="swift-chip">
                              <mat-icon>code</mat-icon>{{ entry.BankDirectory.bankCode }}
                            </span>
                            <span class="office-chip" [class.head]="entry.OfficeType.officeTypeCode === 'HO'">
                              {{ entry.OfficeType.officeTypeDescription }}
                            </span>
                          </div>
                        </div>
                      </div>
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
                            @if (entry.BankDirectory.bankBranchCode) {
                              <div class="detail-field">
                                <span class="d-label">Cód. Agência</span>
                                <span class="d-value mono">{{ entry.BankDirectory.bankBranchCode }}</span>
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
                                <span class="d-value">{{ entry.BankDirectory.streetAddress1 }}{{ entry.BankDirectory.streetAddress2 ? ' / ' + entry.BankDirectory.streetAddress2 : '' }}</span>
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
        </mat-tab>

        <!-- ═══════════════════ IBAN ═══════════════════════════ -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">credit_card</mat-icon>
            IBAN
          </ng-template>

          <div class="tab-content">
            <div class="card-container">
              <form [formGroup]="ibanForm" (ngSubmit)="consultarIban()" class="search-form">
                <div class="fields-row">
                  <mat-form-field appearance="outline" class="field-iban">
                    <mat-label>IBAN</mat-label>
                    <mat-icon matPrefix>credit_card</mat-icon>
                    <input matInput formControlName="iBanValue"
                      placeholder="Ex: AL35202111090000000001234567"
                      maxlength="34"
                      style="text-transform:uppercase; font-family: monospace; letter-spacing: 1px"
                      (input)="ibanMask($event)">
                    @if (ibanForm.get('iBanValue')?.hasError('required') && ibanForm.get('iBanValue')?.touched) {
                      <mat-error>IBAN é obrigatório</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="field-country">
                    <mat-label>Código País (ISO)</mat-label>
                    <mat-icon matPrefix>flag</mat-icon>
                    <input matInput formControlName="isoCountryCode" placeholder="Ex: AL"
                      maxlength="2" style="text-transform:uppercase"
                      (input)="toUpperCase($event, ibanForm, 'isoCountryCode')">
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="field-country-name">
                    <mat-label>Nome do País</mat-label>
                    <mat-icon matPrefix>public</mat-icon>
                    <input matInput formControlName="countryName" placeholder="Ex: Albania">
                  </mat-form-field>

                  <button mat-flat-button color="primary" type="submit" class="btn-consultar"
                    [disabled]="ibanForm.invalid || ibanLoading()">
                    @if (ibanLoading()) { <mat-spinner diameter="20" class="btn-spinner"></mat-spinner> }
                    @else { <mat-icon>search</mat-icon> }
                    {{ ibanLoading() ? 'Consultando...' : 'Consultar' }}
                  </button>
                </div>
              </form>
            </div>

            @if (ibanError() && !ibanLoading()) {
              <div class="error-card">
                <mat-icon>error_outline</mat-icon>
                <div class="error-body">
                  <p class="error-title">Falha na consulta</p>
                  <p class="error-msg">{{ ibanError() }}</p>
                </div>
                <button mat-icon-button (click)="ibanError.set(null)" matTooltip="Fechar">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            }

            @if (ibanResponse() && !ibanLoading()) {
              <div class="result-wrapper">
                <div class="result-summary">
                  <div class="summary-icon teal">
                    <mat-icon>credit_card</mat-icon>
                  </div>
                  <div class="summary-info">
                    <h2 class="summary-title">Resultado da Consulta IBAN</h2>
                    <p class="summary-sub">
                      {{ ibanResponse()!.totalRecordFound }} registro(s) encontrado(s) &bull;
                      {{ ibanResponse()!.totalRecordSent }} enviado(s) &bull;
                      {{ ibanResponse()!.timestamp }}
                    </p>
                  </div>
                  <span class="status-badge" [class.success]="ibanResponse()!.responseStatus === 'SUCCESS'">
                    <mat-icon>{{ ibanResponse()!.responseStatus === 'SUCCESS' ? 'check_circle' : 'cancel' }}</mat-icon>
                    {{ ibanResponse()!.responseStatus }}
                  </span>
                </div>

                <div class="banks-list">
                  @for (entry of ibanResponse()!.banks; track entry.BankDirectory.recordKey) {
                    <div class="bank-card">
                      <div class="bank-header teal-tint">
                        <div class="bank-avatar teal-avatar">
                          <mat-icon>{{ entry.OfficeType.officeTypeCode === 'HO' ? 'domain' : 'corporate_fare' }}</mat-icon>
                        </div>
                        <div class="bank-identity">
                          <h3 class="bank-name">{{ entry.BankDirectory.bankName }}</h3>
                          @if (entry.BankDirectory.bankBranchName) {
                            <p class="bank-branch">{{ entry.BankDirectory.bankBranchName }}</p>
                          }
                          <div class="bank-meta">
                            <span class="swift-chip">
                              <mat-icon>code</mat-icon>{{ entry.BankDirectory.bankCode }}
                            </span>
                            @if (entry.BankDirectory.iBanKey) {
                              <span class="iban-chip">
                                <mat-icon>credit_card</mat-icon>{{ entry.BankDirectory.iBanKey }}
                              </span>
                            }
                            <span class="office-chip" [class.head]="entry.OfficeType.officeTypeCode === 'HO'">
                              {{ entry.OfficeType.officeTypeDescription }}
                            </span>
                          </div>
                        </div>
                      </div>
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
                                <span class="d-value">{{ entry.BankDirectory.streetAddress1 }}{{ entry.BankDirectory.streetAddress2 ? ' / ' + entry.BankDirectory.streetAddress2 : '' }}</span>
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
        </mat-tab>

        <!-- ═══════════════════ ROUTING NUMBER ════════════════ -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">route</mat-icon>
            Routing Number
          </ng-template>

          <div class="tab-content">
            <div class="card-container">
              <form [formGroup]="rnForm" (ngSubmit)="consultarRn()" class="search-form">
                <div class="fields-row">
                  <mat-form-field appearance="outline" class="field-rn">
                    <mat-label>Routing Number (ABA)</mat-label>
                    <mat-icon matPrefix>account_balance</mat-icon>
                    <input matInput formControlName="number" placeholder="Ex: 021000021"
                      maxlength="9" style="font-family: monospace; letter-spacing: 2px"
                      (input)="onlyDigits($event)">
                    @if (rnForm.get('number')?.hasError('required') && rnForm.get('number')?.touched) {
                      <mat-error>Routing Number é obrigatório</mat-error>
                    }
                    @if (rnForm.get('number')?.hasError('pattern') && rnForm.get('number')?.touched) {
                      <mat-error>Deve conter exatamente 9 dígitos numéricos</mat-error>
                    }
                  </mat-form-field>

                  <button mat-flat-button color="primary" type="submit" class="btn-consultar"
                    [disabled]="rnForm.invalid || rnLoading()">
                    @if (rnLoading()) { <mat-spinner diameter="20" class="btn-spinner"></mat-spinner> }
                    @else { <mat-icon>search</mat-icon> }
                    {{ rnLoading() ? 'Consultando...' : 'Consultar' }}
                  </button>
                </div>
              </form>
            </div>

            @if (rnError() && !rnLoading()) {
              <div class="error-card">
                <mat-icon>error_outline</mat-icon>
                <div class="error-body">
                  <p class="error-title">Falha na consulta</p>
                  <p class="error-msg">{{ rnError() }}</p>
                </div>
                <button mat-icon-button (click)="rnError.set(null)" matTooltip="Fechar">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            }

            @if (rnResult() && !rnLoading()) {
              <div class="result-wrapper">
                <div class="result-summary">
                  <div class="summary-icon indigo">
                    <mat-icon>account_balance</mat-icon>
                  </div>
                  <div class="summary-info">
                    <h2 class="summary-title">{{ rnResult()!.customer_name }}</h2>
                    <p class="summary-sub">
                      Routing Number: <span class="mono">{{ rnResult()!.routing_number }}</span>
                      &bull; {{ rnResult()!.city }}, {{ rnResult()!.state }}
                    </p>
                  </div>
                  <span class="status-badge" [class.success]="rnResult()!.code === 200">
                    <mat-icon>{{ rnResult()!.code === 200 ? 'check_circle' : 'cancel' }}</mat-icon>
                    {{ rnResult()!.code === 200 ? 'Encontrado' : 'Não encontrado' }}
                  </span>
                </div>

                <div class="detail-card">
                  <div class="detail-section">
                    <p class="section-label">Identificação</p>
                    <div class="detail-grid">
                      <div class="detail-field">
                        <span class="d-label">Routing Number</span>
                        <span class="d-value mono">{{ rnResult()!.routing_number || rnResult()!.rn }}</span>
                      </div>
                      @if (rnResult()!.new_routing_number) {
                        <div class="detail-field">
                          <span class="d-label">Novo Routing Number</span>
                          <span class="d-value mono">{{ rnResult()!.new_routing_number }}</span>
                        </div>
                      }
                      <div class="detail-field">
                        <span class="d-label">Cód. Tipo de Registro</span>
                        <span class="d-value mono">{{ rnResult()!.record_type_code }}</span>
                      </div>
                      <div class="detail-field">
                        <span class="d-label">Cód. Escritório</span>
                        <span class="d-value mono">{{ rnResult()!.office_code }}</span>
                      </div>
                      <div class="detail-field">
                        <span class="d-label">Status Institucional</span>
                        <span class="d-value mono">{{ rnResult()!.institution_status_code }}</span>
                      </div>
                      @if (rnResult()!.data_view_code) {
                        <div class="detail-field">
                          <span class="d-label">Data View Code</span>
                          <span class="d-value mono">{{ rnResult()!.data_view_code }}</span>
                        </div>
                      }
                    </div>
                  </div>

                  <div class="detail-section">
                    <p class="section-label">Endereço</p>
                    <div class="detail-grid">
                      @if (rnResult()!.address) {
                        <div class="detail-field full">
                          <span class="d-label">Logradouro</span>
                          <span class="d-value">{{ rnResult()!.address }}</span>
                        </div>
                      }
                      @if (rnResult()!.city) {
                        <div class="detail-field">
                          <span class="d-label">Cidade</span>
                          <span class="d-value">{{ rnResult()!.city }}</span>
                        </div>
                      }
                      @if (rnResult()!.state) {
                        <div class="detail-field">
                          <span class="d-label">Estado</span>
                          <span class="d-value">{{ rnResult()!.state }}</span>
                        </div>
                      }
                      @if (rnResult()!.zip) {
                        <div class="detail-field">
                          <span class="d-label">ZIP Code</span>
                          <span class="d-value mono">{{ rnResult()!.zip }}</span>
                        </div>
                      }
                      @if (rnResult()!.telephone) {
                        <div class="detail-field">
                          <span class="d-label">Telefone</span>
                          <span class="d-value">{{ rnResult()!.telephone }}</span>
                        </div>
                      }
                    </div>
                  </div>

                  @if (rnResult()!.change_date) {
                    <div class="detail-section">
                      <p class="section-label">Atualização</p>
                      <div class="detail-grid">
                        <div class="detail-field">
                          <span class="d-label">Data de Alteração</span>
                          <span class="d-value mono">{{ rnResult()!.change_date }}</span>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </mat-tab>

      </mat-tab-group>
    </div>
  `,
  styles: [`
    /* Tabs */
    .bank-tabs {
      margin-top: 8px;
    }

    .tab-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      margin-right: 6px;
      vertical-align: middle;
    }

    .tab-content {
      padding: 24px 0 0;
    }

    /* Form */
    .search-form { width: 100%; }

    .fields-row {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      flex-wrap: wrap;
    }

    .field-swift        { flex: 0 0 200px; }
    .field-country      { flex: 0 0 160px; }
    .field-country-name { flex: 1 1 220px; }
    .field-iban         { flex: 1 1 280px; }
    .field-rn           { flex: 1 1 280px; max-width: 360px; }

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
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      mat-icon { font-size: 26px; width: 26px; height: 26px; }

      &.primary { background: rgba(61,90,254,0.12); color: var(--primary-dark, #3d5afe); }
      &.teal    { background: rgba(0,150,136,0.12);  color: #00897b; }
      &.indigo  { background: rgba(63,81,181,0.12);  color: #3f51b5; }
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

    /* Lista de bancos */
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

    .bank-header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 18px 24px 14px;
      border-bottom: 1px solid var(--border);

      &.primary-tint { background: rgba(61,90,254,0.03); }
      &.teal-tint    { background: rgba(0,150,136,0.03); }
    }

    .bank-avatar {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      mat-icon { font-size: 22px; width: 22px; height: 22px; }

      &.primary-avatar { background: rgba(61,90,254,0.12); color: var(--primary-dark, #3d5afe); }
      &.teal-avatar    { background: rgba(0,150,136,0.12);  color: #00897b; }
    }

    .bank-identity { flex: 1; }
    .bank-name     { font-size: 15px; font-weight: 700; color: var(--text); margin-bottom: 3px; }
    .bank-branch   { font-size: 12px; color: var(--text-sec); margin-bottom: 8px; }

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

    .bank-body {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0;
    }

    .detail-group {
      padding: 16px 20px;
      border-right: 1px solid var(--border);
      &:last-child { border-right: none; }
    }

    .group-label, .section-label {
      font-size: 10px !important;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--body-label) !important;
      margin-bottom: 12px;
    }

    .section-label { margin-bottom: 14px; }

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

    .mono {
      font-family: 'Consolas', 'Monaco', monospace;
      font-weight: 700;
    }

    /* Routing Number detail card */
    .detail-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 0 0 14px 14px;
      display: flex;
      flex-wrap: wrap;
      overflow: hidden;
    }

    .detail-section {
      flex: 1 1 300px;
      padding: 20px 24px;
      border-right: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
      &:last-child { border-right: none; }
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
      .field-swift, .field-country, .field-country-name,
      .field-iban, .field-rn { flex: 1 1 100%; max-width: 100%; }
      .btn-consultar { width: 100%; justify-content: center; margin-top: 0; }
      .detail-section { flex: 1 1 100%; border-right: none; }
      .detail-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class BankConsultaComponent {
  private swiftService = inject(ConveraSwiftService);
  private ibanService  = inject(ConveraIbanService);
  private rnService    = inject(RoutingNumberService);

  /* ── SWIFT state ── */
  swiftLoading  = signal(false);
  swiftError    = signal<string | null>(null);
  swiftResponse = signal<SwiftResponse | null>(null);

  swiftForm = new FormGroup({
    bankcode:       new FormControl(''),
    isoCountryCode: new FormControl(''),
    countryName:    new FormControl(''),
  });

  /* ── IBAN state ── */
  ibanLoading  = signal(false);
  ibanError    = signal<string | null>(null);
  ibanResponse = signal<IbanResponse | null>(null);

  ibanForm = new FormGroup({
    iBanValue:      new FormControl('', [Validators.required]),
    isoCountryCode: new FormControl(''),
    countryName:    new FormControl(''),
  });

  /* ── Routing Number state ── */
  rnLoading = signal(false);
  rnError   = signal<string | null>(null);
  rnResult  = signal<RoutingNumberResponse | null>(null);

  rnForm = new FormGroup({
    number: new FormControl('', [Validators.required, Validators.pattern(/^\d{9}$/)]),
  });

  /* ── Helpers ── */
  toUpperCase(event: Event, form: FormGroup, controlName: string) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.toUpperCase();
    form.get(controlName)!.setValue(input.value, { emitEvent: false });
  }

  ibanMask(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 34);
    this.ibanForm.get('iBanValue')!.setValue(input.value, { emitEvent: false });
  }

  onlyDigits(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/\D/g, '').slice(0, 9);
    this.rnForm.get('number')!.setValue(input.value, { emitEvent: false });
  }

  /* ── Ações ── */
  consultarSwift() {
    if (this.swiftLoading()) return;
    this.swiftLoading.set(true);
    this.swiftError.set(null);
    this.swiftResponse.set(null);

    const v = this.swiftForm.value;
    this.swiftService.search({
      bankcode:       v.bankcode || undefined,
      isoCountryCode: v.isoCountryCode || undefined,
      countryName:    v.countryName || undefined,
      page_size: 100, page_number: 1,
    }).subscribe({
      next: (data: SwiftResponse) => { this.swiftResponse.set(data); this.swiftLoading.set(false); },
      error: (err) => {
        this.swiftError.set(err?.error?.message ?? err?.error?.mensagem ?? 'Não foi possível realizar a consulta SWIFT.');
        this.swiftLoading.set(false);
      },
    });
  }

  consultarIban() {
    if (this.ibanForm.invalid || this.ibanLoading()) return;
    this.ibanLoading.set(true);
    this.ibanError.set(null);
    this.ibanResponse.set(null);

    const v = this.ibanForm.value;
    this.ibanService.search({
      iBanValue:      v.iBanValue || undefined,
      isoCountryCode: v.isoCountryCode || undefined,
      countryName:    v.countryName || undefined,
      pageSize: 100, pageNumber: 1,
    }).subscribe({
      next: (data: IbanResponse) => { this.ibanResponse.set(data); this.ibanLoading.set(false); },
      error: (err) => {
        this.ibanError.set(err?.error?.message ?? err?.error?.mensagem ?? 'Não foi possível realizar a consulta IBAN.');
        this.ibanLoading.set(false);
      },
    });
  }

  consultarRn() {
    if (this.rnForm.invalid || this.rnLoading()) return;
    this.rnLoading.set(true);
    this.rnError.set(null);
    this.rnResult.set(null);

    this.rnService.get(this.rnForm.value.number!).subscribe({
      next: (data: RoutingNumberResponse) => {
        if (data.code !== 200) {
          this.rnError.set(data.message || 'Routing Number não encontrado.');
        } else {
          this.rnResult.set(data);
        }
        this.rnLoading.set(false);
      },
      error: (err) => {
        this.rnError.set(err?.error?.message ?? err?.error?.mensagem ?? 'Não foi possível realizar a consulta.');
        this.rnLoading.set(false);
      },
    });
  }
}
