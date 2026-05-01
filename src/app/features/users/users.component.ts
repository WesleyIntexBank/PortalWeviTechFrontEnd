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
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../../core/services/user.service';
import { User } from '../../core/models/user.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { UserFormDialogComponent } from './dialogs/user-form-dialog.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatPaginatorModule, MatSortModule,
    MatIconModule, MatButtonModule, MatInputModule, MatFormFieldModule,
    MatDialogModule, MatSnackBarModule, MatTooltipModule, MatChipsModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <mat-icon>people</mat-icon>
        <h1>Usuários</h1>
      </div>

      <div class="card-container">
        <div class="table-toolbar">
          <mat-form-field class="search-field" appearance="outline">
            <mat-label>Pesquisar usuário</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input matInput (keyup)="applyFilter($event)" placeholder="Nome, e-mail...">
          </mat-form-field>

          <button mat-flat-button color="primary" (click)="openDialog()">
            <mat-icon>add</mat-icon> Novo Usuário
          </button>
        </div>

        @if (loading()) {
          <div class="loading-overlay">
            <mat-spinner diameter="48"></mat-spinner>
          </div>
        } @else {
          <div class="table-scroll">
          <mat-table [dataSource]="dataSource" matSort>
            <ng-container matColumnDef="name">
              <mat-header-cell *matHeaderCellDef mat-sort-header>Nome</mat-header-cell>
              <mat-cell *matCellDef="let row">
                <div class="user-info">
                  <div class="user-avatar">{{ getInitials(row.name) }}</div>
                  <span>{{ row.name }}</span>
                </div>
              </mat-cell>
            </ng-container>

            <ng-container matColumnDef="email">
              <mat-header-cell *matHeaderCellDef mat-sort-header>E-mail</mat-header-cell>
              <mat-cell *matCellDef="let row">{{ row.email }}</mat-cell>
            </ng-container>

            <ng-container matColumnDef="profile">
              <mat-header-cell *matHeaderCellDef>Perfil</mat-header-cell>
              <mat-cell *matCellDef="let row">
                <span class="profile-chip">{{ row.profile?.name || '—' }}</span>
              </mat-cell>
            </ng-container>

            <ng-container matColumnDef="enterprise">
              <mat-header-cell *matHeaderCellDef>Parceiro</mat-header-cell>
              <mat-cell *matCellDef="let row">{{ row.enterprise?.name || '—' }}</mat-cell>
            </ng-container>

            <ng-container matColumnDef="active">
              <mat-header-cell *matHeaderCellDef mat-sort-header>Status</mat-header-cell>
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
                <div class="empty-state">
                  <mat-icon>person_off</mat-icon>
                  <p>Nenhum usuário encontrado</p>
                </div>
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
    .user-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--avatar-bg);
      color: var(--text);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      flex-shrink: 0;
      transition: background 0.25s;
    }

    .profile-chip {
      background: rgba(92, 107, 192, 0.15);
      color: var(--primary);
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    .table-row:hover { background: var(--row-hover); }
  `]
})
export class UsersComponent implements OnInit {
  private userService = inject(UserService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  columns = ['name', 'email', 'profile', 'enterprise', 'active', 'actions'];
  dataSource = new MatTableDataSource<User>([]);
  loading = signal(true);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() { this.load(); }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate = (data, filter) =>
      data.name.toLowerCase().includes(filter) || data.email.toLowerCase().includes(filter);
  }

  load() {
    this.loading.set(true);
    this.userService.getAll().subscribe({
      next: (data) => { this.dataSource.data = data; this.loading.set(false); },
      error: () => { this.loading.set(false); this.notify('Erro ao carregar usuários', true); }
    });
  }

  applyFilter(e: Event) {
    this.dataSource.filter = (e.target as HTMLInputElement).value.trim().toLowerCase();
  }

  openDialog(user?: User) {
    const ref = this.dialog.open(UserFormDialogComponent, {
      data: user || null,
      width: '560px',
      disableClose: true
    });
    ref.afterClosed().subscribe(result => { if (result) this.load(); });
  }

  delete(user: User) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Excluir Usuário', message: `Deseja excluir o usuário "${user.name}"?`, confirmText: 'Excluir' }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.userService.delete(user.id!).subscribe({
          next: () => { this.notify('Usuário excluído com sucesso'); this.load(); },
          error: () => this.notify('Erro ao excluir usuário', true)
        });
      }
    });
  }

  getInitials(name: string): string {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }

  private notify(msg: string, error = false) {
    this.snackBar.open(msg, 'OK', {
      duration: 3000,
      panelClass: error ? ['error-snackbar'] : ['success-snackbar']
    });
  }
}
