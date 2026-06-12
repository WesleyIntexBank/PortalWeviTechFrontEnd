import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatChipsModule } from '@angular/material/chips';
import {
  ListaRestritivaService,
  ListaRestritivaResponse,
} from '../../core/services/lista-restritiva.service';

type SearchMode = 'documento' | 'nome';

@Component({
  selector: 'app-lista-restritiva',
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
    MatButtonToggleModule,
    MatChipsModule,
  ],
  template: `
    <div class="page-container">

      <!-- ── Cabeçalho ── -->
      <div class="page-header">
        <mat-icon>policy</mat-icon>
        <h1>Lista Restritiva</h1>
      </div>

      <!-- ── Formulário ── -->
      <div class="card-container">
        <div class="mode-toggle-row">
          <mat-button-toggle-group [value]="mode()" (change)="setMode($event.value)" aria-label="Tipo de busca">
            <mat-button-toggle value="documento">
              <mat-icon>badge</mat-icon>
              CPF / CNPJ
            </mat-button-toggle>
            <mat-button-toggle value="nome">
              <mat-icon>person_search</mat-icon>
              Nome
            </mat-button-toggle>
          </mat-button-toggle-group>
        </div>

        <form [formGroup]="form" (ngSubmit)="consultar()" class="search-form">
          <div class="fields-row">

            @if (mode() === 'documento') {
              <mat-form-field appearance="outline" class="field-main">
                <mat-label>CPF ou CNPJ</mat-label>
                <mat-icon matPrefix>badge</mat-icon>
                <input
                  matInput
                  formControlName="documento"
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  maxlength="18"
                  (input)="maskDocumento($event)"
                >
                @if (form.get('documento')?.hasError('required') && form.get('documento')?.touched) {
                  <mat-error>CPF ou CNPJ é obrigatório</mat-error>
                }
              </mat-form-field>
            } @else {
              <mat-form-field appearance="outline" class="field-main">
                <mat-label>Nome</mat-label>
                <mat-icon matPrefix>person_search</mat-icon>
                <input
                  matInput
                  formControlName="nome"
                  placeholder="Nome completo da pessoa ou empresa"
                >
                @if (form.get('nome')?.hasError('required') && form.get('nome')?.touched) {
                  <mat-error>Nome é obrigatório</mat-error>
                }
              </mat-form-field>
            }

            <button
              mat-flat-button
              color="primary"
              type="submit"
              class="btn-consultar"
              [disabled]="loading()"
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

      <!-- ── Erro ── -->
      @if (error()) {
        <div class="error-banner">
          <mat-icon>error_outline</mat-icon>
          <span>{{ error() }}</span>
        </div>
      }

      <!-- ── Resultado ── -->
      @if (result()) {
        <div class="result-wrapper">

          <!-- Sumário -->
          <div class="summary-card" [class.alerta]="encontrado()" [class.limpo]="!encontrado()">
            <div class="summary-icon-wrap">
              <mat-icon class="summary-icon">{{ encontrado() ? 'gpp_bad' : 'verified_user' }}</mat-icon>
            </div>
            <div class="summary-body">
              <p class="summary-title">{{ encontrado() ? 'Constante em Lista Restritiva' : 'Não encontrado em Lista Restritiva' }}</p>
              <p class="summary-sub">{{ encontrado() ? result()!.result.qtListado + ' ocorrência(s) encontrada(s)' : 'Nenhuma restrição identificada' }}</p>
            </div>
            <mat-chip class="summary-chip" [class.chip-alerta]="encontrado()" [class.chip-ok]="!encontrado()">
              {{ encontrado() ? 'ALERTA' : 'REGULAR' }}
            </mat-chip>
          </div>

          <!-- Cards de ocorrências -->
          @if (encontrado()) {
            <div class="ocorrencias-list">
              @for (item of result()!.result.listado; track $index) {
                <div class="ocorrencia-card">

                  <div class="ocorrencia-header">
                    <mat-icon class="oc-icon">warning</mat-icon>
                    <div class="oc-header-text">
                      <p class="oc-lista-tipo">{{ item.tbLv.deTpLista }}</p>
                      <p class="oc-nome">{{ item.tbLv.deListado }}</p>
                    </div>
                    <span class="oc-badge">Cód. {{ item.tbLv.cdListado.trim() }}</span>
                  </div>

                  <div class="oc-body">
                    @if (item.tbLv.deComplemento) {
                      <div class="oc-field full">
                        <span class="oc-label">Complemento</span>
                        <span class="oc-value">{{ item.tbLv.deComplemento }}</span>
                      </div>
                    }

                    <div class="oc-grid">
                      @if (item.tbLv.cpfCnpj) {
                        <div class="oc-field">
                          <span class="oc-label">CPF/CNPJ</span>
                          <span class="oc-value mono">{{ item.tbLv.cpfCnpj }}</span>
                        </div>
                      }

                      @if (item.tbLv.dtNascFundacao) {
                        <div class="oc-field">
                          <span class="oc-label">Data Nasc./Fundação</span>
                          <span class="oc-value">{{ item.tbLv.dtNascFundacao }}</span>
                        </div>
                      }

                      <div class="oc-field">
                        <span class="oc-label">Código da Lista</span>
                        <span class="oc-value mono">{{ item.tbLv.cdTpLista }}</span>
                      </div>

                      @if (item.tbLv.cdListaExterna) {
                        <div class="oc-field">
                          <span class="oc-label">Lista Externa</span>
                          <span class="oc-value">{{ item.tbLv.cdListaExterna }}</span>
                        </div>
                      }
                    </div>
                  </div>

                </div>
              }
            </div>
          }

        </div>
      }

    </div>
  `,
  styles: [`
    /* ─── Variáveis ──── */
    :host {
      --alerta:       #ef5350;
      --alerta-bg:    rgba(239, 83, 80, 0.10);
      --alerta-border:rgba(239, 83, 80, 0.30);
      --ok:           #66bb6a;
      --ok-bg:        rgba(102, 187, 106, 0.10);
      --ok-border:    rgba(102, 187, 106, 0.30);
    }

    /* ─── Layout ─────── */
    .page-container { display: flex; flex-direction: column; gap: 20px; }

    .page-header {
      display: flex;
      align-items: center;
      gap: 12px;
      mat-icon { font-size: 28px; width: 28px; height: 28px; color: var(--primary, #3d5afe); }
      h1 { margin: 0; font-size: 22px; font-weight: 700; color: var(--text); }
    }

    /* ─── Card do formulário ─── */
    .card-container {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px 24px;
      box-shadow: var(--card-shadow);
    }

    .mode-toggle-row {
      margin-bottom: 20px;
      mat-button-toggle-group { border-radius: 8px; }
      mat-button-toggle { font-size: 13px; font-weight: 600; }
    }

    ::ng-deep .mode-toggle-row .mat-button-toggle {
      background-color: transparent !important;
      color: var(--text, rgba(255,255,255,0.7)) !important;
    }

    ::ng-deep .mode-toggle-row .mat-button-toggle .mat-icon {
      color: var(--text, rgba(255,255,255,0.7)) !important;
    }

    ::ng-deep .mode-toggle-row .mat-button-toggle-checked {
      background-color: #70c73c !important;
      color: #000 !important;
    }

    ::ng-deep .mode-toggle-row .mat-button-toggle-checked .mat-icon {
      color: #000 !important;
    }

    .search-form { width: 100%; }

    .fields-row {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      flex-wrap: wrap;
    }

    .field-main { flex: 1 1 320px; }

    .btn-consultar {
      height: 56px;
      padding: 0 28px;
      font-size: 14px;
      font-weight: 600;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-spinner { margin-right: 4px; }

    /* ─── Erro ─── */
    .error-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 20px;
      background: rgba(239, 83, 80, 0.10);
      border: 1px solid rgba(239, 83, 80, 0.30);
      border-radius: 10px;
      color: #ef5350;
      font-size: 14px;
      mat-icon { flex-shrink: 0; }
    }

    /* ─── Resultado ─── */
    .result-wrapper { display: flex; flex-direction: column; gap: 16px; }

    /* Sumário */
    .summary-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px 24px;
      border-radius: 12px;
      border: 1px solid;
    }

    .summary-card.alerta {
      background: var(--alerta-bg);
      border-color: var(--alerta-border);
    }

    .summary-card.limpo {
      background: var(--ok-bg);
      border-color: var(--ok-border);
    }

    .summary-icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      .summary-card.alerta & { background: rgba(239, 83, 80, 0.15); }
      .summary-card.limpo & { background: rgba(102, 187, 106, 0.15); }
    }

    .summary-icon {
      font-size: 26px;
      width: 26px;
      height: 26px;
      .summary-card.alerta & { color: var(--alerta); }
      .summary-card.limpo & { color: var(--ok); }
    }

    .summary-body { flex: 1; }

    .summary-title {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      .summary-card.alerta & { color: var(--alerta); }
      .summary-card.limpo & { color: var(--ok); }
    }

    .summary-sub { margin: 4px 0 0; font-size: 13px; color: var(--text-sec); }

    .summary-chip {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.8px;
      flex-shrink: 0;
      min-height: 28px;
    }

    .chip-alerta { background: var(--alerta) !important; color: #fff !important; }
    .chip-ok     { background: var(--ok) !important; color: #fff !important; }

    /* ─── Ocorrências ─── */
    .ocorrencias-list { display: flex; flex-direction: column; gap: 12px; }

    .ocorrencia-card {
      background: var(--card);
      border: 1px solid var(--alerta-border);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: var(--card-shadow);
    }

    .ocorrencia-header {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px 20px;
      background: rgba(239, 83, 80, 0.06);
      border-bottom: 1px solid var(--alerta-border);
    }

    .oc-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
      color: var(--alerta);
      flex-shrink: 0;
    }

    .oc-header-text { flex: 1; min-width: 0; }

    .oc-lista-tipo {
      margin: 0 0 3px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: var(--alerta);
    }

    .oc-nome {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: var(--text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .oc-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 4px 10px;
      background: rgba(239, 83, 80, 0.15);
      color: var(--alerta);
      border-radius: 20px;
      flex-shrink: 0;
    }

    .oc-body { padding: 16px 20px; display: flex; flex-direction: column; gap: 12px; }

    .oc-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 20px;
    }

    .oc-field {
      display: flex;
      flex-direction: column;
      gap: 3px;
      &.full { grid-column: 1 / -1; }
    }

    .oc-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: var(--text-ter, rgba(255,255,255,0.4));
    }

    .oc-value {
      font-size: 14px;
      font-weight: 500;
      color: var(--text);
      &.mono { font-family: 'Consolas', monospace; font-size: 13px; letter-spacing: 1px; }
    }

    /* ─── Responsivo ─── */
    @media (max-width: 768px) {
      .fields-row { flex-direction: column; }
      .field-main { flex: 1 1 100%; }
      .btn-consultar { width: 100%; justify-content: center; }
      .summary-card { flex-wrap: wrap; }
      .oc-grid { grid-template-columns: 1fr; }
      .ocorrencia-header { flex-wrap: wrap; }
    }
  `]
})
export class ListaRestritivaComponent {
  private service = inject(ListaRestritivaService);

  mode    = signal<SearchMode>('documento');
  loading = signal(false);
  error   = signal<string | null>(null);
  result  = signal<ListaRestritivaResponse | null>(null);

  form = new FormGroup({
    documento: new FormControl(''),
    nome:      new FormControl(''),
  });

  setMode(m: SearchMode) {
    this.mode.set(m);
    this.form.reset();
    this.result.set(null);
    this.error.set(null);
  }

  maskDocumento(event: Event) {
    const input = event.target as HTMLInputElement;
    let v = input.value.replace(/\D/g, '');
    if (v.length <= 11) {
      if (v.length > 9)      v = `${v.slice(0,3)}.${v.slice(3,6)}.${v.slice(6,9)}-${v.slice(9)}`;
      else if (v.length > 6) v = `${v.slice(0,3)}.${v.slice(3,6)}.${v.slice(6)}`;
      else if (v.length > 3) v = `${v.slice(0,3)}.${v.slice(3)}`;
    } else {
      v = v.slice(0, 14);
      if (v.length > 12)      v = `${v.slice(0,2)}.${v.slice(2,5)}.${v.slice(5,8)}/${v.slice(8,12)}-${v.slice(12)}`;
      else if (v.length > 8)  v = `${v.slice(0,2)}.${v.slice(2,5)}.${v.slice(5,8)}/${v.slice(8)}`;
      else if (v.length > 5)  v = `${v.slice(0,2)}.${v.slice(2,5)}.${v.slice(5)}`;
      else if (v.length > 2)  v = `${v.slice(0,2)}.${v.slice(2)}`;
    }
    this.form.get('documento')!.setValue(v, { emitEvent: false });
    input.value = v;
  }

  consultar() {
    if (this.loading()) return;

    const docRaw  = (this.form.value.documento ?? '').replace(/\D/g, '');
    const nomeRaw = (this.form.value.nome ?? '').trim();

    if (this.mode() === 'documento' && !docRaw) {
      this.form.get('documento')!.markAsTouched();
      return;
    }
    if (this.mode() === 'nome' && !nomeRaw) {
      this.form.get('nome')!.markAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.result.set(null);

    const body = {
      CPF_CNPJ: this.mode() === 'documento' ? docRaw : '',
      NOME:     this.mode() === 'nome' ? nomeRaw : '',
      PESQUISA: this.mode() === 'nome' ? 1 : 0,
    };

    this.service.consultar(body).subscribe({
      next: (data) => {
        this.result.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        const msg =
          err?.error?.message ??
          err?.error?.mensagem ??
          'Não foi possível realizar a consulta. Tente novamente.';
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }

  encontrado(): boolean {
    const qt = parseInt(this.result()?.result?.qtListado ?? '0', 10);
    return qt > 0;
  }
}
