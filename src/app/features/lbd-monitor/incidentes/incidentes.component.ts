import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { LbdMonitorService } from '../lbd-monitor.service';
import { IncidenteDto, IncidenteResumoDto } from '../models';

@Component({
  selector: 'app-incidentes',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatExpansionModule, MatTabsModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <mat-icon>report_problem</mat-icon>
        <h1>Incidentes</h1>
        <span class="subtitle">Gestão e acompanhamento de incidentes</span>
      </div>

      <!-- Cards resumo -->
      <div class="summary-cards" style="grid-template-columns: repeat(auto-fill,minmax(200px,1fr)); margin-bottom: 24px;">
        <div class="summary-card warning">
          <div class="icon-wrapper warning"><mat-icon>report_problem</mat-icon></div>
          <div class="info">
            <h3>{{ resumo().ativos }}</h3>
            <p>Incidentes ativos</p>
          </div>
        </div>
        <div class="summary-card success">
          <div class="icon-wrapper success"><mat-icon>task_alt</mat-icon></div>
          <div class="info">
            <h3>{{ resumo().resolvidos }}</h3>
            <p>Resolvidos</p>
          </div>
        </div>
        <div class="summary-card primary">
          <div class="icon-wrapper primary"><mat-icon>history</mat-icon></div>
          <div class="info">
            <h3>{{ resumo().totalRegistrado }}</h3>
            <p>Total registrado</p>
          </div>
        </div>
      </div>

      <mat-tab-group animationDuration="150ms">
        <!-- Ativos -->
        <mat-tab label="Ativos ({{ incidentesAtivos().length }})">
          <div style="padding-top: 16px;">
            @if (loadingAtivos()) {
              <div class="loading-overlay"><mat-spinner diameter="40"></mat-spinner></div>
            } @else if (incidentesAtivos().length === 0) {
              <div class="empty-state"><mat-icon>check_circle</mat-icon><p>Sem incidentes ativos</p></div>
            } @else {
              <mat-accordion multi>
                @for (inc of incidentesAtivos(); track inc.id) {
                  <mat-expansion-panel class="inc-panel">
                    <mat-expansion-panel-header>
                      <mat-panel-title>
                        <mat-icon class="inc-icon active-icon">report_problem</mat-icon>
                        <span class="inc-titulo">{{ inc.titulo }}</span>
                      </mat-panel-title>
                      <mat-panel-description>
                        <span class="inst-badge">{{ inc.instanciaNome }}</span>
                        <span class="ts">{{ inc.iniciadoEm | date:'dd/MM/yyyy HH:mm' }}</span>
                      </mat-panel-description>
                    </mat-expansion-panel-header>

                    <div class="timeline">
                      @for (t of inc.timeline; track t.id) {
                        <div class="timeline-item" [class]="'tl-' + t.tipo.toLowerCase()">
                          <div class="tl-dot"></div>
                          <div class="tl-content">
                            <p class="tl-msg">{{ t.mensagem }}</p>
                            <div class="tl-meta">
                              @if (t.autor) { <span class="tl-autor">{{ t.autor }}</span> }
                              <span class="ts">{{ t.criadoEm | date:'dd/MM HH:mm' }}</span>
                            </div>
                          </div>
                        </div>
                      }
                    </div>

                    <!-- Comentário -->
                    <div class="comentario-form">
                      <mat-form-field appearance="outline" style="width:100%">
                        <mat-label>Adicionar comentário...</mat-label>
                        <input matInput [id]="'comentario-' + inc.id" />
                      </mat-form-field>
                      <button mat-flat-button color="primary" (click)="comentar(inc)">
                        <mat-icon>send</mat-icon> Comentar
                      </button>
                    </div>
                  </mat-expansion-panel>
                }
              </mat-accordion>
            }
          </div>
        </mat-tab>

        <!-- Resolvidos -->
        <mat-tab label="Resolvidos ({{ incidentesResolvidos().length }})">
          <div style="padding-top: 16px;">
            @if (loadingResolvidos()) {
              <div class="loading-overlay"><mat-spinner diameter="40"></mat-spinner></div>
            } @else if (incidentesResolvidos().length === 0) {
              <div class="empty-state"><mat-icon>history</mat-icon><p>Nenhum incidente resolvido</p></div>
            } @else {
              <mat-accordion multi>
                @for (inc of incidentesResolvidos(); track inc.id) {
                  <mat-expansion-panel class="inc-panel resolved">
                    <mat-expansion-panel-header>
                      <mat-panel-title>
                        <mat-icon class="inc-icon resolved-icon">check_circle</mat-icon>
                        <span class="inc-titulo">{{ inc.titulo }}</span>
                      </mat-panel-title>
                      <mat-panel-description>
                        <span class="inst-badge">{{ inc.instanciaNome }}</span>
                        <span class="ts">Resolvido: {{ inc.resolvidoEm | date:'dd/MM/yyyy HH:mm' }}</span>
                      </mat-panel-description>
                    </mat-expansion-panel-header>
                    <div class="timeline">
                      @for (t of inc.timeline; track t.id) {
                        <div class="timeline-item" [class]="'tl-' + t.tipo.toLowerCase()">
                          <div class="tl-dot"></div>
                          <div class="tl-content">
                            <p class="tl-msg">{{ t.mensagem }}</p>
                            <div class="tl-meta">
                              @if (t.autor) { <span class="tl-autor">{{ t.autor }}</span> }
                              <span class="ts">{{ t.criadoEm | date:'dd/MM HH:mm' }}</span>
                            </div>
                          </div>
                        </div>
                      }
                    </div>
                  </mat-expansion-panel>
                }
              </mat-accordion>
            }
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .inc-panel { background: var(--surface) !important; margin-bottom: 8px !important; border-radius: 8px !important;
      border: 1px solid var(--border) !important; }
    .inc-panel.resolved { opacity: 0.8; }

    .inc-icon { font-size: 20px; width: 20px; height: 20px; margin-right: 10px; flex-shrink: 0; }
    .active-icon { color: var(--inactive-color); }
    .resolved-icon { color: var(--active-color); }

    .inc-titulo { font-size: 14px; font-weight: 500; color: var(--text); }

    .inst-badge { font-size: 11px; padding: 2px 8px; background: rgba(121,134,203,0.2);
      color: var(--primary); border-radius: 4px; margin-right: 8px; }

    .ts { font-size: 11px; color: var(--text-ter); }

    .timeline { display: flex; flex-direction: column; gap: 0; padding: 8px 0; border-left: 2px solid var(--border); margin-left: 12px; }

    .timeline-item { display: flex; align-items: flex-start; gap: 12px; padding: 6px 0 6px 16px; position: relative; }
    .tl-dot { position: absolute; left: -5px; top: 12px; width: 8px; height: 8px; border-radius: 50%;
      background: var(--border); border: 2px solid var(--surface); }
    .tl-system .tl-dot { background: var(--primary); }
    .tl-comentario .tl-dot { background: var(--accent); }
    .tl-alerta .tl-dot { background: var(--inactive-color); }

    .tl-content { flex: 1; }
    .tl-msg { font-size: 13px; color: var(--text); margin: 0 0 4px; }
    .tl-meta { display: flex; align-items: center; gap: 8px; }
    .tl-autor { font-size: 11px; font-weight: 500; color: var(--label); }

    .comentario-form { display: flex; gap: 8px; align-items: center; margin-top: 12px; padding-top: 12px;
      border-top: 1px solid var(--border); }
  `]
})
export class IncidentesComponent implements OnInit {
  private svc = inject(LbdMonitorService);
  private snack = inject(MatSnackBar);

  loadingAtivos = signal(true);
  loadingResolvidos = signal(true);
  incidentesAtivos = signal<IncidenteDto[]>([]);
  incidentesResolvidos = signal<IncidenteDto[]>([]);
  resumo = signal<IncidenteResumoDto>({ ativos: 0, resolvidos: 0, totalRegistrado: 0 });

  ngOnInit() {
    this.svc.resumoIncidentes().subscribe({ next: (r) => this.resumo.set(r), error: () => {} });
    this.svc.listarIncidentesAtivos().subscribe({
      next: (d) => { this.incidentesAtivos.set(d); this.loadingAtivos.set(false); },
      error: () => this.loadingAtivos.set(false)
    });
    this.svc.listarIncidentesResolvidos().subscribe({
      next: (d) => { this.incidentesResolvidos.set(d); this.loadingResolvidos.set(false); },
      error: () => this.loadingResolvidos.set(false)
    });
  }

  comentar(inc: IncidenteDto) {
    const input = document.getElementById(`comentario-${inc.id}`) as HTMLInputElement;
    const texto = input?.value?.trim();
    if (!texto) return;
    this.svc.adicionarComentario(inc.id, texto, 'Portal').subscribe({
      next: () => {
        this.snack.open('Comentário adicionado', 'OK', { duration: 3000, panelClass: 'success-snackbar' });
        input.value = '';
        this.svc.obterIncidente(inc.id).subscribe({
          next: (atualizado) => {
            this.incidentesAtivos.update(lista => lista.map(i => i.id === inc.id ? atualizado : i));
          }
        });
      },
      error: () => this.snack.open('Erro ao comentar', 'OK', { duration: 3000, panelClass: 'error-snackbar' })
    });
  }
}
