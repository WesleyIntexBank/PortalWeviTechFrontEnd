import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { LbdMonitorService } from '../lbd-monitor.service';
import { ConfiguracaoDto } from '../models';

@Component({
  selector: 'app-configuracoes',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule,
    MatTabsModule, MatProgressSpinnerModule, MatSnackBarModule,
    MatSelectModule, MatSlideToggleModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <mat-icon>settings</mat-icon>
        <h1>Configurações</h1>
        <span class="subtitle">Parâmetros do LBD Monitor</span>
      </div>

      @if (loading()) {
        <div class="loading-overlay"><mat-spinner diameter="40"></mat-spinner></div>
      } @else {
        <mat-tab-group animationDuration="150ms">

          <!-- Geral -->
          <mat-tab label="Geral">
            <div class="tab-content">
              <div class="card-container">
                <h3>Retenção de Dados</h3>
                <p class="desc">Define por quantos dias os dados de métricas, alertas e backups são mantidos.</p>
                <form [formGroup]="retencaoForm" (ngSubmit)="salvarRetencao()" class="config-form">
                  <mat-form-field appearance="outline" style="max-width: 200px;">
                    <mat-label>Dias de retenção</mat-label>
                    <input matInput type="number" formControlName="dias" min="1" max="365" />
                  </mat-form-field>
                  <button mat-flat-button color="primary" type="submit" [disabled]="retencaoForm.invalid || salvando()">
                    @if (salvando()) { <mat-spinner diameter="18" style="display:inline-block"></mat-spinner> }
                    @else { Salvar }
                  </button>
                </form>
              </div>

              <div class="card-container" style="margin-top: 16px;">
                <h3>Intervalo de Coleta</h3>
                <p class="desc">Intervalo em minutos para coleta de métricas (padrão: 1 minuto). Altere com cautela.</p>
                <form [formGroup]="coletaForm" (ngSubmit)="salvarChave('coleta_intervalo_minutos', coletaForm.value.valor!.toString())" class="config-form">
                  <mat-form-field appearance="outline" style="max-width: 200px;">
                    <mat-label>Intervalo (minutos)</mat-label>
                    <input matInput type="number" formControlName="valor" min="1" max="60" />
                  </mat-form-field>
                  <button mat-flat-button color="primary" type="submit" [disabled]="coletaForm.invalid || salvando()">
                    <mat-icon>save</mat-icon> Salvar
                  </button>
                </form>
              </div>
            </div>
          </mat-tab>

          <!-- E-mail -->
          <mat-tab label="E-mail">
            <div class="tab-content">
              <div class="card-container">
                <h3>Configuração de E-mail (SMTP)</h3>
                <form [formGroup]="emailForm" (ngSubmit)="salvarEmail()" class="config-form-grid">
                  <mat-form-field appearance="outline">
                    <mat-label>Servidor SMTP</mat-label>
                    <input matInput formControlName="host" />
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Porta</mat-label>
                    <input matInput type="number" formControlName="porta" />
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Usuário</mat-label>
                    <input matInput formControlName="usuario" />
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Senha</mat-label>
                    <input matInput type="password" formControlName="senha" />
                  </mat-form-field>
                  <mat-form-field appearance="outline" style="grid-column: 1/-1">
                    <mat-label>E-mail remetente</mat-label>
                    <input matInput formControlName="remetente" />
                  </mat-form-field>
                  <div style="grid-column: 1/-1; display:flex; justify-content:flex-end;">
                    <button mat-flat-button color="primary" type="submit" [disabled]="salvando()">
                      <mat-icon>save</mat-icon> Salvar configurações de e-mail
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </mat-tab>

          <!-- Integrações -->
          <mat-tab label="Integrações">
            <div class="tab-content">
              <div class="card-container">
                <h3>Webhooks</h3>
                <p class="desc">URL do webhook para envio de alertas críticos.</p>
                <form [formGroup]="webhookForm" (ngSubmit)="salvarChave('webhook_url', webhookForm.value.url!)" class="config-form">
                  <mat-form-field appearance="outline" style="flex: 1">
                    <mat-label>URL do Webhook</mat-label>
                    <input matInput formControlName="url" />
                  </mat-form-field>
                  <button mat-flat-button color="primary" type="submit" [disabled]="salvando()">
                    <mat-icon>save</mat-icon> Salvar
                  </button>
                </form>
              </div>
            </div>
          </mat-tab>

          <!-- Todas as configurações -->
          <mat-tab label="Administração">
            <div class="tab-content">
              <div class="card-container">
                <h3>Todas as Configurações</h3>
                @if (configuracoes().length === 0) {
                  <div class="empty-state"><mat-icon>settings</mat-icon><p>Nenhuma configuração salva</p></div>
                } @else {
                  <table class="config-table">
                    <thead>
                      <tr><th>Chave</th><th>Valor</th><th>Atualizado em</th></tr>
                    </thead>
                    <tbody>
                      @for (c of configuracoes(); track c.id) {
                        <tr>
                          <td><code>{{ c.chave }}</code></td>
                          <td>{{ c.valor }}</td>
                          <td>{{ c.atualizadoEm | date:'dd/MM/yyyy HH:mm' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                }
              </div>
            </div>
          </mat-tab>

        </mat-tab-group>
      }
    </div>
  `,
  styles: [`
    .tab-content { padding: 20px 0; }

    .desc { font-size: 13px; color: var(--text-sec); margin-bottom: 16px; }

    .config-form { display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
      mat-form-field { flex-shrink: 0; }
    }

    .config-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
      @media (max-width: 600px) { grid-template-columns: 1fr; }
    }

    .config-table { width: 100%; border-collapse: collapse;
      th, td { padding: 10px 16px; text-align: left; border-bottom: 1px solid var(--border); font-size: 13px; }
      th { color: var(--text-ter); font-weight: 600; font-size: 11px; text-transform: uppercase; }
      td { color: var(--text); }
      tr:hover td { background: var(--row-hover); }
      code { background: var(--input-bg); padding: 2px 6px; border-radius: 4px; color: var(--body-label); font-size: 12px; }
    }
  `]
})
export class ConfiguracoesComponent implements OnInit {
  private svc = inject(LbdMonitorService);
  private snack = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  loading = signal(true);
  salvando = signal(false);
  configuracoes = signal<ConfiguracaoDto[]>([]);

  retencaoForm = this.fb.group({ dias: [30, [Validators.required, Validators.min(1), Validators.max(365)]] });
  coletaForm = this.fb.group({ valor: [1, [Validators.required, Validators.min(1), Validators.max(60)]] });
  emailForm = this.fb.group({
    host: [''], porta: [587], usuario: [''], senha: [''], remetente: ['']
  });
  webhookForm = this.fb.group({ url: [''] });

  ngOnInit() {
    this.svc.listarConfiguracoes().subscribe({
      next: (data) => {
        this.configuracoes.set(data);
        this.preencherFormularios(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
    this.svc.obterRetencao().subscribe({
      next: (r) => this.retencaoForm.patchValue({ dias: r.dias }),
      error: () => {}
    });
  }

  private preencherFormularios(configs: ConfiguracaoDto[]) {
    const get = (chave: string) => configs.find(c => c.chave === chave)?.valor;
    const coleta = get('coleta_intervalo_minutos');
    if (coleta) this.coletaForm.patchValue({ valor: parseInt(coleta) });
    const smtpHost = get('smtp_host');
    if (smtpHost) this.emailForm.patchValue({
      host: smtpHost,
      porta: parseInt(get('smtp_porta') ?? '587'),
      usuario: get('smtp_usuario') ?? '',
      remetente: get('smtp_remetente') ?? ''
    });
    const webhook = get('webhook_url');
    if (webhook) this.webhookForm.patchValue({ url: webhook });
  }

  salvarRetencao() {
    if (this.retencaoForm.invalid) return;
    this.salvarChave('retencao_dias', this.retencaoForm.value.dias!.toString());
  }

  salvarEmail() {
    const v = this.emailForm.value;
    this.salvando.set(true);
    const chaves = [
      { chave: 'smtp_host', valor: v.host ?? '' },
      { chave: 'smtp_porta', valor: (v.porta ?? 587).toString() },
      { chave: 'smtp_usuario', valor: v.usuario ?? '' },
      { chave: 'smtp_remetente', valor: v.remetente ?? '' }
    ];
    const requests = chaves.map(k => this.svc.salvarConfiguracao(k.chave, k.valor));
    let count = 0;
    requests.forEach(r => r.subscribe({ next: () => { count++; if (count === requests.length) this.afterSave(); }, error: () => this.afterSave() }));
  }

  salvarChave(chave: string, valor: string) {
    this.salvando.set(true);
    this.svc.salvarConfiguracao(chave, valor).subscribe({
      next: () => this.afterSave(),
      error: () => { this.snack.open('Erro ao salvar', 'OK', { duration: 3000, panelClass: 'error-snackbar' }); this.salvando.set(false); }
    });
  }

  private afterSave() {
    this.snack.open('Configuração salva com sucesso', 'OK', { duration: 3000, panelClass: 'success-snackbar' });
    this.salvando.set(false);
    this.svc.listarConfiguracoes().subscribe({ next: (d) => this.configuracoes.set(d), error: () => {} });
  }
}
