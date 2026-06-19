import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin } from 'rxjs';
import { LbdMonitorService } from '../lbd-monitor.service';
import { ClusterDto, InstanciaDto, BackupResumoDto, IncidenteResumoDto } from '../models';

interface ResumoGeral {
  totalInstancias: number;
  instanciasOnline: number;
  instanciasOffline: number;
  totalClusters: number;
  backupsDentro24h: number;
  backupsDesatualizados: number;
  incidentesAtivos: number;
  incidentesResolvidos: number;
}

@Component({
  selector: 'app-visao-geral',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatTooltipModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <mat-icon>monitor_heart</mat-icon>
        <h1>Visão Geral</h1>
        <span class="subtitle">LBD Monitor — Monitoramento de Bancos de Dados</span>
      </div>

      @if (loading()) {
        <div class="loading-overlay"><mat-spinner diameter="40"></mat-spinner></div>
      } @else {
        <div class="summary-cards">
          <div class="summary-card primary">
            <div class="icon-wrapper primary"><mat-icon>dns</mat-icon></div>
            <div class="info">
              <h3>{{ resumo()?.totalInstancias ?? 0 }}</h3>
              <p>Total de Instâncias</p>
            </div>
          </div>
          <div class="summary-card success">
            <div class="icon-wrapper success"><mat-icon>check_circle</mat-icon></div>
            <div class="info">
              <h3>{{ resumo()?.instanciasOnline ?? 0 }}</h3>
              <p>Online</p>
            </div>
          </div>
          <div class="summary-card warning">
            <div class="icon-wrapper warning"><mat-icon>error</mat-icon></div>
            <div class="info">
              <h3>{{ resumo()?.instanciasOffline ?? 0 }}</h3>
              <p>Offline</p>
            </div>
          </div>
          <div class="summary-card accent">
            <div class="icon-wrapper accent"><mat-icon>device_hub</mat-icon></div>
            <div class="info">
              <h3>{{ resumo()?.totalClusters ?? 0 }}</h3>
              <p>Clusters</p>
            </div>
          </div>
          <div class="summary-card success">
            <div class="icon-wrapper success"><mat-icon>backup</mat-icon></div>
            <div class="info">
              <h3>{{ resumo()?.backupsDentro24h ?? 0 }}</h3>
              <p>Backups em dia</p>
            </div>
          </div>
          <div class="summary-card warning">
            <div class="icon-wrapper warning"><mat-icon>backup_table</mat-icon></div>
            <div class="info">
              <h3>{{ resumo()?.backupsDesatualizados ?? 0 }}</h3>
              <p>Backups atrasados</p>
            </div>
          </div>
          <div class="summary-card warning">
            <div class="icon-wrapper warning"><mat-icon>warning</mat-icon></div>
            <div class="info">
              <h3>{{ resumo()?.incidentesAtivos ?? 0 }}</h3>
              <p>Incidentes ativos</p>
            </div>
          </div>
          <div class="summary-card primary">
            <div class="icon-wrapper primary"><mat-icon>task_alt</mat-icon></div>
            <div class="info">
              <h3>{{ resumo()?.incidentesResolvidos ?? 0 }}</h3>
              <p>Incidentes resolvidos</p>
            </div>
          </div>
        </div>

        <div class="grid-2">
          <!-- Clusters -->
          <div class="card-container">
            <div class="section-header">
              <h2><mat-icon>device_hub</mat-icon> Clusters</h2>
              <a routerLink="/lbd-instancias" mat-button color="primary">Ver instâncias</a>
            </div>
            @if (clusters().length === 0) {
              <div class="empty-state"><mat-icon>device_hub</mat-icon><p>Nenhum cluster cadastrado</p></div>
            } @else {
              <div class="cluster-list">
                @for (c of clusters(); track c.id) {
                  <div class="cluster-item">
                    <div class="cluster-info">
                      <span class="cluster-name">{{ c.nome }}</span>
                      <span class="cluster-tipo">{{ c.tipo }}</span>
                    </div>
                    <div class="cluster-stats">
                      <span class="stat">{{ c.membrosOnline }}/{{ c.totalMembros }} online</span>
                      <span class="score" [class.score-good]="c.score >= 80" [class.score-bad]="c.score < 60">
                        Score: {{ c.score }}
                      </span>
                    </div>
                    <span class="status-chip" [class.active]="c.status === 'Online'" [class.inactive]="c.status !== 'Online'">
                      {{ c.status }}
                    </span>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Instâncias recentes com problemas -->
          <div class="card-container">
            <div class="section-header">
              <h2><mat-icon>dns</mat-icon> Instâncias com atenção</h2>
              <a routerLink="/lbd-instancias" mat-button>Ver todas</a>
            </div>
            @if (instanciasProblema().length === 0) {
              <div class="empty-state"><mat-icon>check_circle</mat-icon><p>Todas as instâncias estão saudáveis</p></div>
            } @else {
              <div class="inst-list">
                @for (inst of instanciasProblema(); track inst.id) {
                  <div class="inst-item">
                    <div class="inst-info">
                      <span class="inst-nome">{{ inst.nome }}</span>
                      <span class="inst-tipo">{{ inst.tipo }}</span>
                    </div>
                    <div class="inst-metrics">
                      <span class="metric-val">{{ inst.latencia | number:'1.0-0' }}ms</span>
                      <span class="metric-label">latência</span>
                    </div>
                    <span class="status-chip" [class.active]="inst.status === 'Online'" [class.inactive]="inst.status !== 'Online'">
                      {{ inst.status }}
                    </span>
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- Quick links -->
        <div class="quick-links">
          <a routerLink="/lbd-backups" class="quick-card">
            <mat-icon>backup</mat-icon><span>Backups</span>
          </a>
          <a routerLink="/lbd-alertas" class="quick-card">
            <mat-icon>notifications_active</mat-icon><span>Alertas</span>
          </a>
          <a routerLink="/lbd-incidentes" class="quick-card">
            <mat-icon>report_problem</mat-icon><span>Incidentes</span>
          </a>
          <a routerLink="/lbd-entregas" class="quick-card">
            <mat-icon>send</mat-icon><span>Entregas</span>
          </a>
          <a routerLink="/lbd-configuracoes" class="quick-card">
            <mat-icon>settings</mat-icon><span>Configurações</span>
          </a>
        </div>
      }
    </div>
  `,
  styles: [`
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
    @media (max-width: 900px) { .grid-2 { grid-template-columns: 1fr; } }

    .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;
      h2 { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 500; color: var(--text); margin: 0;
        mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--body-label); }
      }
    }

    .cluster-list, .inst-list { display: flex; flex-direction: column; gap: 8px; }

    .cluster-item, .inst-item {
      display: flex; align-items: center; gap: 12px; padding: 12px;
      background: var(--input-bg); border-radius: 8px; border: 1px solid var(--border);
    }

    .cluster-info, .inst-info { flex: 1; display: flex; flex-direction: column; }
    .cluster-name, .inst-nome { font-weight: 500; font-size: 14px; color: var(--text); }
    .cluster-tipo, .inst-tipo { font-size: 12px; color: var(--text-ter); }

    .cluster-stats { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
    .stat { font-size: 12px; color: var(--text-sec); }

    .score { font-size: 12px; font-weight: 600; }
    .score-good { color: var(--active-color); }
    .score-bad { color: var(--inactive-color); }

    .inst-metrics { display: flex; flex-direction: column; align-items: flex-end; }
    .metric-val { font-size: 14px; font-weight: 600; color: var(--text); }
    .metric-label { font-size: 11px; color: var(--text-ter); }

    .quick-links { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
    @media (max-width: 700px) { .quick-links { grid-template-columns: repeat(2, 1fr); } }

    .quick-card {
      display: flex; flex-direction: column; align-items: center; gap: 10px;
      padding: 20px 12px; background: var(--surface); border-radius: 12px;
      border: 1px solid var(--border); text-decoration: none;
      color: var(--text-sec); transition: all 0.2s;
      mat-icon { font-size: 28px; width: 28px; height: 28px; color: var(--body-label); }
      span { font-size: 13px; font-weight: 500; }
      &:hover { background: var(--nav-active); color: var(--text); border-color: var(--primary); }
    }
  `]
})
export class VisaoGeralComponent implements OnInit {
  private svc = inject(LbdMonitorService);

  loading = signal(true);
  resumo = signal<ResumoGeral | null>(null);
  clusters = signal<ClusterDto[]>([]);
  instanciasProblema = signal<InstanciaDto[]>([]);

  ngOnInit() {
    forkJoin({
      instancias: this.svc.listarInstancias(),
      clusters: this.svc.listarClusters(),
      backups: this.svc.resumoBackups(),
      incidentes: this.svc.resumoIncidentes()
    }).subscribe({
      next: ({ instancias, clusters, backups, incidentes }) => {
        this.resumo.set({
          totalInstancias: instancias.length,
          instanciasOnline: instancias.filter(i => i.status === 'Online').length,
          instanciasOffline: instancias.filter(i => i.status !== 'Online').length,
          totalClusters: clusters.length,
          backupsDentro24h: backups.dentro24h,
          backupsDesatualizados: backups.desatualizados,
          incidentesAtivos: incidentes.ativos,
          incidentesResolvidos: incidentes.resolvidos
        });
        this.clusters.set(clusters.slice(0, 5));
        this.instanciasProblema.set(
          instancias.filter(i => i.status !== 'Online' || i.latencia > 200).slice(0, 5)
        );
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
