import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { LbdMonitorService } from '../lbd-monitor.service';
import { BackupDto } from '../models';

@Component({
  selector: 'app-backups',
  standalone: true,
  imports: [
    CommonModule, MatIconModule, MatButtonModule, MatTableModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatTooltipModule,
    MatFormFieldModule, MatInputModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <mat-icon>backup</mat-icon>
        <h1>Backups</h1>
        <span class="subtitle">Histórico de backups das instâncias monitoradas</span>
      </div>

      <!-- Cards resumo -->
      <div class="summary-cards" style="grid-template-columns: repeat(auto-fill,minmax(180px,1fr))">
        <div class="summary-card success">
          <div class="icon-wrapper success"><mat-icon>check_circle</mat-icon></div>
          <div class="info">
            <h3>{{ resumo().dentro24h }}</h3>
            <p>Backups em dia (24h)</p>
          </div>
        </div>
        <div class="summary-card warning">
          <div class="icon-wrapper warning"><mat-icon>schedule</mat-icon></div>
          <div class="info">
            <h3>{{ resumo().desatualizados }}</h3>
            <p>Backups atrasados</p>
          </div>
        </div>
        <div class="summary-card accent">
          <div class="icon-wrapper accent"><mat-icon>storage</mat-icon></div>
          <div class="info">
            <h3>{{ totalMB() | number:'1.0-0' }} MB</h3>
            <p>Volume total</p>
          </div>
        </div>
        <div class="summary-card primary">
          <div class="icon-wrapper primary"><mat-icon>backup_table</mat-icon></div>
          <div class="info">
            <h3>{{ backups().length }}</h3>
            <p>Registros no período</p>
          </div>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="card-container">
        <div class="table-toolbar">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Buscar...</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input matInput (input)="filtrar($event)" />
          </mat-form-field>
          <button mat-stroked-button (click)="sincronizar()" [disabled]="sincronizando()">
            <mat-icon>sync</mat-icon> Sincronizar
          </button>
        </div>

        @if (loading()) {
          <div class="loading-overlay"><mat-spinner diameter="40"></mat-spinner></div>
        } @else {
          <div class="table-scroll">
            <table mat-table [dataSource]="backupsFiltrados()">
              <ng-container matColumnDef="instancia">
                <th mat-header-cell *matHeaderCellDef>Instância</th>
                <td mat-cell *matCellDef="let b">{{ b.instanciaNome }}</td>
              </ng-container>
              <ng-container matColumnDef="banco">
                <th mat-header-cell *matHeaderCellDef>Banco</th>
                <td mat-cell *matCellDef="let b">{{ b.banco }}</td>
              </ng-container>
              <ng-container matColumnDef="tipo">
                <th mat-header-cell *matHeaderCellDef>Tipo</th>
                <td mat-cell *matCellDef="let b">
                  <span class="tipo-chip tipo-{{ b.tipo.toLowerCase() }}">{{ b.tipo }}</span>
                </td>
              </ng-container>
              <ng-container matColumnDef="data">
                <th mat-header-cell *matHeaderCellDef>Data</th>
                <td mat-cell *matCellDef="let b">{{ b.dataBackup | date:'dd/MM/yyyy HH:mm' }}</td>
              </ng-container>
              <ng-container matColumnDef="idade">
                <th mat-header-cell *matHeaderCellDef>Idade</th>
                <td mat-cell *matCellDef="let b">
                  <span [class.age-warn]="b.desatualizado">{{ calcularIdade(b.dataBackup) }}</span>
                </td>
              </ng-container>
              <ng-container matColumnDef="tamanho">
                <th mat-header-cell *matHeaderCellDef>Tamanho</th>
                <td mat-cell *matCellDef="let b">{{ b.tamanhoMB | number:'1.0-0' }} MB</td>
              </ng-container>
              <ng-container matColumnDef="integridade">
                <th mat-header-cell *matHeaderCellDef>Integridade</th>
                <td mat-cell *matCellDef="let b">
                  <span class="status-chip" [class.active]="b.integridade === 'OK'" [class.inactive]="b.integridade !== 'OK'">
                    {{ b.integridade }}
                  </span>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="colunas"></tr>
              <tr mat-row *matRowDef="let row; columns: colunas;" [class.row-warn]="row.desatualizado"></tr>
            </table>
          </div>
          @if (backupsFiltrados().length === 0) {
            <div class="empty-state"><mat-icon>backup</mat-icon><p>Nenhum backup encontrado</p></div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .tipo-chip { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 4px; }
    .tipo-full { background: rgba(121,134,203,0.2); color: var(--primary); }
    .tipo-differential { background: rgba(30,136,229,0.2); color: #64b5f6; }
    .tipo-log { background: rgba(112,199,60,0.15); color: var(--accent); }
    .age-warn { color: var(--inactive-color); font-weight: 500; }
    .row-warn { background: rgba(244,67,54,0.04); }
    mat-table { min-width: 700px; }
  `]
})
export class BackupsComponent implements OnInit {
  private svc = inject(LbdMonitorService);
  private snack = inject(MatSnackBar);

  loading = signal(true);
  sincronizando = signal(false);
  backups = signal<BackupDto[]>([]);
  backupsFiltrados = signal<BackupDto[]>([]);
  resumo = signal({ dentro24h: 0, desatualizados: 0 });
  totalMB = signal(0);
  colunas = ['instancia', 'banco', 'tipo', 'data', 'idade', 'tamanho', 'integridade'];
  private termoBusca = '';

  ngOnInit() {
    this.carregar();
  }

  carregar() {
    this.loading.set(true);
    this.svc.listarBackups().subscribe({
      next: (data) => {
        this.backups.set(data);
        this.backupsFiltrados.set(data);
        this.totalMB.set(data.reduce((acc, b) => acc + b.tamanhoMB, 0));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
    this.svc.resumoBackups().subscribe({
      next: (r) => this.resumo.set(r),
      error: () => {}
    });
  }

  filtrar(event: Event) {
    this.termoBusca = (event.target as HTMLInputElement).value.toLowerCase();
    this.backupsFiltrados.set(
      this.backups().filter(b =>
        b.instanciaNome.toLowerCase().includes(this.termoBusca) ||
        b.banco.toLowerCase().includes(this.termoBusca)
      )
    );
  }

  sincronizar() {
    this.sincronizando.set(true);
    this.svc.sincronizarBackups().subscribe({
      next: (r) => {
        this.snack.open(r.mensagem, 'OK', { duration: 4000, panelClass: 'success-snackbar' });
        this.sincronizando.set(false);
        this.carregar();
      },
      error: () => {
        this.snack.open('Erro ao sincronizar backups', 'OK', { duration: 3000, panelClass: 'error-snackbar' });
        this.sincronizando.set(false);
      }
    });
  }

  calcularIdade(dataStr: string): string {
    const diff = Date.now() - new Date(dataStr).getTime();
    const horas = Math.floor(diff / 3600000);
    if (horas < 24) return `${horas}h`;
    return `${Math.floor(horas / 24)}d ${horas % 24}h`;
  }
}
