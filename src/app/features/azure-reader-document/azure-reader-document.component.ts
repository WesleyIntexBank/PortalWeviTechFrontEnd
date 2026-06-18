import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  AzureReaderDocumentService,
  AzureReaderResponse,
  DocumentoIRPF,
  TabelaEstruturada,
  TypeDocumento,
  TYPE_DOCUMENTO_LABELS,
} from '../../core/services/azure-reader-document.service';

@Component({
  selector: 'app-azure-reader-document',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTooltipModule,
  ],
  template: `
    <div class="page-container">

      <!-- Cabeçalho -->
      <div class="page-header">
        <mat-icon>document_scanner</mat-icon>
        <h1>Leitor de Documentos (Azure AI)</h1>
      </div>

      <!-- Upload + config -->
      <div class="card-container">
        <p class="card-label">Selecione o documento e o tipo para extração de texto via Azure Document Intelligence</p>

        <div class="config-row">
          <!-- Tipo de documento -->
          <mat-form-field appearance="outline" class="type-select">
            <mat-label>Tipo de Documento</mat-label>
            <mat-select [(ngModel)]="tipoSelecionado">
              @for (t of tiposDisponiveis; track t.value) {
                <mat-option [value]="t.value">{{ t.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Drop zone -->
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
            [accept]="acceptedTypes()"
            class="hidden-input"
            (change)="onFileChange($event)"
          >
          @if (fileName()) {
            <mat-icon class="dz-icon dz-icon--ok">insert_drive_file</mat-icon>
            <p class="dz-text">{{ fileName() }}</p>
            <p class="dz-sub">Clique para trocar o arquivo</p>
          } @else {
            <mat-icon class="dz-icon">upload_file</mat-icon>
            <p class="dz-text">Arraste o arquivo aqui ou clique para selecionar</p>
            <p class="dz-sub">{{ acceptLabel() }}</p>
          }
        </div>

        <button
          mat-flat-button
          color="primary"
          class="btn-analisar"
          [disabled]="!fileName() || loading()"
          (click)="analisar()"
        >
          @if (loading()) {
            <mat-spinner diameter="20" class="btn-spinner"></mat-spinner>
          } @else {
            <mat-icon>document_scanner</mat-icon>
          }
          {{ loading() ? 'Analisando...' : 'Analisar Documento' }}
        </button>
      </div>

      <!-- Erro -->
      @if (error()) {
        <div class="error-banner">
          <mat-icon>error_outline</mat-icon>
          <span>{{ error() }}</span>
        </div>
      }

      <!-- Resultado IRPF estruturado -->
      @if (irpfResult()) {
        <div class="result-section">

          <!-- Resumo -->
          <div class="summary-card">
            <div class="summary-row">
              <div class="summary-item">
                <span class="summary-label">Tipo</span>
                <span class="summary-value chip chip-blue">IRPF</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Processado em</span>
                <span class="summary-value">{{ formatDate(irpfResult()!.dataProcessamento) }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Páginas</span>
                <span class="summary-value">{{ irpfResult()!.totalPaginas }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Tabelas detectadas</span>
                <span class="summary-value">{{ irpfResult()!.tabelas.length }}</span>
              </div>
            </div>
          </div>

          <!-- Conteúdo por página -->
          @for (pagina of irpfResult()!.conteudo; track pagina.pagina) {
            <div class="page-card">
              <div class="page-card-header">
                <mat-icon>article</mat-icon>
                <span>Página {{ pagina.pagina }}</span>
                <span class="line-count">{{ pagina.linhas.length }} linhas</span>
                <button mat-icon-button class="toggle-btn"
                  (click)="togglePage(pagina.pagina)"
                  [matTooltip]="isPageOpen(pagina.pagina) ? 'Recolher' : 'Expandir'">
                  <mat-icon>{{ isPageOpen(pagina.pagina) ? 'expand_less' : 'expand_more' }}</mat-icon>
                </button>
              </div>
              @if (isPageOpen(pagina.pagina)) {
                <div class="page-lines">
                  @for (linha of pagina.linhas; track $index) {
                    <p class="text-line">{{ linha }}</p>
                  }
                </div>
              }
            </div>
          }

          <!-- Tabelas -->
          @if (irpfResult()!.tabelas.length > 0) {
            <div class="section-title">
              <mat-icon>table_chart</mat-icon>
              <h2>Tabelas Detectadas</h2>
            </div>
            @for (tabela of irpfResult()!.tabelas; track $index) {
              <div class="table-card">
                <div class="table-card-header">
                  <mat-icon>grid_on</mat-icon>
                  <span>Tabela {{ $index + 1 }}</span>
                  <span class="table-meta">{{ tabela.linhas }} linhas × {{ tabela.colunas }} colunas</span>
                </div>
                <div class="table-scroll">
                  <table class="data-table">
                    <tbody>
                      @for (row of buildTableRows(tabela); track $index) {
                        <tr [class.header-row]="$index === 0">
                          @for (cell of row; track $index) {
                            <td>{{ cell }}</td>
                          }
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }
          }

        </div>
      }

      <!-- Resultado texto puro -->
      @if (textResult()) {
        <div class="result-section">
          <div class="text-card">
            <div class="text-card-header">
              <mat-icon>subject</mat-icon>
              <h2>Texto Extraído</h2>
              <button mat-icon-button (click)="copiar()" [matTooltip]="copiado() ? 'Copiado!' : 'Copiar texto'">
                <mat-icon>{{ copiado() ? 'check' : 'content_copy' }}</mat-icon>
              </button>
            </div>
            <pre class="text-content">{{ textResult() }}</pre>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 20px; }

    .page-header {
      display: flex;
      align-items: center;
      gap: 12px;
      mat-icon { font-size: 28px; width: 28px; height: 28px; color: var(--primary, #3d5afe); }
      h1 { margin: 0; font-size: 22px; font-weight: 700; color: var(--text); }
    }

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

    .card-label { margin: 0; font-size: 14px; color: var(--text-sec); }

    .config-row {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .type-select { min-width: 220px; flex: 1; max-width: 320px; }

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
    .drop-zone:hover, .drop-zone--active {
      border-color: var(--primary, #3d5afe);
      background: rgba(61, 90, 254, 0.05);
    }
    .drop-zone--selected { border-color: #66bb6a; background: rgba(102, 187, 106, 0.06); }

    .hidden-input { display: none; }
    .dz-icon { font-size: 40px; width: 40px; height: 40px; color: var(--text-ter); }
    .dz-icon--ok { color: #66bb6a; }
    .dz-text { margin: 0; font-size: 14px; font-weight: 600; color: var(--text); word-break: break-all; }
    .dz-sub  { margin: 0; font-size: 12px; color: var(--text-ter); }

    .btn-analisar {
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

    /* Resumo */
    .summary-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px 24px;
      box-shadow: var(--card-shadow);
    }
    .summary-row { display: flex; gap: 32px; flex-wrap: wrap; }
    .summary-item { display: flex; flex-direction: column; gap: 4px; }
    .summary-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: var(--text-ter); }
    .summary-value { font-size: 14px; font-weight: 600; color: var(--text); }
    .chip { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 12px; }
    .chip-blue { background: rgba(61,90,254,0.12); color: #3d5afe; }

    /* Cards de página */
    .page-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: clip;
      box-shadow: var(--card-shadow);
    }
    .page-card-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 20px;
      cursor: pointer;
      mat-icon { color: var(--primary, #3d5afe); flex-shrink: 0; }
      span { font-size: 14px; font-weight: 700; color: var(--text); }
    }
    .line-count { font-size: 12px; font-weight: 400; color: var(--text-sec); margin-left: 4px; flex: 1; }
    .toggle-btn { margin-left: auto; }

    .page-lines {
      padding: 0 20px 16px;
      border-top: 1px solid var(--border);
      max-height: 400px;
      overflow-y: auto;
    }
    .text-line {
      margin: 0;
      padding: 3px 0;
      font-size: 13px;
      color: var(--text);
      border-bottom: 1px solid var(--border);
      line-height: 1.6;
      word-break: break-word;
    }
    .text-line:last-child { border-bottom: none; }

    /* Section title */
    .section-title {
      display: flex;
      align-items: center;
      gap: 10px;
      mat-icon { color: var(--primary, #3d5afe); }
      h2 { margin: 0; font-size: 16px; font-weight: 700; color: var(--text); }
    }

    /* Tabelas */
    .table-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: clip;
      box-shadow: var(--card-shadow);
    }
    .table-card-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 20px;
      border-bottom: 1px solid var(--border);
      mat-icon { color: var(--primary, #3d5afe); }
      span { font-size: 14px; font-weight: 700; color: var(--text); }
    }
    .table-meta { font-size: 12px; font-weight: 400; color: var(--text-sec); margin-left: 4px; flex: 1; }

    .table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }

    .data-table {
      width: 100%;
      min-width: 400px;
      border-collapse: collapse;
      font-size: 13px;
    }
    .data-table td {
      padding: 8px 16px;
      border-bottom: 1px solid var(--border);
      border-right: 1px solid var(--border);
      color: var(--text);
      vertical-align: top;
      word-break: break-word;
    }
    .data-table td:last-child { border-right: none; }
    .data-table tr:last-child td { border-bottom: none; }
    .header-row td {
      font-weight: 700;
      background: var(--row-hover);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: var(--text-ter);
    }

    /* Texto puro */
    .text-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: clip;
      box-shadow: var(--card-shadow);
    }
    .text-card-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      mat-icon { color: var(--primary, #3d5afe); }
      h2 { margin: 0; font-size: 16px; font-weight: 700; color: var(--text); flex: 1; }
    }
    .text-content {
      margin: 0;
      padding: 20px;
      font-size: 13px;
      font-family: 'Consolas', 'Courier New', monospace;
      color: var(--text);
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.7;
      max-height: 600px;
      overflow-y: auto;
      background: var(--card);
    }

    @media (max-width: 768px) {
      .btn-analisar { align-self: stretch; justify-content: center; }
      .type-select { max-width: 100%; }
      .summary-row { gap: 20px; }
    }
  `]
})
export class AzureReaderDocumentComponent {
  private service = inject(AzureReaderDocumentService);

  loading    = signal(false);
  error      = signal<string | null>(null);
  irpfResult = signal<DocumentoIRPF | null>(null);
  textResult = signal<string | null>(null);
  fileName   = signal<string | null>(null);
  isDragging = signal(false);
  copiado    = signal(false);

  tipoSelecionado: TypeDocumento = 1;

  private pdfBase64 = '';
  private openPages = new Set<number>();

  readonly tiposDisponiveis = (Object.entries(TYPE_DOCUMENTO_LABELS) as [string, string][]).map(
    ([value, label]) => ({ value: Number(value) as TypeDocumento, label })
  );

  acceptedTypes = computed(() => {
    switch (this.tipoSelecionado) {
      case 5:  return '.docx,.doc';
      case 7:  return '.xlsx,.xls';
      case 6:  return '.pptx,.ppt';
      case 8:  return '.jpg,.jpeg,.png,.bmp,.tiff,.webp';
      default: return '.pdf,.jpg,.jpeg,.png,.bmp,.tiff';
    }
  });

  acceptLabel = computed(() => {
    switch (this.tipoSelecionado) {
      case 5:  return 'Arquivos Word (.docx, .doc)';
      case 7:  return 'Arquivos Excel (.xlsx, .xls)';
      case 6:  return 'Arquivos PowerPoint (.pptx, .ppt)';
      case 8:  return 'Imagens (.jpg, .png, .bmp, .tiff)';
      default: return 'PDF ou imagens (.pdf, .jpg, .png)';
    }
  });

  onDragOver(e: DragEvent) { e.preventDefault(); this.isDragging.set(true); }

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
    this.fileName.set(file.name);
    this.error.set(null);
    this.irpfResult.set(null);
    this.textResult.set(null);
    this.openPages.clear();

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      this.pdfBase64 = dataUrl.split(',')[1];
    };
    reader.readAsDataURL(file);
  }

  analisar() {
    if (!this.pdfBase64 || this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    this.irpfResult.set(null);
    this.textResult.set(null);
    this.openPages.clear();

    this.service.analisar({
      user: '',
      fileName: this.fileName() ?? '',
      newMessage: '',
      base64: this.pdfBase64,
      search: false,
      tipo: this.tipoSelecionado,
    }).subscribe({
      next: (data) => {
        if (this.tipoSelecionado === 0) {
          this.irpfResult.set((data as { message: DocumentoIRPF }).message);
          // Abre a primeira página por padrão
          const doc = this.irpfResult();
          if (doc && doc.conteudo.length > 0) this.openPages.add(doc.conteudo[0].pagina);
        } else {
          this.textResult.set((data as { message: string }).message);
        }
        this.loading.set(false);
      },
      error: (err) => {
        const msg = err?.error?.message ?? err?.error?.mensagem ?? 'Erro ao analisar o documento.';
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }

  togglePage(pagina: number) {
    if (this.openPages.has(pagina)) this.openPages.delete(pagina);
    else this.openPages.add(pagina);
  }

  isPageOpen(pagina: number): boolean {
    return this.openPages.has(pagina);
  }

  buildTableRows(tabela: TabelaEstruturada): string[][] {
    const grid: string[][] = [];
    for (let r = 0; r < tabela.linhas; r++) {
      grid[r] = Array(tabela.colunas).fill('');
    }
    for (const cell of tabela.celulas) {
      if (cell.rowIndex < tabela.linhas && cell.columnIndex < tabela.colunas) {
        grid[cell.rowIndex][cell.columnIndex] = cell.content;
      }
    }
    return grid;
  }

  formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleString('pt-BR');
    } catch {
      return iso;
    }
  }

  copiar() {
    const text = this.textResult();
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      this.copiado.set(true);
      setTimeout(() => this.copiado.set(false), 2000);
    });
  }
}
