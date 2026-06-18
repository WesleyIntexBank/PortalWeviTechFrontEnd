import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { ConfigurationParamsService } from '../../core/services/configuration-params.service';
import { ConfigurationParams } from '../../core/models/configuration-params.model';
import { ConfigurationParamsFormComponent } from './configuration-params-form.component';

@Component({
  selector: 'app-configuracoes-parametros',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatTableModule, MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatSelectModule, MatCheckboxModule,
    MatSnackBarModule, MatDialogModule, MatCardModule,
    MatProgressSpinnerModule, MatTooltipModule, MatChipsModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <mat-icon>settings</mat-icon>
        <h1>Parâmetros de Configuração</h1>
        <span class="subtitle">Gerencie credenciais e configurações externas</span>
      </div>

      <div class="card-container">
        <div class="toolbar">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Filtrar</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input matInput [(ngModel)]="filter" (ngModelChange)="applyFilter()" placeholder="Fonte, parâmetro ou descrição">
          </mat-form-field>

          <button mat-flat-button color="primary" (click)="openForm()">
            <mat-icon>add</mat-icon> Novo Parâmetro
          </button>
        </div>

        @if (loading()) {
          <div class="loading-overlay"><mat-spinner diameter="48"></mat-spinner></div>
        } @else {
          <div class="fonte-groups">
            @for (group of filteredGroups(); track group.fonte) {
              <mat-card class="fonte-card">
                <mat-card-header>
                  <mat-icon mat-card-avatar>key</mat-icon>
                  <mat-card-title>{{ group.fonte }}</mat-card-title>
                  <mat-card-subtitle>{{ group.items.length }} parâmetro(s)</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <table mat-table [dataSource]="group.items" class="params-table">
                    <ng-container matColumnDef="parametro">
                      <th mat-header-cell *matHeaderCellDef>Parâmetro</th>
                      <td mat-cell *matCellDef="let row">
                        <code class="param-code">{{ row.parametro }}</code>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="descricao">
                      <th mat-header-cell *matHeaderCellDef>Descrição</th>
                      <td mat-cell *matCellDef="let row">{{ row.descricao }}</td>
                    </ng-container>

                    <ng-container matColumnDef="valor">
                      <th mat-header-cell *matHeaderCellDef>Valor</th>
                      <td mat-cell *matCellDef="let row">
                        <span class="valor-mask" [title]="row.valor">
                          {{ maskValue(row.valor) }}
                        </span>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="ativo">
                      <th mat-header-cell *matHeaderCellDef>Ativo</th>
                      <td mat-cell *matCellDef="let row">
                        <mat-icon [style.color]="row.ativo ? 'var(--success)' : 'var(--error)'">
                          {{ row.ativo ? 'check_circle' : 'cancel' }}
                        </mat-icon>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="acoes">
                      <th mat-header-cell *matHeaderCellDef>Ações</th>
                      <td mat-cell *matCellDef="let row">
                        <button mat-icon-button color="primary" (click)="openForm(row)" matTooltip="Editar">
                          <mat-icon>edit</mat-icon>
                        </button>
                        <button mat-icon-button color="warn" (click)="confirmDelete(row)" matTooltip="Excluir">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="columns"></tr>
                    <tr mat-row *matRowDef="let row; columns: columns"></tr>
                  </table>
                </mat-card-content>
              </mat-card>
            }

            @if (filteredGroups().length === 0) {
              <div class="empty-state">
                <mat-icon>search_off</mat-icon>
                <p>Nenhum parâmetro encontrado</p>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .toolbar {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .search-field {
      flex: 1;
      min-width: 200px;
      max-width: 400px;
    }

    .fonte-groups {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .fonte-card {
      background: var(--surface) !important;
      border: 1px solid var(--border) !important;
      border-radius: 8px !important;
      --mat-card-title-text-color: var(--text);
      --mat-card-subtitle-text-color: var(--text-sec);
    }

    .params-table {
      width: 100%;
      background: transparent;
    }

    .params-table th, .params-table td {
      color: var(--text);
      border-bottom-color: var(--border);
    }

    .params-table th {
      color: var(--text-sec);
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
    }

    .param-code {
      font-family: monospace;
      font-size: 13px;
      background: var(--input-bg);
      padding: 2px 8px;
      border-radius: 4px;
      border: 1px solid var(--border);
      color: var(--active-color);
    }

    .valor-mask {
      font-family: monospace;
      font-size: 13px;
      color: var(--text-sec);
      cursor: default;
    }
  `]
})
export class ConfiguracoesParametrosComponent implements OnInit {
  private service = inject(ConfigurationParamsService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  loading = signal(true);
  all = signal<ConfigurationParams[]>([]);
  filteredGroups = signal<{ fonte: string; items: ConfigurationParams[] }[]>([]);
  filter = '';
  columns = ['parametro', 'descricao', 'valor', 'ativo', 'acoes'];

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.service.getAll().subscribe({
      next: (data) => {
        this.all.set(data);
        this.applyFilter();
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Erro ao carregar parâmetros', 'OK', { duration: 4000 });
        this.loading.set(false);
      }
    });
  }

  applyFilter() {
    const q = this.filter.toLowerCase();
    const filtered = this.all().filter(p =>
      !q ||
      p.fonte.toLowerCase().includes(q) ||
      p.parametro.toLowerCase().includes(q) ||
      p.descricao.toLowerCase().includes(q)
    );

    const groups = Object.entries(
      filtered.reduce((acc, item) => {
        (acc[item.fonte] ??= []).push(item);
        return acc;
      }, {} as Record<string, ConfigurationParams[]>)
    )
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fonte, items]) => ({ fonte, items }));

    this.filteredGroups.set(groups);
  }

  maskValue(value: string): string {
    if (!value || value.length <= 8) return '••••••••';
    return value.substring(0, 4) + '••••••••' + value.substring(value.length - 4);
  }

  openForm(item?: ConfigurationParams) {
    const ref = this.dialog.open(ConfigurationParamsFormComponent, {
      width: '520px',
      data: item ? { ...item } : null
    });

    ref.afterClosed().subscribe(result => {
      if (result) this.load();
    });
  }

  confirmDelete(item: ConfigurationParams) {
    if (!confirm(`Excluir o parâmetro "${item.parametro}" (${item.fonte})?`)) return;

    this.service.delete(item.id).subscribe({
      next: () => {
        this.snackBar.open('Parâmetro excluído', 'OK', { duration: 3000 });
        this.load();
      },
      error: () => this.snackBar.open('Erro ao excluir parâmetro', 'OK', { duration: 4000 })
    });
  }
}
