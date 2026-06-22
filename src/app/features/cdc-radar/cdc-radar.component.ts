import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { CdcRadarService, CDCRadar } from '../../core/services/cdc-radar.service';

@Component({
  selector: 'app-cdc-radar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatDividerModule,
  ],
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <mat-icon class="header-icon">radar</mat-icon>
        <h1>Consulta CDC Radar</h1>
      </div>

      <div class="search-row">
        <mat-form-field appearance="outline" class="field-doc">
          <mat-label>CPF / CNPJ</mat-label>
          <input
            matInput
            [(ngModel)]="documento"
            placeholder="000.000.000-00 ou 00.000.000/0001-00"
            (keydown.enter)="buscar()"
          />
        </mat-form-field>

        <button mat-flat-button color="primary" (click)="buscar()" [disabled]="carregando()">
          @if (carregando()) {
            <mat-spinner diameter="20" />
          } @else {
            <mat-icon>search</mat-icon>
            Consultar
          }
        </button>
      </div>

      @if (erro()) {
        <div class="error-banner">
          <mat-icon>error_outline</mat-icon>
          {{ erro() }}
        </div>
      }

      @if (resultado()) {
        <mat-card class="result-card">
          <mat-card-header>
            <mat-icon mat-card-avatar class="avatar-icon">person_search</mat-icon>
            <mat-card-title>{{ resultado()!.nome || 'Sem nome' }}</mat-card-title>
            <mat-card-subtitle>{{ resultado()!.documento }}</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <mat-divider />

            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Situação Radar</span>
                <span class="info-value situacao" [class.situacao-ok]="isSituacaoOk()" [class.situacao-alert]="!isSituacaoOk()">
                  {{ resultado()!.situacaoRadar || '—' }}
                </span>
              </div>

              <div class="info-item">
                <span class="info-label">Data da Situação</span>
                <span class="info-value">{{ resultado()!.dataSituacao ? (resultado()!.dataSituacao | date: 'dd/MM/yyyy') : '—' }}</span>
              </div>

              <div class="info-item">
                <span class="info-label">Modalidade</span>
                <span class="info-value">{{ resultado()!.modalidade || '—' }}</span>
              </div>

              <div class="info-item">
                <span class="info-label">Sub-Modalidade</span>
                <span class="info-value">{{ resultado()!.subModalidade || '—' }}</span>
              </div>

              <div class="info-item full-width">
                <span class="info-label">Operações Autorizadas</span>
                <span class="info-value">{{ resultado()!.operacoes || '—' }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      }

      @if (!carregando() && !resultado() && !erro()) {
        <div class="empty-state">
          <mat-icon>manage_search</mat-icon>
          <p>Informe um CPF ou CNPJ para consultar a situação no CDC Radar.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-wrapper {
      padding: 24px;
      max-width: 800px;
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

    .search-row {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
    }

    .field-doc {
      min-width: 280px;
      flex: 1;
      max-width: 420px;
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

    .result-card {
      border: 1px solid var(--border);
      border-radius: 10px;
    }

    .avatar-icon {
      color: var(--primary);
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    mat-divider {
      margin: 16px 0;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-item.full-width {
      grid-column: 1 / -1;
    }

    .info-label {
      font-size: 12px;
      font-weight: 600;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-value {
      font-size: 15px;
      color: var(--text);
      font-weight: 500;
    }

    .situacao {
      display: inline-block;
      padding: 2px 12px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 700;
      width: fit-content;
    }

    .situacao-ok {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .situacao-alert {
      background: #fff3e0;
      color: #e65100;
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
export class CdcRadarComponent {
  private service = inject(CdcRadarService);

  documento = '';
  carregando = signal(false);
  erro = signal('');
  resultado = signal<CDCRadar | null>(null);

  buscar(): void {
    const doc = this.documento.replace(/\D/g, '');
    if (!doc || (doc.length !== 11 && doc.length !== 14)) {
      this.erro.set('Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.');
      return;
    }
    this.carregando.set(true);
    this.erro.set('');
    this.resultado.set(null);

    this.service.buscarPorDocumento(doc).subscribe({
      next: (res) => {
        this.resultado.set(res);
        this.carregando.set(false);
      },
      error: (err) => {
        this.erro.set(err?.error?.message ?? 'Documento não encontrado ou erro na consulta.');
        this.carregando.set(false);
      },
    });
  }

  isSituacaoOk(): boolean {
    const s = this.resultado()?.situacaoRadar?.toUpperCase() ?? '';
    return s.includes('ATIVO') || s.includes('REGULAR') || s.includes('LIBERADO');
  }
}
