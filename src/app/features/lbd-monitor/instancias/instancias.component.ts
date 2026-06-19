import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { LbdMonitorService } from '../lbd-monitor.service';
import { InstanciaDto } from '../models';

@Component({
  selector: 'app-instancias',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatProgressSpinnerModule, MatSnackBarModule, MatTooltipModule,
    MatDialogModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <mat-icon>dns</mat-icon>
        <h1>Instâncias</h1>
        <span class="subtitle">{{ instancias().length }} instâncias monitoradas</span>
      </div>

      <!-- Toolbar -->
      <div class="table-toolbar">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Buscar instância...</mat-label>
          <mat-icon matPrefix>search</mat-icon>
          <input matInput (input)="filtrar($event)" />
        </mat-form-field>

        <mat-form-field appearance="outline" style="min-width:140px">
          <mat-label>Status</mat-label>
          <mat-select [(value)]="filtroStatus" (selectionChange)="aplicarFiltro()">
            <mat-option value="">Todos</mat-option>
            <mat-option value="Online">Online</mat-option>
            <mat-option value="Offline">Offline</mat-option>
          </mat-select>
        </mat-form-field>

        <button mat-flat-button color="primary" (click)="exportarCSV()">
          <mat-icon>download</mat-icon> Exportar CSV
        </button>
        <button mat-flat-button color="primary" (click)="mostrarFormulario.set(!mostrarFormulario())">
          <mat-icon>add</mat-icon> Nova Instância
        </button>
      </div>

      <!-- Formulário nova instância -->
      @if (mostrarFormulario()) {
        <div class="card-container" style="margin-bottom: 20px;">
          <h3>Nova Instância</h3>
          <form [formGroup]="form" (ngSubmit)="salvar()" class="inst-form">
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Nome</mat-label>
                <input matInput formControlName="nome" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Tipo</mat-label>
                <mat-select formControlName="tipo">
                  <mat-option value="SQLServer">SQL Server</mat-option>
                  <mat-option value="MySQL">MySQL</mat-option>
                  <mat-option value="PostgreSQL">PostgreSQL</mat-option>
                  <mat-option value="Oracle">Oracle</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
            <mat-form-field appearance="outline" style="width:100%">
              <mat-label>Connection String</mat-label>
              <input matInput formControlName="connectionString" />
            </mat-form-field>
            <div style="display:flex; gap:8px; justify-content:flex-end">
              <button mat-button type="button" (click)="mostrarFormulario.set(false)">Cancelar</button>
              <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || salvando()">
                @if (salvando()) { <mat-spinner diameter="18" style="display:inline-block"></mat-spinner> }
                @else { Salvar }
              </button>
            </div>
          </form>
        </div>
      }

      @if (loading()) {
        <div class="loading-overlay"><mat-spinner diameter="40"></mat-spinner></div>
      } @else if (instanciasFiltradas().length === 0) {
        <div class="empty-state">
          <mat-icon>dns</mat-icon>
          <p>Nenhuma instância encontrada</p>
        </div>
      } @else {
        <div class="inst-grid">
          @for (inst of instanciasFiltradas(); track inst.id) {
            <div class="inst-card" [class.offline]="inst.status !== 'Online'">
              <div class="inst-card-header">
                <div class="inst-card-title">
                  <span class="nome">{{ inst.nome }}</span>
                  @if (inst.isPrimary) {
                    <span class="primary-badge">PRIMARY</span>
                  }
                </div>
                <span class="status-chip" [class.active]="inst.status === 'Online'" [class.inactive]="inst.status !== 'Online'">
                  {{ inst.status }}
                </span>
              </div>

              <div class="inst-tipo">{{ inst.tipo }}{{ inst.clusterNome ? ' · ' + inst.clusterNome : '' }}</div>

              <div class="metrics-row">
                <div class="metric">
                  <span class="metric-label">Latência</span>
                  <span class="metric-val" [class.metric-warn]="inst.latencia > 200">{{ inst.latencia | number:'1.0-0' }} ms</span>
                </div>
                <div class="metric">
                  <span class="metric-label">Uptime</span>
                  <span class="metric-val">{{ inst.uptime | number:'1.1-1' }}%</span>
                </div>
                <div class="metric">
                  <span class="metric-label">Conexões</span>
                  <span class="metric-val">{{ inst.conexoesAtivas }}</span>
                </div>
                <div class="metric">
                  <span class="metric-label">Score</span>
                  <span class="metric-val score" [class.score-good]="inst.score >= 80" [class.score-bad]="inst.score < 60">
                    {{ inst.score }}
                  </span>
                </div>
              </div>

              <div class="backup-info">
                <mat-icon>backup</mat-icon>
                @if (inst.ultimoBackupEm) {
                  <span>Backup: {{ inst.ultimoBackupEm | date:'dd/MM/yyyy HH:mm' }}</span>
                } @else {
                  <span class="no-backup">Sem backup registrado</span>
                }
              </div>

              <div class="card-actions">
                <button mat-icon-button matTooltip="Excluir" (click)="excluir(inst)">
                  <mat-icon>delete_outline</mat-icon>
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .inst-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }

    .inst-card {
      background: var(--surface); border-radius: 12px; padding: 20px;
      border: 1px solid var(--border); box-shadow: var(--card-shadow);
      transition: box-shadow 0.2s;
      &:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
      &.offline { border-left: 3px solid var(--inactive-color); }
    }

    .inst-card-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 4px; }
    .inst-card-title { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .nome { font-size: 15px; font-weight: 600; color: var(--text); }
    .primary-badge { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 4px;
      background: rgba(121,134,203,0.2); color: var(--primary); letter-spacing: 0.5px; }

    .inst-tipo { font-size: 12px; color: var(--text-ter); margin-bottom: 14px; }

    .metrics-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; margin-bottom: 12px; }
    .metric { display: flex; flex-direction: column; align-items: center; background: var(--input-bg);
      border-radius: 8px; padding: 8px 4px; }
    .metric-label { font-size: 11px; color: var(--text-ter); margin-bottom: 2px; }
    .metric-val { font-size: 14px; font-weight: 600; color: var(--text); }
    .metric-warn { color: var(--inactive-color); }
    .score-good { color: var(--active-color); }
    .score-bad { color: var(--inactive-color); }

    .backup-info { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-sec);
      margin-bottom: 12px;
      mat-icon { font-size: 16px; width: 16px; height: 16px; color: var(--body-label); }
    }
    .no-backup { color: var(--inactive-color); }

    .card-actions { display: flex; justify-content: flex-end; border-top: 1px solid var(--border);
      padding-top: 8px; margin-top: 4px;
      button { color: var(--text-ter) !important;
        &:hover { color: var(--inactive-color) !important; }
      }
    }

    .inst-form { margin-top: 12px; }
  `]
})
export class InstanciasComponent implements OnInit {
  private svc = inject(LbdMonitorService);
  private snack = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  loading = signal(true);
  salvando = signal(false);
  mostrarFormulario = signal(false);
  instancias = signal<InstanciaDto[]>([]);
  instanciasFiltradas = signal<InstanciaDto[]>([]);
  filtroStatus = '';
  private termoBusca = '';

  form = this.fb.group({
    nome: ['', Validators.required],
    tipo: ['SQLServer', Validators.required],
    connectionString: ['', Validators.required]
  });

  ngOnInit() {
    this.carregar();
  }

  carregar() {
    this.loading.set(true);
    this.svc.listarInstancias().subscribe({
      next: (data) => {
        this.instancias.set(data);
        this.aplicarFiltro();
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  filtrar(event: Event) {
    this.termoBusca = (event.target as HTMLInputElement).value.toLowerCase();
    this.aplicarFiltro();
  }

  aplicarFiltro() {
    let lista = this.instancias();
    if (this.termoBusca) lista = lista.filter(i => i.nome.toLowerCase().includes(this.termoBusca));
    if (this.filtroStatus) lista = lista.filter(i => i.status === this.filtroStatus);
    this.instanciasFiltradas.set(lista);
  }

  salvar() {
    if (this.form.invalid) return;
    this.salvando.set(true);
    const v = this.form.value;
    this.svc.criarInstancia({ nome: v.nome!, tipo: v.tipo!, connectionString: v.connectionString! }).subscribe({
      next: () => {
        this.snack.open('Instância criada com sucesso', 'OK', { duration: 3000, panelClass: 'success-snackbar' });
        this.mostrarFormulario.set(false);
        this.form.reset({ tipo: 'SQLServer' });
        this.salvando.set(false);
        this.carregar();
      },
      error: () => {
        this.snack.open('Erro ao criar instância', 'OK', { duration: 3000, panelClass: 'error-snackbar' });
        this.salvando.set(false);
      }
    });
  }

  excluir(inst: InstanciaDto) {
    if (!confirm(`Excluir a instância "${inst.nome}"?`)) return;
    this.svc.excluirInstancia(inst.id).subscribe({
      next: () => {
        this.snack.open('Instância excluída', 'OK', { duration: 3000, panelClass: 'success-snackbar' });
        this.carregar();
      },
      error: () => this.snack.open('Erro ao excluir', 'OK', { duration: 3000, panelClass: 'error-snackbar' })
    });
  }

  exportarCSV() {
    const lista = this.instanciasFiltradas();
    const header = 'Nome,Tipo,Status,Latencia(ms),Uptime(%),Score,Conexoes,UltimoBackup\n';
    const rows = lista.map(i =>
      `"${i.nome}","${i.tipo}","${i.status}",${i.latencia},${i.uptime},${i.score},${i.conexoesAtivas},"${i.ultimoBackupEm ?? ''}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'instancias.csv'; a.click();
    URL.revokeObjectURL(url);
  }
}
