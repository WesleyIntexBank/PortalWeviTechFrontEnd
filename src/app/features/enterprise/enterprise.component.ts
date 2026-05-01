import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EnterpriseService } from '../../core/services/enterprise.service';
import { Enterprise } from '../../core/models/enterprise.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { EnterpriseFormDialogComponent } from './dialogs/enterprise-form-dialog.component';

@Component({
  selector: 'app-enterprise',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatPaginatorModule, MatSortModule,
    MatIconModule, MatButtonModule, MatInputModule, MatFormFieldModule,
    MatDialogModule, MatSnackBarModule, MatTooltipModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <mat-icon>business</mat-icon>
        <h1>Parceiros</h1>
        <span class="subtitle">Gestão de empresas parceiras</span>
      </div>

      <div class="card-container">
        <div class="table-toolbar">
          <mat-form-field class="search-field" appearance="outline">
            <mat-label>Pesquisar parceiro</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input matInput (keyup)="applyFilter($event)" placeholder="Nome, CNPJ, e-mail...">
          </mat-form-field>
          <button mat-flat-button color="primary" (click)="openDialog()">
            <mat-icon>add</mat-icon> Novo Parceiro
          </button>
        </div>

        @if (loading()) {
          <div class="loading-overlay"><mat-spinner diameter="48"></mat-spinner></div>
        } @else {
          <div class="table-scroll">
          <mat-table [dataSource]="dataSource" matSort>
            <ng-container matColumnDef="name">
              <mat-header-cell *matHeaderCellDef mat-sort-header>Razão Social</mat-header-cell>
              <mat-cell *matCellDef="let row">
                <div class="enterprise-name">
                  <div class="ent-icon"><mat-icon>business</mat-icon></div>
                  <div>
                    <strong>{{ row.name }}</strong>
                  </div>
                </div>
              </mat-cell>
            </ng-container>

            <ng-container matColumnDef="cnpj">
              <mat-header-cell *matHeaderCellDef>CNPJ</mat-header-cell>
              <mat-cell *matCellDef="let row">{{ row.cnpj }}</mat-cell>
            </ng-container>

            <ng-container matColumnDef="email">
              <mat-header-cell *matHeaderCellDef>E-mail</mat-header-cell>
              <mat-cell *matCellDef="let row">{{ row.email }}</mat-cell>
            </ng-container>

            <ng-container matColumnDef="phone">
              <mat-header-cell *matHeaderCellDef>Telefone</mat-header-cell>
              <mat-cell *matCellDef="let row">{{ row.phone }}</mat-cell>
            </ng-container>

            <ng-container matColumnDef="city">
              <mat-header-cell *matHeaderCellDef>Cidade/UF</mat-header-cell>
              <mat-cell *matCellDef="let row">{{ row.city }}{{ row.state ? '/' + row.state : '' }}</mat-cell>
            </ng-container>

            <ng-container matColumnDef="active">
              <mat-header-cell *matHeaderCellDef>Status</mat-header-cell>
              <mat-cell *matCellDef="let row">
                <span class="status-chip" [class.active]="row.active" [class.inactive]="!row.active">
                  {{ row.active ? 'Ativo' : 'Inativo' }}
                </span>
              </mat-cell>
            </ng-container>

            <ng-container matColumnDef="actions">
              <mat-header-cell *matHeaderCellDef>Ações</mat-header-cell>
              <mat-cell *matCellDef="let row">
                <button mat-icon-button color="primary" matTooltip="Editar" (click)="openDialog(row)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" matTooltip="Excluir" (click)="delete(row)">
                  <mat-icon>delete</mat-icon>
                </button>
              </mat-cell>
            </ng-container>

            <mat-header-row *matHeaderRowDef="columns"></mat-header-row>
            <mat-row *matRowDef="let row; columns: columns" class="table-row"></mat-row>
            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell" [attr.colspan]="columns.length">
                <div class="empty-state"><mat-icon>business_center</mat-icon><p>Nenhum parceiro encontrado</p></div>
              </td>
            </tr>
          </mat-table>
          <mat-paginator [pageSizeOptions]="[10, 25, 50]" showFirstLastButtons></mat-paginator>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .enterprise-name {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .ent-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: var(--avatar-bg);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 0.25s;
      mat-icon { color: var(--text); font-size: 18px; }
    }
    .table-row:hover { background: var(--row-hover); }
  `]
})
export class EnterpriseComponent implements OnInit {
  private enterpriseService = inject(EnterpriseService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  columns = ['name', 'cnpj', 'email', 'phone', 'city', 'active', 'actions'];
  dataSource = new MatTableDataSource<Enterprise>([]);
  loading = signal(true);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() { this.load(); }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate = (data, filter) =>
      [data.name, data.cnpj, data.email].some(f => f?.toLowerCase().includes(filter));
  }

  load() {
    this.loading.set(true);
    this.enterpriseService.getAll().subscribe({
      next: (data) => { this.dataSource.data = data; this.loading.set(false); },
      error: () => { this.loading.set(false); this.notify('Erro ao carregar parceiros', true); }
    });
  }

  applyFilter(e: Event) {
    this.dataSource.filter = (e.target as HTMLInputElement).value.trim().toLowerCase();
  }

  openDialog(enterprise?: Enterprise) {
    const ref = this.dialog.open(EnterpriseFormDialogComponent, { data: enterprise || null, width: '580px', disableClose: true });
    ref.afterClosed().subscribe(result => { if (result) this.load(); });
  }

  delete(enterprise: Enterprise) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Excluir Parceiro', message: `Deseja excluir o parceiro "${enterprise.name}"?`, confirmText: 'Excluir' }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.enterpriseService.delete(enterprise.id!).subscribe({
          next: () => { this.notify('Parceiro excluído'); this.load(); },
          error: () => this.notify('Erro ao excluir parceiro', true)
        });
      }
    });
  }

  private notify(msg: string, error = false) {
    this.snackBar.open(msg, 'OK', { duration: 3000, panelClass: error ? ['error-snackbar'] : ['success-snackbar'] });
  }
}
