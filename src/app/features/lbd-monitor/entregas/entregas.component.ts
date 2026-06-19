import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { LbdMonitorService } from '../lbd-monitor.service';
import { EntregaDto } from '../models';

@Component({
  selector: 'app-entregas',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatTableModule, MatProgressSpinnerModule,
    MatDatepickerModule, MatNativeDateModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <mat-icon>send</mat-icon>
        <h1>Entregas</h1>
        <span class="subtitle">Histórico de notificações e entregas</span>
      </div>

      <!-- Filtros -->
      <div class="card-container" style="margin-bottom:20px">
        <form [formGroup]="filtroForm" (ngSubmit)="buscar()" class="filtro-grid">
          <mat-form-field appearance="outline">
            <mat-label>Canal</mat-label>
            <mat-select formControlName="canal">
              <mat-option value="">Todos</mat-option>
              <mat-option value="Email">Email</mat-option>
              <mat-option value="SMS">SMS</mat-option>
              <mat-option value="WhatsApp">WhatsApp</mat-option>
              <mat-option value="Webhook">Webhook</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Status</mat-label>
            <mat-select formControlName="status">
              <mat-option value="">Todos</mat-option>
              <mat-option value="Enviado">Enviado</mat-option>
              <mat-option value="Falhou">Falhou</mat-option>
              <mat-option value="Pendente">Pendente</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>De</mat-label>
            <input matInput [matDatepicker]="dpDe" formControlName="de" />
            <mat-datepicker-toggle matSuffix [for]="dpDe"></mat-datepicker-toggle>
            <mat-datepicker #dpDe></mat-datepicker>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Até</mat-label>
            <input matInput [matDatepicker]="dpAte" formControlName="ate" />
            <mat-datepicker-toggle matSuffix [for]="dpAte"></mat-datepicker-toggle>
            <mat-datepicker #dpAte></mat-datepicker>
          </mat-form-field>

          <div class="filtro-actions">
            <button mat-flat-button color="primary" type="submit">
              <mat-icon>search</mat-icon> Buscar
            </button>
            <button mat-stroked-button type="button" (click)="limpar()">
              <mat-icon>clear</mat-icon> Limpar
            </button>
          </div>
        </form>
      </div>

      <!-- Tabela -->
      <div class="card-container">
        <div class="table-toolbar">
          <span class="total-label">{{ entregas().length }} entregas encontradas</span>
        </div>

        @if (loading()) {
          <div class="loading-overlay"><mat-spinner diameter="40"></mat-spinner></div>
        } @else if (entregas().length === 0) {
          <div class="empty-state"><mat-icon>send</mat-icon><p>Nenhuma entrega encontrada</p></div>
        } @else {
          <div class="table-scroll">
            <table mat-table [dataSource]="entregas()">
              <ng-container matColumnDef="quando">
                <th mat-header-cell *matHeaderCellDef>Quando</th>
                <td mat-cell *matCellDef="let e">{{ e.enviadoEm | date:'dd/MM/yyyy HH:mm' }}</td>
              </ng-container>
              <ng-container matColumnDef="canal">
                <th mat-header-cell *matHeaderCellDef>Canal</th>
                <td mat-cell *matCellDef="let e">
                  <div class="canal-cell">
                    <mat-icon class="canal-icon">{{ canalIcon(e.canal) }}</mat-icon>
                    <span>{{ e.canal }}</span>
                  </div>
                </td>
              </ng-container>
              <ng-container matColumnDef="notificacao">
                <th mat-header-cell *matHeaderCellDef>Notificação</th>
                <td mat-cell *matCellDef="let e">
                  <span class="msg-cell" [title]="e.mensagem">{{ e.mensagem }}</span>
                </td>
              </ng-container>
              <ng-container matColumnDef="destino">
                <th mat-header-cell *matHeaderCellDef>Destino</th>
                <td mat-cell *matCellDef="let e">{{ e.destino ?? '—' }}</td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let e">
                  <span class="status-chip" [class.active]="e.status === 'Enviado'" [class.inactive]="e.status === 'Falhou'">
                    {{ e.status }}
                  </span>
                </td>
              </ng-container>
              <ng-container matColumnDef="tentativas">
                <th mat-header-cell *matHeaderCellDef>Tentativas</th>
                <td mat-cell *matCellDef="let e">{{ e.tentativas }}</td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="colunas"></tr>
              <tr mat-row *matRowDef="let row; columns: colunas;" class="hover-row"></tr>
            </table>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .filtro-grid { display: grid; grid-template-columns: repeat(4, 1fr) auto; gap: 12px; align-items: center; }
    @media (max-width: 900px) { .filtro-grid { grid-template-columns: 1fr 1fr; } }

    .filtro-actions { display: flex; gap: 8px; align-items: center; }

    .total-label { font-size: 13px; color: var(--text-sec); }

    .canal-cell { display: flex; align-items: center; gap: 6px; }
    .canal-icon { font-size: 16px; width: 16px; height: 16px; color: var(--body-label); }

    .msg-cell { display: block; max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; }

    mat-table { min-width: 700px; }
    .hover-row:hover { background: var(--row-hover); }
  `]
})
export class EntregasComponent implements OnInit {
  private svc = inject(LbdMonitorService);
  private fb = inject(FormBuilder);

  loading = signal(true);
  entregas = signal<EntregaDto[]>([]);
  colunas = ['quando', 'canal', 'notificacao', 'destino', 'status', 'tentativas'];

  filtroForm = this.fb.group({
    canal: [''],
    status: [''],
    de: [null as Date | null],
    ate: [null as Date | null]
  });

  ngOnInit() {
    this.buscar();
  }

  buscar() {
    this.loading.set(true);
    const v = this.filtroForm.value;
    this.svc.listarEntregas(
      v.canal || undefined,
      v.status || undefined,
      v.de ? v.de.toISOString() : undefined,
      v.ate ? v.ate.toISOString() : undefined
    ).subscribe({
      next: (data) => { this.entregas.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  limpar() {
    this.filtroForm.reset({ canal: '', status: '', de: null, ate: null });
    this.buscar();
  }

  canalIcon(canal: string): string {
    switch (canal.toLowerCase()) {
      case 'email': return 'email';
      case 'sms': return 'sms';
      case 'whatsapp': return 'chat';
      case 'webhook': return 'webhook';
      default: return 'send';
    }
  }
}
