import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { Acam204Service, Acam204NotificationResult } from '../../core/services/acam204.service';

@Component({
  selector: 'app-acam204-validacao',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatCardModule,
    MatExpansionModule,
  ],
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <mat-icon class="header-icon">verified_user</mat-icon>
        <h1>Validação ACAM204</h1>
      </div>

      <mat-tab-group animationDuration="200ms">

        <!-- TAB: Por Data -->
        <mat-tab label="Por Data">
          <div class="tab-content">
            <div class="filter-row">
              <mat-form-field appearance="outline">
                <mat-label>Data Inicial</mat-label>
                <input matInput type="date" [(ngModel)]="dataInicio" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Data Final</mat-label>
                <input matInput type="date" [(ngModel)]="dataFim" />
              </mat-form-field>

              <button mat-flat-button color="primary" (click)="validarPorData()" [disabled]="carregandoData()">
                @if (carregandoData()) {
                  <mat-spinner diameter="20" />
                } @else {
                  <mat-icon>search</mat-icon>
                  Validar
                }
              </button>
            </div>

            @if (erroData()) {
              <div class="error-banner">
                <mat-icon>error_outline</mat-icon>
                {{ erroData() }}
              </div>
            }

            @for (resultado of resultadosData(); track resultado.date) {
              <mat-expansion-panel class="result-panel" [expanded]="resultado.notificacoes.length > 0">
                <mat-expansion-panel-header>
                  <mat-panel-title>
                    <mat-icon class="date-icon">calendar_today</mat-icon>
                    {{ resultado.date | date: 'dd/MM/yyyy' }}
                  </mat-panel-title>
                  <mat-panel-description>
                    @if (resultado.notificacoes.length === 0) {
                      <span class="badge ok">Sem pendências</span>
                    } @else {
                      <span class="badge warn">{{ resultado.notificacoes.length }} notificação(ões)</span>
                    }
                  </mat-panel-description>
                </mat-expansion-panel-header>

                @if (resultado.notificacoes.length === 0) {
                  <p class="no-issues">Nenhuma inconsistência encontrada para esta data.</p>
                } @else {
                  @for (n of resultado.notificacoes; track n.chave) {
                    <div class="notificacao-item">
                      <div class="notificacao-header">
                        <mat-icon class="warn-icon">warning</mat-icon>
                        <span class="notificacao-chave">{{ n.chave }}</span>
                      </div>
                      <p class="notificacao-msg">{{ n.mensagem }}</p>
                      @if (n.boletos && n.boletos.length > 0) {
                        <div class="boletos-label">Boletos afetados:</div>
                        <mat-chip-set>
                          @for (b of n.boletos; track b) {
                            <mat-chip>{{ b }}</mat-chip>
                          }
                        </mat-chip-set>
                      }
                    </div>
                  }
                }
              </mat-expansion-panel>
            }

            @if (!carregandoData() && resultadosData().length === 0 && !erroData()) {
              <div class="empty-state">
                <mat-icon>fact_check</mat-icon>
                <p>Selecione o período e clique em Validar para consultar as operações.</p>
              </div>
            }
          </div>
        </mat-tab>

        <!-- TAB: Por XML -->
        <mat-tab label="Por XML">
          <div class="tab-content">
            <div class="filter-row">
              <mat-form-field appearance="outline" class="field-filename">
                <mat-label>Nome do Arquivo</mat-label>
                <input matInput [(ngModel)]="nomeArquivo" placeholder="ACAM204_2024.xml" />
              </mat-form-field>

              <div class="upload-wrapper">
                <button mat-stroked-button (click)="fileInput.click()">
                  <mat-icon>upload_file</mat-icon>
                  Selecionar XML
                </button>
                <input #fileInput type="file" accept=".xml" (change)="onFileSelected($event)" hidden />
                @if (arquivoSelecionado()) {
                  <span class="file-name-chip">{{ arquivoSelecionado() }}</span>
                }
              </div>

              <button mat-flat-button color="primary" (click)="validarPorXml()" [disabled]="carregandoXml()">
                @if (carregandoXml()) {
                  <mat-spinner diameter="20" />
                } @else {
                  <mat-icon>check_circle</mat-icon>
                  Validar
                }
              </button>
            </div>

            @if (erroXml()) {
              <div class="error-banner">
                <mat-icon>error_outline</mat-icon>
                {{ erroXml() }}
              </div>
            }

            @if (resultadoXml()) {
              <mat-card class="xml-result-card">
                <mat-card-header>
                  <mat-icon mat-card-avatar [class.ok-icon]="resultadoXml()!.notificacoes.length === 0" [class.warn-icon]="resultadoXml()!.notificacoes.length > 0">
                    {{ resultadoXml()!.notificacoes.length === 0 ? 'check_circle' : 'report_problem' }}
                  </mat-icon>
                  <mat-card-title>Resultado da Validação</mat-card-title>
                  <mat-card-subtitle>{{ resultadoXml()!.date | date: 'dd/MM/yyyy HH:mm' }}</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  @if (resultadoXml()!.notificacoes.length === 0) {
                    <p class="no-issues">Arquivo válido. Nenhuma inconsistência encontrada.</p>
                  } @else {
                    @for (n of resultadoXml()!.notificacoes; track n.chave) {
                      <div class="notificacao-item">
                        <div class="notificacao-header">
                          <mat-icon class="warn-icon">warning</mat-icon>
                          <span class="notificacao-chave">{{ n.chave }}</span>
                        </div>
                        <p class="notificacao-msg">{{ n.mensagem }}</p>
                        @if (n.boletos && n.boletos.length > 0) {
                          <div class="boletos-label">Boletos afetados:</div>
                          <mat-chip-set>
                            @for (b of n.boletos; track b) {
                              <mat-chip>{{ b }}</mat-chip>
                            }
                          </mat-chip-set>
                        }
                      </div>
                    }
                  }
                </mat-card-content>
                @if (resultadoXml()!.arquivoBase64) {
                  <mat-card-actions>
                    <button mat-stroked-button color="primary" (click)="baixarArquivo()">
                      <mat-icon>download</mat-icon>
                      Baixar Relatório
                    </button>
                  </mat-card-actions>
                }
              </mat-card>
            }

            @if (!carregandoXml() && !resultadoXml() && !erroXml()) {
              <div class="empty-state">
                <mat-icon>upload_file</mat-icon>
                <p>Selecione um arquivo XML e clique em Validar.</p>
              </div>
            }
          </div>
        </mat-tab>

      </mat-tab-group>
    </div>
  `,
  styles: [`
    .page-wrapper {
      padding: 24px;
      max-width: 1100px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 28px;
    }

    .header-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: var(--primary);
    }

    h1 {
      font-size: 22px;
      font-weight: 600;
      margin: 0;
      color: var(--text);
    }

    .tab-content {
      padding: 24px 0;
    }

    .filter-row {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 24px;
    }

    mat-form-field {
      min-width: 180px;
    }

    .field-filename {
      min-width: 280px;
    }

    .upload-wrapper {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .file-name-chip {
      background: var(--border);
      border-radius: 12px;
      padding: 4px 12px;
      font-size: 13px;
      color: var(--text);
    }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #fdecea;
      border: 1px solid #f5c6cb;
      border-radius: 6px;
      padding: 12px 16px;
      color: #c62828;
      margin-bottom: 16px;
    }

    .result-panel {
      margin-bottom: 12px;
      border: 1px solid var(--border);
      border-radius: 8px !important;
    }

    .date-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      margin-right: 8px;
      color: var(--primary);
    }

    .badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .badge.ok {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .badge.warn {
      background: #fff3e0;
      color: #e65100;
    }

    .no-issues {
      color: #388e3c;
      font-size: 14px;
      padding: 8px 0;
      margin: 0;
    }

    .notificacao-item {
      border-left: 3px solid #ff9800;
      padding: 10px 14px;
      margin-bottom: 12px;
      background: var(--card);
      border-radius: 0 6px 6px 0;
    }

    .notificacao-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
    }

    .warn-icon { color: #e65100; font-size: 18px; width: 18px; height: 18px; }
    .ok-icon   { color: #2e7d32; }

    .notificacao-chave {
      font-weight: 600;
      font-size: 13px;
      color: var(--text);
    }

    .notificacao-msg {
      font-size: 13px;
      color: var(--text);
      margin: 0 0 8px;
    }

    .boletos-label {
      font-size: 12px;
      color: #888;
      margin-bottom: 6px;
    }

    .xml-result-card {
      border: 1px solid var(--border);
      border-radius: 10px;
    }

    mat-card-content {
      padding-top: 16px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 60px 0;
      color: #aaa;
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }

    .empty-state p {
      margin: 0;
      font-size: 15px;
    }
  `],
})
export class Acam204ValidacaoComponent {
  private service = inject(Acam204Service);

  dataInicio = '';
  dataFim = '';
  nomeArquivo = '';
  xmlBase64 = '';
  arquivoSelecionado = signal('');

  carregandoData = signal(false);
  erroData = signal('');
  resultadosData = signal<Acam204NotificationResult[]>([]);

  carregandoXml = signal(false);
  erroXml = signal('');
  resultadoXml = signal<Acam204NotificationResult | null>(null);

  validarPorData(): void {
    if (!this.dataInicio || !this.dataFim) {
      this.erroData.set('Informe a data inicial e a data final.');
      return;
    }
    this.carregandoData.set(true);
    this.erroData.set('');
    this.resultadosData.set([]);

    this.service.validarPorData(this.dataInicio, this.dataFim).subscribe({
      next: (res) => {
        this.resultadosData.set(res);
        this.carregandoData.set(false);
      },
      error: (err) => {
        this.erroData.set(err?.error?.message ?? 'Erro ao validar por data.');
        this.carregandoData.set(false);
      },
    });
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.arquivoSelecionado.set(file.name);
    if (!this.nomeArquivo) this.nomeArquivo = file.name;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      this.xmlBase64 = base64;
    };
    reader.readAsDataURL(file);
  }

  validarPorXml(): void {
    if (!this.xmlBase64 || !this.nomeArquivo) {
      this.erroXml.set('Selecione um arquivo XML e informe o nome.');
      return;
    }
    this.carregandoXml.set(true);
    this.erroXml.set('');
    this.resultadoXml.set(null);

    this.service.validarPorXml(this.nomeArquivo, this.xmlBase64).subscribe({
      next: (res) => {
        this.resultadoXml.set(res);
        this.carregandoXml.set(false);
      },
      error: (err) => {
        this.erroXml.set(err?.error?.message ?? 'Erro ao validar XML.');
        this.carregandoXml.set(false);
      },
    });
  }

  baixarArquivo(): void {
    const base64 = this.resultadoXml()?.arquivoBase64;
    if (!base64) return;
    const link = document.createElement('a');
    link.href = `data:application/octet-stream;base64,${base64}`;
    link.download = 'relatorio-acam204.txt';
    link.click();
  }
}
