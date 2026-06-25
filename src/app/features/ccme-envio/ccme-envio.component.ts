import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  CcmeService, CcmePayer, CcmeRecipient, CcmeCurrency,
  CcmePaymentOrder, CcmePosting, CcmeAccountBalance, CcmePaymentOrderLog
} from '../../core/services/ccme.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-ccme-envio',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTabsModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressSpinnerModule, MatTooltipModule, MatSnackBarModule,
  ],
  template: `
  <div class="page-wrapper">

    <!-- ── Cabeçalho ──────────────────────────────────────────────────── -->
    <div class="page-header">
      <div class="header-icon-wrap">
        <mat-icon class="header-icon">currency_exchange</mat-icon>
      </div>
      <div>
        <h1>CCME — Câmbio Manual Externo</h1>
        <p class="subtitle">Gestão de pagamentos internacionais · Ordens · Beneficiários · Lançamentos</p>
      </div>
      <button mat-icon-button class="reload-btn" (click)="loadAll()" [disabled]="loading()" matTooltip="Recarregar">
        <mat-icon [class.spinning]="loading()">refresh</mat-icon>
      </button>
    </div>

    <!-- ── Tabs ───────────────────────────────────────────────────────── -->
    <mat-tab-group class="ccme-tabs" animationDuration="180ms">

      <!-- ══ ORDENS ═══════════════════════════════════════════════════ -->
      <mat-tab>
        <ng-template mat-tab-label>
          <mat-icon class="tab-icon">receipt_long</mat-icon> Ordens
        </ng-template>
        <div class="tab-body">
          <div class="split-layout">

            <!-- Formulário nova ordem -->
            <div class="card form-card">
              <div class="card-head">
                <mat-icon class="card-icon">add_circle</mat-icon>
                <span>Nova Ordem</span>
              </div>
              <form [formGroup]="orderForm" (ngSubmit)="submitOrder()" class="form-body">

                <div class="section-label"><mat-icon>event</mat-icon> Data & Valor</div>
                <div class="form-row">
                  <mat-form-field appearance="outline" class="field-md">
                    <mat-label>Data Valor</mat-label>
                    <input matInput type="date" formControlName="valueDate">
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="field-md">
                    <mat-label>Valor</mat-label>
                    <input matInput type="number" step="0.01" formControlName="value" placeholder="0.00">
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="field-sm">
                    <mat-label>Moeda</mat-label>
                    <mat-select formControlName="currencyCode">
                      @for (c of currencies(); track c.code) {
                        <mat-option [value]="c.code">{{ c.code }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="field-sm">
                    <mat-label>Encargos</mat-label>
                    <mat-select formControlName="charges">
                      <mat-option value="OUR">OUR</mat-option>
                      <mat-option value="SHA">SHA</mat-option>
                      <mat-option value="BEN">BEN</mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>

                <div class="section-label"><mat-icon>people</mat-icon> Partes</div>
                <div class="form-row">
                  <mat-form-field appearance="outline" class="field-full">
                    <mat-label>Pagador</mat-label>
                    <mat-select formControlName="payerId">
                      @for (p of payers(); track p.id) {
                        <mat-option [value]="p.id">{{ p.socialName }} — {{ p.cpfCnpj }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="field-full">
                    <mat-label>Beneficiário</mat-label>
                    <mat-select formControlName="recipientId">
                      @for (r of recipients(); track r.id) {
                        <mat-option [value]="r.id">{{ r.socialName }} — {{ r.country }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                </div>

                <div class="section-label"><mat-icon>description</mat-icon> Documentação</div>
                <div class="form-row">
                  <mat-form-field appearance="outline" class="field-md">
                    <mat-label>Invoice</mat-label>
                    <input matInput formControlName="invoice">
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="field-lg">
                    <mat-label>Finalidade</mat-label>
                    <input matInput formControlName="reason">
                  </mat-form-field>
                </div>

                <button mat-flat-button class="btn-primary" type="submit" [disabled]="orderForm.invalid || loading()">
                  @if (loading()) { <mat-spinner diameter="16"></mat-spinner> }
                  @else { <mat-icon>send</mat-icon> }
                  Criar Ordem
                </button>
              </form>
            </div>

            <!-- Lista de ordens -->
            <div class="card list-card">
              <div class="card-head">
                <mat-icon class="card-icon">list_alt</mat-icon>
                <span>Ordens Recentes</span>
              </div>

              @if (orders().length === 0 && !loading()) {
                <div class="empty-state">
                  <mat-icon>inbox</mat-icon>
                  <p>Nenhuma ordem encontrada</p>
                </div>
              }

              <div class="order-list">
                @for (o of orders(); track o.id) {
                  <div class="order-item" [class.expanded]="selectedOrder()?.id === o.id" (click)="toggleOrder(o)">
                    <div class="order-main">
                      <div class="order-left">
                        <div class="order-code">{{ o.code }}</div>
                        <div class="order-meta">
                          {{ o.payerName }} → {{ o.recipientName }}
                          · {{ o.valueDate | date:'dd/MM/yy' }}
                        </div>
                      </div>
                      <div class="order-right">
                        <span class="order-value">{{ o.currencyCode }} {{ o.value | number:'1.2-2' }}</span>
                        <span class="chip-status" [class]="'chip-' + (o.status ?? '').toLowerCase()">{{ o.status }}</span>
                        <div class="order-actions">
                          @if (o.status === 'PENDING') {
                            <button mat-icon-button class="act-btn act-confirm" (click)="transition($event, o, 'confirm')" matTooltip="Confirmar">
                              <mat-icon>check_circle</mat-icon>
                            </button>
                          }
                          @if (o.status === 'CONFIRMED') {
                            <button mat-icon-button class="act-btn act-release" (click)="transition($event, o, 'release')" matTooltip="Liberar">
                              <mat-icon>lock_open</mat-icon>
                            </button>
                          }
                          @if (o.status === 'RELEASED') {
                            <button mat-icon-button class="act-btn act-approve" (click)="transition($event, o, 'approve')" matTooltip="Aprovar">
                              <mat-icon>verified</mat-icon>
                            </button>
                          }
                          @if (!['SENT','RETURNED','CANCELED'].includes(o.status ?? '')) {
                            <button mat-icon-button class="act-btn act-cancel" (click)="transition($event, o, 'cancel')" matTooltip="Cancelar">
                              <mat-icon>cancel</mat-icon>
                            </button>
                          }
                        </div>
                      </div>
                    </div>

                    @if (selectedOrder()?.id === o.id && orderLog().length > 0) {
                      <div class="order-log">
                        <div class="log-title"><mat-icon>history</mat-icon> Log da Ordem</div>
                        @for (l of orderLog(); track l.id) {
                          <div class="log-item">
                            <span class="log-date">{{ l.createdAt | date:'dd/MM HH:mm' }}</span>
                            <span class="log-action">{{ l.action }}</span>
                            <span class="chip-status" [class]="'chip-' + (l.status ?? '').toLowerCase()">{{ l.status }}</span>
                            @if (l.user) { <span class="log-user">{{ l.user }}</span> }
                          </div>
                        }
                      </div>
                    }
                  </div>
                }
              </div>
            </div>

          </div>
        </div>
      </mat-tab>

      <!-- ══ PAGADORES ════════════════════════════════════════════════ -->
      <mat-tab>
        <ng-template mat-tab-label>
          <mat-icon class="tab-icon">person</mat-icon> Pagadores
        </ng-template>
        <div class="tab-body">
          <div class="split-layout">

            <div class="card form-card">
              <div class="card-head">
                <mat-icon class="card-icon">{{ editingPayer() ? 'edit' : 'person_add' }}</mat-icon>
                <span>{{ editingPayer() ? 'Editar Pagador' : 'Novo Pagador' }}</span>
              </div>
              <form [formGroup]="payerForm" (ngSubmit)="submitPayer()" class="form-body">
                <div class="form-row">
                  <mat-form-field appearance="outline" class="field-full">
                    <mat-label>Razão Social *</mat-label>
                    <input matInput formControlName="socialName">
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="field-md">
                    <mat-label>CPF / CNPJ *</mat-label>
                    <input matInput formControlName="cpfCnpj">
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="field-sm">
                    <mat-label>Situação</mat-label>
                    <mat-select formControlName="situation">
                      <mat-option value="Active">Ativo</mat-option>
                      <mat-option value="Inactive">Inativo</mat-option>
                      <mat-option value="Blocked">Bloqueado</mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>
                <div class="section-label"><mat-icon>place</mat-icon> Endereço</div>
                <div class="form-row">
                  <mat-form-field appearance="outline" class="field-full">
                    <mat-label>Endereço</mat-label>
                    <input matInput formControlName="address">
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="field-md">
                    <mat-label>Cidade</mat-label>
                    <input matInput formControlName="city">
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="field-sm">
                    <mat-label>Estado</mat-label>
                    <input matInput formControlName="state">
                  </mat-form-field>
                </div>
                <div class="btn-row">
                  <button mat-flat-button class="btn-primary" type="submit" [disabled]="payerForm.invalid">
                    <mat-icon>save</mat-icon> Salvar
                  </button>
                  @if (editingPayer()) {
                    <button mat-stroked-button type="button" class="btn-ghost"
                      (click)="editingPayer.set(null); payerForm.reset({ situation: 'Active' })">
                      Cancelar
                    </button>
                  }
                </div>
              </form>
            </div>

            <div class="card list-card">
              <div class="card-head">
                <mat-icon class="card-icon">group</mat-icon>
                <span>Pagadores Cadastrados</span>
              </div>
              @if (payers().length === 0) {
                <div class="empty-state"><mat-icon>person_off</mat-icon><p>Nenhum pagador</p></div>
              }
              <div class="entity-list">
                @for (p of payers(); track p.id) {
                  <div class="entity-item">
                    <div class="entity-avatar">{{ p.socialName.charAt(0).toUpperCase() }}</div>
                    <div class="entity-info">
                      <div class="entity-name">{{ p.socialName }}</div>
                      <div class="entity-sub">{{ p.cpfCnpj }} · {{ p.city }}{{ p.state ? '/' + p.state : '' }}</div>
                    </div>
                    <span class="situation-badge" [class]="'sit-' + (p.situation ?? '').toLowerCase()">{{ p.situation }}</span>
                    <div class="entity-acts">
                      <button mat-icon-button class="act-btn act-edit" (click)="editPayer(p)" matTooltip="Editar"><mat-icon>edit</mat-icon></button>
                      <button mat-icon-button class="act-btn act-delete" (click)="deletePayer(p.id!)" matTooltip="Excluir"><mat-icon>delete</mat-icon></button>
                    </div>
                  </div>
                }
              </div>
            </div>

          </div>
        </div>
      </mat-tab>

      <!-- ══ BENEFICIÁRIOS ════════════════════════════════════════════ -->
      <mat-tab>
        <ng-template mat-tab-label>
          <mat-icon class="tab-icon">account_balance</mat-icon> Beneficiários
        </ng-template>
        <div class="tab-body">
          <div class="split-layout">

            <div class="card form-card">
              <div class="card-head">
                <mat-icon class="card-icon">{{ editingRecipient() ? 'edit' : 'add_business' }}</mat-icon>
                <span>{{ editingRecipient() ? 'Editar Beneficiário' : 'Novo Beneficiário' }}</span>
              </div>
              <form [formGroup]="recipientForm" (ngSubmit)="submitRecipient()" class="form-body">
                <div class="form-row">
                  <mat-form-field appearance="outline" class="field-full">
                    <mat-label>Razão Social *</mat-label>
                    <input matInput formControlName="socialName">
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="field-md">
                    <mat-label>País *</mat-label>
                    <input matInput formControlName="country">
                  </mat-form-field>
                </div>
                <div class="section-label"><mat-icon>account_balance</mat-icon> Banco Principal</div>
                <div class="form-row">
                  <mat-form-field appearance="outline" class="field-lg">
                    <mat-label>Nome do Banco</mat-label>
                    <input matInput formControlName="bankName">
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="field-sm">
                    <mat-label>SWIFT / BIC</mat-label>
                    <input matInput formControlName="bankSwift">
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="field-md">
                    <mat-label>Conta Bancária</mat-label>
                    <input matInput formControlName="bankAccount">
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="field-md">
                    <mat-label>IBAN</mat-label>
                    <input matInput formControlName="bankIban">
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="field-sm">
                    <mat-label>ABA Routing</mat-label>
                    <input matInput formControlName="bankAba">
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="field-sm">
                    <mat-label>Sort Code</mat-label>
                    <input matInput formControlName="bankSortCode">
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="field-sm">
                    <mat-label>Branch Code</mat-label>
                    <input matInput formControlName="bankBranchCode">
                  </mat-form-field>
                </div>
                <div class="section-label"><mat-icon>swap_horiz</mat-icon> Banco Intermediário</div>
                <div class="form-row">
                  <mat-form-field appearance="outline" class="field-lg">
                    <mat-label>Banco Intermediário</mat-label>
                    <input matInput formControlName="intermediateBank">
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="field-sm">
                    <mat-label>SWIFT Intermediário</mat-label>
                    <input matInput formControlName="intermediateSwift">
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="field-md">
                    <mat-label>Conta Intermediária</mat-label>
                    <input matInput formControlName="intermediateAccount">
                  </mat-form-field>
                </div>
                <div class="btn-row">
                  <button mat-flat-button class="btn-primary" type="submit" [disabled]="recipientForm.invalid">
                    <mat-icon>save</mat-icon> Salvar
                  </button>
                  @if (editingRecipient()) {
                    <button mat-stroked-button type="button" class="btn-ghost"
                      (click)="editingRecipient.set(null); recipientForm.reset()">Cancelar</button>
                  }
                </div>
              </form>
            </div>

            <div class="card list-card">
              <div class="card-head">
                <mat-icon class="card-icon">corporate_fare</mat-icon>
                <span>Beneficiários Cadastrados</span>
              </div>
              @if (recipients().length === 0) {
                <div class="empty-state"><mat-icon>domain_disabled</mat-icon><p>Nenhum beneficiário</p></div>
              }
              <div class="entity-list">
                @for (r of recipients(); track r.id) {
                  <div class="entity-item">
                    <div class="entity-avatar bank">{{ r.country.slice(0,2).toUpperCase() }}</div>
                    <div class="entity-info">
                      <div class="entity-name">{{ r.socialName }}</div>
                      <div class="entity-sub">
                        {{ r.country }}
                        @if (r.bankSwift) { · SWIFT: {{ r.bankSwift }} }
                        @if (r.bankAccount) { · {{ r.bankAccount }} }
                      </div>
                    </div>
                    <div class="entity-acts">
                      <button mat-icon-button class="act-btn act-edit" (click)="editRecipient(r)" matTooltip="Editar"><mat-icon>edit</mat-icon></button>
                      <button mat-icon-button class="act-btn act-delete" (click)="deleteRecipient(r.id!)" matTooltip="Excluir"><mat-icon>delete</mat-icon></button>
                    </div>
                  </div>
                }
              </div>
            </div>

          </div>
        </div>
      </mat-tab>

      <!-- ══ LANÇAMENTOS ══════════════════════════════════════════════ -->
      <mat-tab>
        <ng-template mat-tab-label>
          <mat-icon class="tab-icon">swap_vert</mat-icon> Lançamentos
        </ng-template>
        <div class="tab-body">
          <div class="split-layout">

            <div class="card form-card">
              <div class="card-head">
                <mat-icon class="card-icon">add_circle</mat-icon>
                <span>Novo Lançamento</span>
              </div>
              <form [formGroup]="postingForm" (ngSubmit)="submitPosting()" class="form-body">
                <div class="form-row">
                  <mat-form-field appearance="outline" class="field-md">
                    <mat-label>Data</mat-label>
                    <input matInput type="date" formControlName="date">
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="field-md">
                    <mat-label>Valor</mat-label>
                    <input matInput type="number" step="0.01" formControlName="value">
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="field-sm">
                    <mat-label>Tipo</mat-label>
                    <mat-select formControlName="type">
                      <mat-option value="Credit">Crédito</mat-option>
                      <mat-option value="Debit">Débito</mat-option>
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="field-sm">
                    <mat-label>Moeda</mat-label>
                    <mat-select formControlName="currencyCode">
                      @for (c of currencies(); track c.code) {
                        <mat-option [value]="c.code">{{ c.code }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="field-full">
                    <mat-label>Histórico *</mat-label>
                    <input matInput formControlName="history">
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="field-full">
                    <mat-label>Referência</mat-label>
                    <input matInput formControlName="reference">
                  </mat-form-field>
                </div>
                <button mat-flat-button class="btn-primary" type="submit" [disabled]="postingForm.invalid">
                  <mat-icon>add</mat-icon> Lançar
                </button>
              </form>
            </div>

            <div class="card list-card">
              <div class="card-head">
                <mat-icon class="card-icon">receipt</mat-icon>
                <span>Extrato</span>
              </div>
              @if (postings().length === 0) {
                <div class="empty-state"><mat-icon>receipt_long</mat-icon><p>Nenhum lançamento</p></div>
              }
              <div class="posting-list">
                @for (p of postings(); track p.id) {
                  <div class="posting-item">
                    <div class="posting-type-icon" [class]="p.type === 'Credit' ? 'credit' : 'debit'">
                      <mat-icon>{{ p.type === 'Credit' ? 'arrow_downward' : 'arrow_upward' }}</mat-icon>
                    </div>
                    <div class="posting-info">
                      <div class="posting-hist">{{ p.history }}</div>
                      <div class="posting-meta">{{ p.date | date:'dd/MM/yyyy' }} @if (p.reference) { · {{ p.reference }} }</div>
                    </div>
                    <div class="posting-value" [class]="p.type === 'Credit' ? 'val-credit' : 'val-debit'">
                      {{ p.type === 'Credit' ? '+' : '-' }}{{ p.currencyCode }} {{ p.value | number:'1.2-2' }}
                    </div>
                    <button mat-icon-button class="act-btn act-delete" (click)="deletePosting(p.id!)" matTooltip="Excluir">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                }
              </div>
            </div>

          </div>
        </div>
      </mat-tab>

      <!-- ══ SALDO ═════════════════════════════════════════════════════ -->
      <mat-tab>
        <ng-template mat-tab-label>
          <mat-icon class="tab-icon">account_balance_wallet</mat-icon> Saldo
        </ng-template>
        <div class="tab-body">
          @if (balances().length === 0 && !loading()) {
            <div class="empty-state large">
              <mat-icon>account_balance_wallet</mat-icon>
              <p>Nenhum lançamento registrado</p>
            </div>
          }
          <div class="balance-grid">
            @for (b of balances(); track b.currencyCode) {
              <div class="balance-card" [class.neg]="b.balance < 0">
                <div class="bal-header">
                  <div class="bal-currency">
                    <span class="bal-code">{{ b.currencyCode }}</span>
                    <span class="bal-label">{{ currencyName(b.currencyCode) }}</span>
                  </div>
                  <mat-icon class="bal-icon">{{ b.balance >= 0 ? 'trending_up' : 'trending_down' }}</mat-icon>
                </div>
                <div class="bal-main" [class]="b.balance >= 0 ? 'positive' : 'negative'">
                  {{ b.balance | number:'1.2-2' }}
                </div>
                <div class="bal-details">
                  <div class="bal-row">
                    <span class="bal-row-label"><mat-icon>arrow_downward</mat-icon> Créditos</span>
                    <span class="bal-row-val credit">+{{ b.totalCredits | number:'1.2-2' }}</span>
                  </div>
                  <div class="bal-row">
                    <span class="bal-row-label"><mat-icon>arrow_upward</mat-icon> Débitos</span>
                    <span class="bal-row-val debit">−{{ b.totalDebits | number:'1.2-2' }}</span>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </mat-tab>

    </mat-tab-group>
  </div>
  `,
  styles: [`
    :host { display: block; }
    .page-wrapper { padding: 24px; max-width: 1400px; margin: 0 auto; }

    /* ── Header ─────────────────────────────────────────────────────── */
    .page-header {
      display: flex; align-items: center; gap: 16px;
      margin-bottom: 24px; padding-bottom: 20px;
      border-bottom: 1px solid var(--border);
    }
    .header-icon-wrap {
      display: flex; align-items: center; justify-content: center;
      width: 52px; height: 52px; border-radius: 14px;
      background: rgba(91, 140, 255, 0.14); flex-shrink: 0;
    }
    .header-icon { font-size: 28px; width: 28px; height: 28px; color: #5b8cff; }
    h1 { font-size: 20px; font-weight: 700; margin: 0 0 3px; color: var(--text); }
    .subtitle { margin: 0; font-size: 12px; color: var(--text-ter); }
    .reload-btn { margin-left: auto; color: var(--text-ter); }
    .spinning { animation: spin .9s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Tabs ───────────────────────────────────────────────────────── */
    .tab-icon { font-size: 17px; width: 17px; height: 17px; margin-right: 5px; vertical-align: middle; }
    ::ng-deep .ccme-tabs .mat-mdc-tab-header { border-bottom: 1px solid var(--border); }
    ::ng-deep .ccme-tabs .mat-mdc-tab { color: var(--text-sec) !important; }
    ::ng-deep .ccme-tabs .mdc-tab--active .mdc-tab__text-label { color: #5b8cff !important; }
    ::ng-deep .ccme-tabs .mdc-tab-indicator__content--underline { border-color: #5b8cff !important; }

    .tab-body { padding: 24px 0; }

    /* ── Layout ─────────────────────────────────────────────────────── */
    .split-layout { display: grid; grid-template-columns: 420px 1fr; gap: 20px; align-items: start; }
    @media (max-width: 1100px) { .split-layout { grid-template-columns: 1fr; } }

    /* ── Cards ──────────────────────────────────────────────────────── */
    .card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 14px; box-shadow: var(--card-shadow); overflow: hidden;
    }
    .card-head {
      display: flex; align-items: center; gap: 10px;
      padding: 14px 16px; border-bottom: 1px solid var(--border);
      font-size: 13px; font-weight: 700; color: var(--text);
    }
    .card-icon { font-size: 18px; width: 18px; height: 18px; color: #5b8cff; }

    /* ── Form ───────────────────────────────────────────────────────── */
    .form-body { padding: 16px; }
    .form-card {
      --mdc-outlined-text-field-label-text-color: var(--text-sec);
      --mdc-outlined-text-field-input-text-color: var(--text);
      --mdc-outlined-text-field-outline-color: var(--border);
      --mdc-outlined-text-field-focus-outline-color: #5b8cff;
      --mdc-outlined-text-field-focus-label-text-color: #5b8cff;
      --mdc-outlined-text-field-caret-color: #5b8cff;
    }
    ::ng-deep .form-card .mat-mdc-text-field-wrapper { background: var(--input-bg) !important; }
    ::ng-deep .form-card .mat-mdc-select-value { color: var(--text) !important; }
    ::ng-deep .form-card .mat-mdc-select-arrow { color: var(--text-ter) !important; }

    .section-label {
      display: flex; align-items: center; gap: 6px;
      font-size: 10px; font-weight: 700; color: var(--text-ter);
      text-transform: uppercase; letter-spacing: .8px;
      margin: 14px 0 8px;
    }
    .section-label mat-icon { font-size: 13px; width: 13px; height: 13px; }
    .form-row { display: flex; flex-wrap: wrap; gap: 10px; }
    .field-sm   { flex: 0 0 90px; }
    .field-md   { flex: 1 1 150px; }
    .field-lg   { flex: 1 1 200px; }
    .field-full { flex: 1 1 100%; }

    .btn-row { display: flex; gap: 10px; align-items: center; margin-top: 4px; }
    .btn-primary {
      background: #5b8cff !important; color: #fff !important;
      border-radius: 8px; font-size: 13px; font-weight: 600;
      display: flex; align-items: center; gap: 6px; height: 38px;
    }
    .btn-primary:disabled { opacity: .45; }
    .btn-primary mat-icon { font-size: 17px; width: 17px; height: 17px; }
    .btn-ghost { border-color: var(--border) !important; color: var(--text-sec) !important; border-radius: 8px; }

    /* ── Status chips ───────────────────────────────────────────────── */
    .chip-status {
      display: inline-block; padding: 2px 8px; border-radius: 6px;
      font-size: 10px; font-weight: 700; letter-spacing: .5px;
      text-transform: uppercase; border: 1px solid transparent; white-space: nowrap;
    }
    .chip-queued     { background: rgba(120,120,140,.15); color: var(--text-sec);   border-color: rgba(120,120,140,.25); }
    .chip-pending    { background: rgba(33,150,243,.14);  color: #64b5f6;           border-color: rgba(33,150,243,.3); }
    .chip-confirmed  { background: rgba(91,140,255,.15);  color: #5b8cff;           border-color: rgba(91,140,255,.3); }
    .chip-released   { background: rgba(171,71,188,.14);  color: #ce93d8;           border-color: rgba(171,71,188,.3); }
    .chip-approved   { background: rgba(112,199,60,.14);  color: #70c73c;           border-color: rgba(112,199,60,.3); }
    .chip-sent       { background: rgba(0,200,130,.14);   color: #00c882;           border-color: rgba(0,200,130,.3); }
    .chip-returned   { background: rgba(255,152,0,.14);   color: #ffb74d;           border-color: rgba(255,152,0,.3); }
    .chip-canceled   { background: rgba(239,83,80,.14);   color: #ef9a9a;           border-color: rgba(239,83,80,.25); }
    .chip-error      { background: rgba(239,83,80,.14);   color: #ef5350;           border-color: rgba(239,83,80,.3); }

    /* ── Action buttons ─────────────────────────────────────────────── */
    .act-btn { width: 30px; height: 30px; }
    .act-btn mat-icon { font-size: 17px; width: 17px; height: 17px; }
    .act-confirm mat-icon { color: #64b5f6; }
    .act-release mat-icon { color: #ce93d8; }
    .act-approve mat-icon { color: #70c73c; }
    .act-cancel  mat-icon { color: rgba(239,83,80,.7); }
    .act-edit    mat-icon { color: var(--text-ter); }
    .act-delete  mat-icon { color: rgba(239,83,80,.55); }
    .act-edit:hover mat-icon  { color: #5b8cff; }
    .act-delete:hover mat-icon { color: #ef5350; }

    /* ── Order list ─────────────────────────────────────────────────── */
    .list-card { max-height: 680px; display: flex; flex-direction: column; }
    .order-list { overflow-y: auto; flex: 1; padding: 8px; display: flex; flex-direction: column; gap: 4px; }
    .order-item {
      border: 1px solid var(--border); border-radius: 10px;
      overflow: hidden; cursor: pointer;
      transition: border-color .15s, background .15s;
    }
    .order-item:hover { border-color: rgba(91,140,255,.35); background: rgba(91,140,255,.04); }
    .order-item.expanded { border-color: rgba(91,140,255,.45); }
    .order-main {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 12px; gap: 10px;
    }
    .order-left { flex: 1; min-width: 0; }
    .order-code { font-size: 12px; font-weight: 700; color: var(--text); font-family: 'Fira Mono', monospace; }
    .order-meta { font-size: 11px; color: var(--text-ter); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .order-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
    .order-value { font-size: 13px; font-weight: 700; color: var(--text); }
    .order-actions { display: flex; }

    .order-log { padding: 10px 14px; background: rgba(0,0,0,.18); border-top: 1px solid var(--border); }
    .log-title { display: flex; align-items: center; gap: 5px; font-size: 10px; font-weight: 700; color: var(--text-ter); text-transform: uppercase; letter-spacing: .7px; margin-bottom: 8px; }
    .log-title mat-icon { font-size: 13px; width: 13px; height: 13px; }
    .log-item { display: flex; align-items: center; gap: 8px; padding: 5px 0; border-bottom: 1px solid var(--border); }
    .log-item:last-child { border-bottom: none; }
    .log-date { font-size: 11px; color: var(--text-ter); font-family: 'Fira Mono', monospace; }
    .log-action { font-size: 11px; font-weight: 600; color: var(--text-sec); min-width: 70px; }
    .log-user { font-size: 10px; color: var(--text-ter); margin-left: auto; }

    /* ── Entity list ────────────────────────────────────────────────── */
    .entity-list { padding: 8px; display: flex; flex-direction: column; gap: 4px; }
    .entity-item {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 12px; border-radius: 10px; border: 1px solid var(--border);
      transition: background .15s;
    }
    .entity-item:hover { background: var(--row-hover); }
    .entity-avatar {
      width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
      background: rgba(91,140,255,.18); color: #5b8cff;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: 800;
    }
    .entity-avatar.bank { background: rgba(33,150,243,.15); color: #64b5f6; }
    .entity-info { flex: 1; min-width: 0; }
    .entity-name { font-size: 13px; font-weight: 600; color: var(--text); }
    .entity-sub  { font-size: 11px; color: var(--text-ter); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .entity-acts { display: flex; }

    .situation-badge {
      padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 700;
      text-transform: uppercase; letter-spacing: .5px; flex-shrink: 0;
    }
    .sit-active   { background: rgba(112,199,60,.14); color: #70c73c; border: 1px solid rgba(112,199,60,.3); }
    .sit-inactive { background: rgba(120,120,140,.14); color: var(--text-sec); border: 1px solid rgba(120,120,140,.25); }
    .sit-blocked  { background: rgba(239,83,80,.14); color: #ef9a9a; border: 1px solid rgba(239,83,80,.25); }

    /* ── Posting list ───────────────────────────────────────────────── */
    .posting-list { padding: 8px; display: flex; flex-direction: column; gap: 4px; }
    .posting-item {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 12px; border-radius: 10px; border: 1px solid var(--border);
    }
    .posting-type-icon {
      width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .posting-type-icon.credit { background: rgba(0,200,130,.15); }
    .posting-type-icon.credit mat-icon { color: #00c882; font-size: 18px; width: 18px; height: 18px; }
    .posting-type-icon.debit  { background: rgba(239,83,80,.13); }
    .posting-type-icon.debit  mat-icon { color: #ef5350; font-size: 18px; width: 18px; height: 18px; }
    .posting-info { flex: 1; min-width: 0; }
    .posting-hist { font-size: 13px; font-weight: 600; color: var(--text); }
    .posting-meta { font-size: 11px; color: var(--text-ter); margin-top: 2px; }
    .posting-value { font-size: 13px; font-weight: 700; white-space: nowrap; flex-shrink: 0; }
    .val-credit { color: #00c882; }
    .val-debit  { color: #ef5350; }

    /* ── Balance cards ──────────────────────────────────────────────── */
    .balance-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
    .balance-card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 14px; padding: 20px; box-shadow: var(--card-shadow);
      transition: border-color .2s;
    }
    .balance-card:hover { border-color: rgba(91,140,255,.35); }
    .balance-card.neg { border-left: 3px solid rgba(239,83,80,.5); }
    .bal-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px; }
    .bal-code { font-size: 18px; font-weight: 800; color: var(--text); display: block; }
    .bal-label { font-size: 11px; color: var(--text-ter); display: block; margin-top: 2px; }
    .bal-icon { color: var(--text-ter); font-size: 22px; width: 22px; height: 22px; }
    .bal-main { font-size: 26px; font-weight: 800; margin-bottom: 16px; letter-spacing: -.5px; }
    .bal-main.positive { color: #70c73c; }
    .bal-main.negative { color: #ef5350; }
    .bal-details { border-top: 1px solid var(--border); padding-top: 12px; display: flex; flex-direction: column; gap: 7px; }
    .bal-row { display: flex; align-items: center; justify-content: space-between; }
    .bal-row-label { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--text-ter); }
    .bal-row-label mat-icon { font-size: 13px; width: 13px; height: 13px; }
    .bal-row-val { font-size: 13px; font-weight: 700; }
    .bal-row-val.credit { color: #00c882; }
    .bal-row-val.debit  { color: #ef5350; }

    /* ── Empty states ───────────────────────────────────────────────── */
    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      gap: 8px; padding: 40px 20px; color: var(--text-ter);
    }
    .empty-state mat-icon { font-size: 40px; width: 40px; height: 40px; opacity: .4; }
    .empty-state p { font-size: 13px; }
    .empty-state.large { padding: 80px 20px; }
    .empty-state.large mat-icon { font-size: 56px; width: 56px; height: 56px; }
  `],
})
export class CcmeEnvioComponent implements OnInit {
  private ccme = inject(CcmeService);
  private auth = inject(AuthService);
  private snack = inject(MatSnackBar);

  loading     = signal(false);
  orders      = signal<CcmePaymentOrder[]>([]);
  payers      = signal<CcmePayer[]>([]);
  recipients  = signal<CcmeRecipient[]>([]);
  currencies  = signal<CcmeCurrency[]>([]);
  postings    = signal<CcmePosting[]>([]);
  balances    = signal<CcmeAccountBalance[]>([]);
  orderLog    = signal<CcmePaymentOrderLog[]>([]);
  selectedOrder   = signal<CcmePaymentOrder | null>(null);
  editingPayer    = signal<CcmePayer | null>(null);
  editingRecipient = signal<CcmeRecipient | null>(null);

  // ── Forms ────────────────────────────────────────────────────────────
  orderForm = new FormGroup({
    valueDate:   new FormControl('', Validators.required),
    value:       new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    currencyCode: new FormControl('USD', Validators.required),
    charges:     new FormControl('OUR', Validators.required),
    payerId:     new FormControl<number | null>(null, Validators.required),
    recipientId: new FormControl<number | null>(null, Validators.required),
    invoice:     new FormControl(''),
    reason:      new FormControl(''),
  });

  payerForm = new FormGroup({
    socialName: new FormControl('', Validators.required),
    cpfCnpj:   new FormControl('', Validators.required),
    address:   new FormControl(''),
    city:      new FormControl(''),
    state:     new FormControl(''),
    situation: new FormControl('Active', Validators.required),
  });

  recipientForm = new FormGroup({
    socialName:          new FormControl('', Validators.required),
    country:             new FormControl('', Validators.required),
    bankName:            new FormControl(''),
    bankSwift:           new FormControl(''),
    bankAccount:         new FormControl(''),
    bankIban:            new FormControl(''),
    bankAba:             new FormControl(''),
    bankSortCode:        new FormControl(''),
    bankBranchCode:      new FormControl(''),
    intermediateBank:    new FormControl(''),
    intermediateSwift:   new FormControl(''),
    intermediateAccount: new FormControl(''),
  });

  postingForm = new FormGroup({
    date:         new FormControl('', Validators.required),
    value:        new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    type:         new FormControl('Debit', Validators.required),
    history:      new FormControl('', Validators.required),
    currencyCode: new FormControl('USD', Validators.required),
    reference:    new FormControl(''),
  });

  // ── Currency name lookup ─────────────────────────────────────────────
  private readonly currencyNames: Record<string, string> = {
    USD: 'US Dollar', EUR: 'Euro', GBP: 'British Pound',
    CHF: 'Swiss Franc', CAD: 'Canadian Dollar', AUD: 'Australian Dollar', JPY: 'Japanese Yen',
  };
  currencyName(code: string): string { return this.currencyNames[code] ?? code; }

  ngOnInit(): void { this.loadAll(); }

  loadAll(): void {
    this.loading.set(true);
    this.ccme.getOrders().subscribe({ next: v => this.orders.set(v), error: () => {} });
    this.ccme.getPayers().subscribe({ next: v => this.payers.set(v), error: () => {} });
    this.ccme.getRecipients().subscribe({ next: v => this.recipients.set(v), error: () => {} });
    this.ccme.getCurrencies().subscribe({ next: v => this.currencies.set(v), error: () => {} });
    this.ccme.getPostings().subscribe({ next: v => this.postings.set(v), error: () => {} });
    this.ccme.getBalance().subscribe({
      next: v => { this.balances.set(v); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  // ── Orders ───────────────────────────────────────────────────────────
  toggleOrder(o: CcmePaymentOrder): void {
    if (this.selectedOrder()?.id === o.id) {
      this.selectedOrder.set(null); this.orderLog.set([]);
    } else {
      this.selectedOrder.set(o);
      this.ccme.getOrderLog(o.id!).subscribe({ next: v => this.orderLog.set(v), error: () => {} });
    }
  }

  submitOrder(): void {
    if (this.orderForm.invalid) return;
    const v = this.orderForm.value;
    this.loading.set(true);
    this.ccme.createOrder({
      valueDate: v.valueDate!, value: v.value!, currencyCode: v.currencyCode!,
      charges: v.charges!, payerId: v.payerId!, recipientId: v.recipientId!,
      invoice: v.invoice ?? undefined, reason: v.reason ?? undefined,
      omitBrokerData: false, user: this.auth.currentUser()?.userName,
    }).subscribe({
      next: () => {
        this.snack.open('Ordem criada!', 'OK', { duration: 2500 });
        this.orderForm.reset({ currencyCode: 'USD', charges: 'OUR' });
        this.loadAll();
      },
      error: e => { this.snack.open(e?.error ?? 'Erro ao criar ordem', 'OK', { duration: 4000 }); this.loading.set(false); },
    });
  }

  transition(event: Event, o: CcmePaymentOrder, action: string): void {
    event.stopPropagation();
    const payload = { user: this.auth.currentUser()?.userName, notes: null };
    const obs: Record<string, any> = {
      confirm: this.ccme.confirmOrder(o.id!, payload),
      release: this.ccme.releaseOrder(o.id!, payload),
      approve: this.ccme.approveOrder(o.id!, payload),
      cancel:  this.ccme.cancelOrder(o.id!, payload),
    };
    obs[action]?.subscribe({
      next: () => { this.snack.open(`Ordem ${action} com sucesso`, 'OK', { duration: 2000 }); this.loadAll(); },
      error: (e: any) => this.snack.open(e?.error ?? `Erro: ${action}`, 'OK', { duration: 4000 }),
    });
  }

  // ── Payers ───────────────────────────────────────────────────────────
  submitPayer(): void {
    if (this.payerForm.invalid) return;
    const v = this.payerForm.value as CcmePayer;
    const ed = this.editingPayer();
    (ed ? this.ccme.updatePayer(ed.id!, v) : this.ccme.createPayer(v)).subscribe({
      next: () => {
        this.snack.open(ed ? 'Pagador atualizado!' : 'Pagador criado!', 'OK', { duration: 2000 });
        this.payerForm.reset({ situation: 'Active' }); this.editingPayer.set(null);
        this.ccme.getPayers().subscribe(p => this.payers.set(p));
      },
      error: () => this.snack.open('Erro ao salvar pagador', 'OK', { duration: 3000 }),
    });
  }
  editPayer(p: CcmePayer): void { this.editingPayer.set(p); this.payerForm.patchValue(p as any); }
  deletePayer(id: number): void {
    this.ccme.deletePayer(id).subscribe({
      next: () => { this.snack.open('Pagador excluído', 'OK', { duration: 2000 }); this.ccme.getPayers().subscribe(p => this.payers.set(p)); },
      error: () => this.snack.open('Erro ao excluir', 'OK', { duration: 3000 }),
    });
  }

  // ── Recipients ───────────────────────────────────────────────────────
  submitRecipient(): void {
    if (this.recipientForm.invalid) return;
    const v = this.recipientForm.value as CcmeRecipient;
    const ed = this.editingRecipient();
    (ed ? this.ccme.updateRecipient(ed.id!, v) : this.ccme.createRecipient(v)).subscribe({
      next: () => {
        this.snack.open(ed ? 'Beneficiário atualizado!' : 'Beneficiário criado!', 'OK', { duration: 2000 });
        this.recipientForm.reset(); this.editingRecipient.set(null);
        this.ccme.getRecipients().subscribe(r => this.recipients.set(r));
      },
      error: () => this.snack.open('Erro ao salvar beneficiário', 'OK', { duration: 3000 }),
    });
  }
  editRecipient(r: CcmeRecipient): void { this.editingRecipient.set(r); this.recipientForm.patchValue(r as any); }
  deleteRecipient(id: number): void {
    this.ccme.deleteRecipient(id).subscribe({
      next: () => { this.snack.open('Beneficiário excluído', 'OK', { duration: 2000 }); this.ccme.getRecipients().subscribe(r => this.recipients.set(r)); },
      error: () => this.snack.open('Erro ao excluir', 'OK', { duration: 3000 }),
    });
  }

  // ── Postings ─────────────────────────────────────────────────────────
  submitPosting(): void {
    if (this.postingForm.invalid) return;
    this.ccme.createPosting(this.postingForm.value as CcmePosting).subscribe({
      next: () => {
        this.snack.open('Lançamento criado!', 'OK', { duration: 2000 });
        this.postingForm.reset({ type: 'Debit', currencyCode: 'USD' });
        this.ccme.getPostings().subscribe(p => this.postings.set(p));
        this.ccme.getBalance().subscribe(b => this.balances.set(b));
      },
      error: () => this.snack.open('Erro ao criar lançamento', 'OK', { duration: 3000 }),
    });
  }
  deletePosting(id: number): void {
    this.ccme.deletePosting(id).subscribe({
      next: () => {
        this.snack.open('Lançamento excluído', 'OK', { duration: 2000 });
        this.ccme.getPostings().subscribe(p => this.postings.set(p));
        this.ccme.getBalance().subscribe(b => this.balances.set(b));
      },
      error: () => this.snack.open('Erro ao excluir', 'OK', { duration: 3000 }),
    });
  }
}
