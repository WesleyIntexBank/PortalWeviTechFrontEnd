import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  BalancoPatrimonialService,
  BalancoResponse,
  CompanyBalance,
} from '../../core/services/balanco-patrimonial.service';

@Component({
  selector: 'app-balanco-patrimonial',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  template: `
    <div class="page-container">

      <!-- Cabeçalho -->
      <div class="page-header">
        <mat-icon>balance</mat-icon>
        <h1>Balanço Patrimonial</h1>
      </div>

      <!-- Upload -->
      <div class="card-container">
        <p class="card-label">Selecione o PDF do Balanço Patrimonial para extração dos dados</p>

        <div
          class="drop-zone"
          [class.drop-zone--active]="isDragging()"
          [class.drop-zone--selected]="!!fileName()"
          (dragover)="onDragOver($event)"
          (dragleave)="isDragging.set(false)"
          (drop)="onDrop($event)"
          (click)="fileInput.click()"
        >
          <input
            #fileInput
            type="file"
            accept=".pdf"
            class="hidden-input"
            (change)="onFileChange($event)"
          >

          @if (fileName()) {
            <mat-icon class="dz-icon dz-icon--ok">picture_as_pdf</mat-icon>
            <p class="dz-text">{{ fileName() }}</p>
            <p class="dz-sub">Clique para trocar o arquivo</p>
          } @else {
            <mat-icon class="dz-icon">upload_file</mat-icon>
            <p class="dz-text">Arraste o PDF aqui ou clique para selecionar</p>
            <p class="dz-sub">Somente arquivos .pdf</p>
          }
        </div>

        <button
          mat-flat-button
          color="primary"
          class="btn-extrair"
          [disabled]="!fileName() || loading()"
          (click)="extrair()"
        >
          @if (loading()) {
            <mat-spinner diameter="20" class="btn-spinner"></mat-spinner>
          } @else {
            <mat-icon>document_scanner</mat-icon>
          }
          {{ loading() ? 'Extraindo...' : 'Extrair Dados' }}
        </button>
      </div>

      <!-- Erro -->
      @if (error()) {
        <div class="error-banner">
          <mat-icon>error_outline</mat-icon>
          <span>{{ error() }}</span>
        </div>
      }

      <!-- Resultado -->
      @if (result()) {
        <div class="result-section">

          <!-- Dados da empresa -->
          <div class="company-card">
            <div class="company-header">
              <mat-icon>business</mat-icon>
              <div>
                <p class="company-name">{{ result()!.company.companyName }}</p>
                <p class="company-sub">CNPJ: {{ result()!.company.cnpj }}</p>
              </div>
            </div>
            <div class="company-meta">
              <div class="meta-item">
                <span class="meta-label">Período</span>
                <span class="meta-value">{{ result()!.company.date }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Livro Nº</span>
                <span class="meta-value">{{ result()!.company.bookOrderNumber }}</span>
              </div>
            </div>
          </div>

          <!-- Tabela de saldos -->
          <div class="table-card">
            <div class="table-header-row">
              <mat-icon>table_chart</mat-icon>
              <h2>Demonstrativo de Saldos</h2>
              <button mat-icon-button (click)="exportCsv()" matTooltip="Exportar CSV">
                <mat-icon>download</mat-icon>
              </button>
            </div>

            <div class="table-scroll">
              <table class="balance-table">
                <thead>
                  <tr>
                    <th class="col-desc">Descrição</th>
                    <th class="col-val">Saldo Inicial</th>
                    <th class="col-val">Saldo Final</th>
                    <th class="col-var">Variação</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of result()!.companyBalance; track $index) {
                    <tr [class]="rowClass(item)">
                      <td class="col-desc" [style.padding-left.px]="indentPx(item)">
                        {{ item.description }}
                      </td>
                      <td class="col-val" [class.negative]="item.balanceInitial < 0">
                        {{ formatCurrency(item.balanceInitial) }}
                      </td>
                      <td class="col-val" [class.negative]="item.balanceFinal < 0">
                        {{ formatCurrency(item.balanceFinal) }}
                      </td>
                      <td class="col-var" [class.positive]="variation(item) > 0" [class.negative]="variation(item) < 0">
                        {{ variationLabel(item) }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

        </div>
      }

    </div>
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 20px; }

    /* Cabeçalho */
    .page-header {
      display: flex;
      align-items: center;
      gap: 12px;
      mat-icon { font-size: 28px; width: 28px; height: 28px; color: var(--primary, #3d5afe); }
      h1 { margin: 0; font-size: 22px; font-weight: 700; color: var(--text); }
    }

    /* Card upload */
    .card-container {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
      box-shadow: var(--card-shadow);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .card-label {
      margin: 0;
      font-size: 14px;
      color: var(--text-sec);
    }

    /* Drop zone */
    .drop-zone {
      border: 2px dashed var(--border);
      border-radius: 10px;
      padding: 36px 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
      text-align: center;
    }

    .drop-zone:hover,
    .drop-zone--active {
      border-color: var(--primary, #3d5afe);
      background: rgba(61, 90, 254, 0.05);
    }

    .drop-zone--selected {
      border-color: #66bb6a;
      background: rgba(102, 187, 106, 0.06);
    }

    .hidden-input { display: none; }

    .dz-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: var(--text-ter);
    }

    .dz-icon--ok { color: #66bb6a; }

    .dz-text {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: var(--text);
      word-break: break-all;
    }

    .dz-sub {
      margin: 0;
      font-size: 12px;
      color: var(--text-ter);
    }

    .btn-extrair {
      align-self: flex-end;
      height: 44px;
      padding: 0 28px;
      font-size: 14px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-spinner { margin-right: 4px; }

    /* Erro */
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
    }

    /* Resultado */
    .result-section { display: flex; flex-direction: column; gap: 16px; }

    /* Card empresa */
    .company-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px 24px;
      box-shadow: var(--card-shadow);
      display: flex;
      align-items: center;
      gap: 20px;
      flex-wrap: wrap;
    }

    .company-header {
      display: flex;
      align-items: center;
      gap: 14px;
      flex: 1;
      min-width: 240px;
      mat-icon { font-size: 36px; width: 36px; height: 36px; color: var(--primary, #3d5afe); flex-shrink: 0; }
    }

    .company-name { margin: 0; font-size: 16px; font-weight: 700; color: var(--text); }
    .company-sub  { margin: 4px 0 0; font-size: 13px; color: var(--text-sec); font-family: 'Consolas', monospace; }

    .company-meta {
      display: flex;
      gap: 28px;
      flex-wrap: wrap;
    }

    .meta-item { display: flex; flex-direction: column; gap: 2px; }
    .meta-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: var(--text-ter); }
    .meta-value { font-size: 14px; font-weight: 600; color: var(--text); }

    /* Tabela */
    .table-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: clip; /* clip não cria scroll context — não bloqueia scroll filho */
      box-shadow: var(--card-shadow);
    }

    .table-header-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      mat-icon { color: var(--primary, #3d5afe); }
      h2 { margin: 0; font-size: 16px; font-weight: 700; color: var(--text); flex: 1; }
    }

    .table-scroll {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      border-radius: 0 0 12px 12px;
    }

    .balance-table {
      width: 100%;
      min-width: 560px;
      border-collapse: collapse;
      font-size: 13px;
    }

    .balance-table thead tr {
      background: var(--row-hover);
    }

    .balance-table th {
      padding: 10px 16px;
      text-align: left;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: var(--text-ter);
      white-space: nowrap;
    }

    .col-val, .col-var { text-align: right; }

    .balance-table tbody tr {
      border-bottom: 1px solid var(--border);
      transition: background 0.15s;
    }

    .balance-table tbody tr:hover { background: var(--row-hover); }

    .balance-table td {
      padding: 10px 16px;
      color: var(--text);
      vertical-align: middle;
    }

    /* Níveis de indentação */
    .row-level0 td { font-weight: 800; font-size: 13px; background: rgba(61,90,254,0.06); }
    .row-level1 td { font-weight: 600; }
    .row-level2 td { font-weight: 400; }

    .col-val { font-family: 'Consolas', monospace; font-size: 13px; white-space: nowrap; }
    .col-var { font-family: 'Consolas', monospace; font-size: 13px; white-space: nowrap; }

    .negative { color: #ef5350 !important; }
    .positive { color: #66bb6a !important; }

    /* === Responsivo === */
    @media (max-width: 768px) {
      .btn-extrair { align-self: stretch; justify-content: center; }
      .company-card { flex-direction: column; align-items: flex-start; }
    }

    @media (max-width: 600px) {
      /* Coluna descrição fica sticky para o usuário ver enquanto scrolla */
      .balance-table th.col-desc,
      .balance-table td.col-desc {
        position: sticky;
        left: 0;
        background: var(--card);
        z-index: 1;
        max-width: 160px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .row-level0 td.col-desc { background: rgba(61,90,254,0.06); }

      /* Esconde variação em telas muito estreitas */
      .col-var { display: none; }

      /* Fonte menor nas células de valor */
      .col-val { font-size: 12px; padding: 8px 10px; }
      .balance-table td { padding: 8px 10px; }
      .balance-table th { padding: 8px 10px; }
    }
  `]
})
export class BalancoPatrimonialComponent {
  private service = inject(BalancoPatrimonialService);

  loading   = signal(false);
  error     = signal<string | null>(null);
  result    = signal<BalancoResponse | null>(null);
  fileName  = signal<string | null>(null);
  isDragging = signal(false);

  private pdfBase64 = '';

  onDragOver(e: DragEvent) {
    e.preventDefault();
    this.isDragging.set(true);
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    this.isDragging.set(false);
    const file = e.dataTransfer?.files[0];
    if (file) this.processFile(file);
  }

  onFileChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.processFile(file);
  }

  private processFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      this.error.set('Apenas arquivos PDF são aceitos.');
      return;
    }
    this.fileName.set(file.name);
    this.error.set(null);
    this.result.set(null);

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      this.pdfBase64 = dataUrl.split(',')[1];
    };
    reader.readAsDataURL(file);
  }

  extrair() {
    if (!this.pdfBase64 || this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    this.result.set(null);

    this.service.extrair({ pdfBase64: this.pdfBase64 }).subscribe({
      next: (data) => {
        this.result.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        const msg = err?.error?.message ?? err?.error?.mensagem ?? 'Não foi possível extrair os dados. Verifique o arquivo e tente novamente.';
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }

  getLevel(description: string): number {
    const match = description.match(/^(\d+)\s*-/);
    if (!match) return 2;
    const digits = match[1].length;
    if (digits === 1) return 0;
    if (digits === 2) return 1;
    return 2;
  }

  rowClass(item: CompanyBalance): string {
    return `row-level${this.getLevel(item.description)}`;
  }

  indentPx(item: CompanyBalance): number {
    const level = this.getLevel(item.description);
    return 16 + level * 20;
  }

  variation(item: CompanyBalance): number {
    return item.balanceFinal - item.balanceInitial;
  }

  variationLabel(item: CompanyBalance): string {
    const v = this.variation(item);
    if (v === 0) return '—';
    const prefix = v > 0 ? '+' : '';
    return `${prefix}${this.formatCurrency(v)}`;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value);
  }

  exportCsv() {
    if (!this.result()) return;
    const rows = [
      ['Descrição', 'Saldo Inicial', 'Saldo Final', 'Variação'],
      ...this.result()!.companyBalance.map(i => [
        i.description,
        i.balanceInitial.toFixed(2),
        i.balanceFinal.toFixed(2),
        this.variation(i).toFixed(2),
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(';')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `balanco_${this.result()!.company.cnpj.replace(/\D/g, '')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
