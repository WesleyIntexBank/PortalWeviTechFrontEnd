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
import { ProfileService } from '../../core/services/profile.service';
import { Profile } from '../../core/models/profile.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { ProfileFormDialogComponent } from './dialogs/profile-form-dialog.component';

@Component({
  selector: 'app-profiles',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatPaginatorModule, MatSortModule,
    MatIconModule, MatButtonModule, MatInputModule, MatFormFieldModule,
    MatDialogModule, MatSnackBarModule, MatTooltipModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <mat-icon>manage_accounts</mat-icon>
        <h1>Perfis</h1>
        <span class="subtitle">Perfis de acesso ao sistema</span>
      </div>

      <div class="card-container">
        <div class="table-toolbar">
          <mat-form-field class="search-field" appearance="outline">
            <mat-label>Pesquisar perfil</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input matInput (keyup)="applyFilter($event)" placeholder="Nome...">
          </mat-form-field>
          <button mat-flat-button color="primary" (click)="openDialog()">
            <mat-icon>add</mat-icon> Novo Perfil
          </button>
        </div>

        @if (loading()) {
          <div class="loading-overlay"><mat-spinner diameter="48"></mat-spinner></div>
        } @else {
          <div class="table-scroll">
          <mat-table [dataSource]="dataSource" matSort>

            <ng-container matColumnDef="description">
              <mat-header-cell *matHeaderCellDef>Descrição</mat-header-cell>
              <mat-cell *matCellDef="let row">{{ row.description }}</mat-cell>
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
                <div class="empty-state"><mat-icon>person_off</mat-icon><p>Nenhum perfil encontrado</p></div>
              </td>
            </tr>
          </mat-table>
          <mat-paginator [pageSizeOptions]="[10, 25, 50]" showFirstLastButtons></mat-paginator>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`.table-row:hover { background: var(--row-hover); }`]
})
export class ProfilesComponent implements OnInit {
  private profileService = inject(ProfileService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  columns = [ 'description', 'active', 'actions'];
  dataSource = new MatTableDataSource<Profile>([]);
  loading = signal(true);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() { this.load(); }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate = (data, filter) => data.name.toLowerCase().includes(filter);
  }

  load() {
    this.loading.set(true);
    this.profileService.getAll().subscribe({
      next: (data) => { this.dataSource.data = data; this.loading.set(false); },
      error: () => { this.loading.set(false); this.notify('Erro ao carregar perfis', true); }
    });
  }

  applyFilter(e: Event) {
    this.dataSource.filter = (e.target as HTMLInputElement).value.trim().toLowerCase();
  }

  openDialog(profile?: Profile) {
    const ref = this.dialog.open(ProfileFormDialogComponent, { data: profile || null, width: '480px', disableClose: true });
    ref.afterClosed().subscribe(result => { if (result) this.load(); });
  }

  delete(profile: Profile) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Excluir Perfil', message: `Deseja excluir o perfil "${profile.name}"?`, confirmText: 'Excluir' }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.profileService.delete(profile.id!).subscribe({
          next: () => { this.notify('Perfil excluído'); this.load(); },
          error: () => this.notify('Erro ao excluir perfil', true)
        });
      }
    });
  }

  private notify(msg: string, error = false) {
    this.snackBar.open(msg, 'OK', { duration: 3000, panelClass: error ? ['error-snackbar'] : ['success-snackbar'] });
  }
}
