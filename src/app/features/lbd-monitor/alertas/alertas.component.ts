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
import { LbdMonitorService } from '../lbd-monitor.service';
import { AlertaDto, RegraAlertaDto } from '../models';

@Component({
  selector: 'app-alertas',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatProgressSpinnerModule, MatSnackBarModule, MatTooltipModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <mat-icon>notifications_active</mat-icon>
        <h1>Alertas</h1>
        <span class="subtitle">Monitoramento e regras de alerta</span>
      </div>

      <!-- Filtros de status -->
      <div class="filtros-status">
        @for (s of statusOpcoes; track s.valor) {
          <button mat-stroked-button [class.ativo]="filtroStatus() === s.valor" (click)="mudarFiltro(s.valor)">
            {{ s.label }}
          </button>
        }
      </div>

      <div class="alertas-layout">

        <!-- Coluna esquerda: histórico de alertas -->
        <div class="col-alertas">
          <div class="card-container">
            <h3>Histórico de Alertas</h3>
            @if (loadingAlertas()) {
              <div class="loading-overlay"><mat-spinner diameter="32"></mat-spinner></div>
            } @else if (alertas().length === 0) {
              <div class="empty-state"><mat-icon>notifications_none</mat-icon><p>Nenhum alerta encontrado</p></div>
            } @else {
              <div class="alerta-list">
                @for (a of alertas(); track a.id) {
                  <div class="alerta-item" [class]="'sev-' + a.severidade.toLowerCase()">
                    <div class="alerta-icon">
                      <mat-icon>{{ a.severidade === 'CRITICAL' ? 'error' : 'warning' }}</mat-icon>
                    </div>
                    <div class="alerta-body">
                      <p class="alerta-msg">{{ a.mensagem }}</p>
                      <div class="alerta-meta">
                        @if (a.instanciaNome) { <span class="inst-badge">{{ a.instanciaNome }}</span> }
                        <span class="sev-badge sev-{{ a.severidade.toLowerCase() }}">{{ a.severidade }}</span>
                        <span class="ts">{{ a.criadoEm | date:'dd/MM HH:mm' }}</span>
                      </div>
                    </div>
                    <div class="alerta-actions">
                      @if (a.statusAlerta === 'Ativo') {
                        <button mat-icon-button matTooltip="Resolver" (click)="resolver(a)">
                          <mat-icon>check_circle_outline</mat-icon>
                        </button>
                      } @else {
                        <mat-icon class="resolved-icon">check_circle</mat-icon>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- Coluna direita: criar regra + regras ativas -->
        <div class="col-regras">
          <!-- Nova Regra -->
          <div class="card-container" style="margin-bottom:16px">
            <h3>Nova Regra de Alerta</h3>
            <form [formGroup]="regraForm" (ngSubmit)="criarRegra()" class="regra-form">
              <mat-form-field appearance="outline">
                <mat-label>Nome da regra</mat-label>
                <input matInput formControlName="nome" />
              </mat-form-field>
              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Tipo</mat-label>
                  <mat-select formControlName="tipo">
                    <mat-option value="LATENCIA">Latência</mat-option>
                    <mat-option value="MEMORIA">Memória</mat-option>
                    <mat-option value="STATUS">Status</mat-option>
                    <mat-option value="BACKUP">Backup</mat-option>
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Operador</mat-label>
                  <mat-select formControlName="operador">
                    <mat-option value="MaiorQue">Maior que</mat-option>
                    <mat-option value="MenorQue">Menor que</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Valor limite</mat-label>
                  <input matInput type="number" formControlName="valorLimite" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Severidade</mat-label>
                  <mat-select formControlName="severidade">
                    <mat-option value="WARNING">WARNING</mat-option>
                    <mat-option value="CRITICAL">CRITICAL</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
              <mat-form-field appearance="outline">
                <mat-label>Ação</mat-label>
                <mat-select formControlName="acao">
                  <mat-option value="Avise">Avise</mat-option>
                  <mat-option value="Alerte">Alerte</mat-option>
                </mat-select>
              </mat-form-field>
              <button mat-flat-button color="primary" type="submit" [disabled]="regraForm.invalid || salvandoRegra()">
                @if (salvandoRegra()) { <mat-spinner diameter="18" style="display:inline-block"></mat-spinner> }
                @else { Criar Regra }
              </button>
            </form>
          </div>

          <!-- Regras ativas -->
          <div class="card-container">
            <h3>Regras Ativas</h3>
            @if (loadingRegras()) {
              <div class="loading-overlay"><mat-spinner diameter="32"></mat-spinner></div>
            } @else if (regras().length === 0) {
              <div class="empty-state"><mat-icon>rule</mat-icon><p>Nenhuma regra cadastrada</p></div>
            } @else {
              <div class="regra-list">
                @for (r of regras(); track r.id) {
                  <div class="regra-item">
                    <div class="regra-info">
                      <span class="regra-nome">{{ r.nome }}</span>
                      <span class="regra-desc">
                        {{ r.tipo }} {{ r.operador === 'MaiorQue' ? '>' : '<' }} {{ r.valorLimite }}
                      </span>
                    </div>
                    <div class="regra-badges">
                      <span class="sev-badge sev-{{ r.severidade.toLowerCase() }}">{{ r.severidade }}</span>
                      <span class="acao-badge">{{ r.acao }}</span>
                    </div>
                    <button mat-icon-button matTooltip="Excluir regra" (click)="excluirRegra(r)">
                      <mat-icon>delete_outline</mat-icon>
                    </button>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .filtros-status { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap;
      button { border-radius: 20px !important; font-size: 13px; }
      button.ativo { background: var(--nav-active); border-color: var(--nav-active-border); color: var(--text); }
    }

    .alertas-layout { display: grid; grid-template-columns: 1fr 400px; gap: 20px; align-items: start; }
    @media (max-width: 1024px) { .alertas-layout { grid-template-columns: 1fr; } }

    .col-alertas, .col-regras { display: flex; flex-direction: column; }

    .alerta-list { display: flex; flex-direction: column; gap: 8px; }

    .alerta-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px;
      border-radius: 8px; border: 1px solid var(--border); background: var(--input-bg); }

    .alerta-icon mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .sev-critical .alerta-icon mat-icon { color: #ef5350; }
    .sev-warning .alerta-icon mat-icon { color: #ffa726; }

    .alerta-body { flex: 1; }
    .alerta-msg { font-size: 13px; color: var(--text); margin: 0 0 6px; }
    .alerta-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

    .inst-badge { font-size: 11px; padding: 2px 8px; background: rgba(121,134,203,0.2);
      color: var(--primary); border-radius: 4px; }

    .sev-badge { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; }
    .sev-critical { background: rgba(244,67,54,0.2); color: #ef5350; }
    .sev-warning { background: rgba(255,167,38,0.2); color: #ffa726; }

    .ts { font-size: 11px; color: var(--text-ter); }

    .alerta-actions { display: flex; align-items: center;
      button { color: var(--active-color) !important; }
    }
    .resolved-icon { color: var(--active-color); font-size: 20px; width: 20px; height: 20px; margin: 8px; }

    .regra-form { display: flex; flex-direction: column; gap: 4px; margin-top: 8px;
      mat-form-field { width: 100%; }
    }

    .regra-list { display: flex; flex-direction: column; gap: 8px; }
    .regra-item { display: flex; align-items: center; gap: 12px; padding: 12px;
      border-radius: 8px; border: 1px solid var(--border); background: var(--input-bg); }

    .regra-info { flex: 1; display: flex; flex-direction: column; }
    .regra-nome { font-size: 13px; font-weight: 500; color: var(--text); }
    .regra-desc { font-size: 12px; color: var(--text-ter); }

    .regra-badges { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
    .acao-badge { font-size: 11px; padding: 2px 8px; background: var(--input-bg);
      border: 1px solid var(--border); border-radius: 4px; color: var(--text-sec); }
  `]
})
export class AlertasComponent implements OnInit {
  private svc = inject(LbdMonitorService);
  private snack = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  loadingAlertas = signal(true);
  loadingRegras = signal(true);
  salvandoRegra = signal(false);
  alertas = signal<AlertaDto[]>([]);
  regras = signal<RegraAlertaDto[]>([]);
  filtroStatus = signal('');

  statusOpcoes = [
    { valor: '', label: 'Todos' },
    { valor: 'Ativo', label: 'Ativos' },
    { valor: 'Resolvido', label: 'Resolvidos' }
  ];

  regraForm = this.fb.group({
    nome: ['', Validators.required],
    tipo: ['LATENCIA', Validators.required],
    operador: ['MaiorQue', Validators.required],
    valorLimite: [300, [Validators.required, Validators.min(0)]],
    severidade: ['WARNING', Validators.required],
    acao: ['Avise', Validators.required]
  });

  ngOnInit() {
    this.carregarAlertas();
    this.carregarRegras();
  }

  mudarFiltro(status: string) {
    this.filtroStatus.set(status);
    this.carregarAlertas();
  }

  carregarAlertas() {
    this.loadingAlertas.set(true);
    this.svc.listarAlertas(this.filtroStatus() || undefined).subscribe({
      next: (data) => { this.alertas.set(data); this.loadingAlertas.set(false); },
      error: () => this.loadingAlertas.set(false)
    });
  }

  carregarRegras() {
    this.loadingRegras.set(true);
    this.svc.listarRegras().subscribe({
      next: (data) => { this.regras.set(data); this.loadingRegras.set(false); },
      error: () => this.loadingRegras.set(false)
    });
  }

  resolver(a: AlertaDto) {
    this.svc.resolverAlerta(a.id).subscribe({
      next: () => {
        this.snack.open('Alerta resolvido', 'OK', { duration: 3000, panelClass: 'success-snackbar' });
        this.carregarAlertas();
      },
      error: () => this.snack.open('Erro ao resolver alerta', 'OK', { duration: 3000, panelClass: 'error-snackbar' })
    });
  }

  criarRegra() {
    if (this.regraForm.invalid) return;
    this.salvandoRegra.set(true);
    const v = this.regraForm.value;
    this.svc.criarRegra({
      nome: v.nome!, tipo: v.tipo!, operador: v.operador!,
      valorLimite: v.valorLimite!, severidade: v.severidade!, acao: v.acao!
    }).subscribe({
      next: () => {
        this.snack.open('Regra criada', 'OK', { duration: 3000, panelClass: 'success-snackbar' });
        this.salvandoRegra.set(false);
        this.regraForm.reset({ tipo: 'LATENCIA', operador: 'MaiorQue', valorLimite: 300, severidade: 'WARNING', acao: 'Avise' });
        this.carregarRegras();
      },
      error: () => {
        this.snack.open('Erro ao criar regra', 'OK', { duration: 3000, panelClass: 'error-snackbar' });
        this.salvandoRegra.set(false);
      }
    });
  }

  excluirRegra(r: RegraAlertaDto) {
    if (!confirm(`Excluir a regra "${r.nome}"?`)) return;
    this.svc.excluirRegra(r.id).subscribe({
      next: () => {
        this.snack.open('Regra excluída', 'OK', { duration: 3000, panelClass: 'success-snackbar' });
        this.carregarRegras();
      },
      error: () => this.snack.open('Erro ao excluir regra', 'OK', { duration: 3000, panelClass: 'error-snackbar' })
    });
  }
}
