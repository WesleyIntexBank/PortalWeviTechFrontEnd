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
import { MenuService } from '../../core/services/menu.service';
import { Menu } from '../../core/models/menu.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { MenuFormDialogComponent } from './dialogs/menu-form-dialog.component';

@Component({
  selector: 'app-menus',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatPaginatorModule, MatSortModule,
    MatIconModule, MatButtonModule, MatInputModule, MatFormFieldModule,
    MatDialogModule, MatSnackBarModule, MatTooltipModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <mat-icon>menu_open</mat-icon>
        <h1>Menus</h1>
        <span class="subtitle">Configuração dos itens de menu do sistema</span>
      </div>

      <div class="card-container">
        <div class="table-toolbar">
          <mat-form-field class="search-field" appearance="outline">
            <mat-label>Pesquisar menu</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input matInput (keyup)="applyFilter($event)" placeholder="Nome, rota...">
          </mat-form-field>
          <button mat-flat-button color="primary" (click)="openDialog()">
            <mat-icon>add</mat-icon> Novo Menu
          </button>
        </div>

        @if (loading()) {
          <div class="loading-overlay"><mat-spinner diameter="48"></mat-spinner></div>
        } @else {
          <div class="table-scroll">
          <mat-table [dataSource]="dataSource" matSort>
<ng-container matColumnDef="icon">
              <mat-header-cell *matHeaderCellDef style="max-width: 80px">Ícone</mat-header-cell>
              <mat-cell *matCellDef="let row" style="max-width: 80px">
                <div class="icon-preview"><i [class]="row.icon || 'bx bx-circle'" style="font-size:18px;color:#9fa8da"></i></div>
              </mat-cell>
            </ng-container>

            <ng-container matColumnDef="name">
              <mat-header-cell *matHeaderCellDef mat-sort-header>Nome</mat-header-cell>
              <mat-cell *matCellDef="let row"><strong>{{ row.title }}</strong></mat-cell>
            </ng-container>

            <ng-container matColumnDef="route">
              <mat-header-cell *matHeaderCellDef>URL</mat-header-cell>
              <mat-cell *matCellDef="let row">
                <code class="route-badge">{{ row.url }}</code>
              </mat-cell>
            </ng-container>

            <ng-container matColumnDef="parent">
              <mat-header-cell *matHeaderCellDef>Menu pai</mat-header-cell>
              <mat-cell *matCellDef="let row">{{ parentTitle(row.menuId) }}</mat-cell>
            </ng-container>

            <ng-container matColumnDef="isSubMenu">
              <mat-header-cell *matHeaderCellDef>Tipo</mat-header-cell>
              <mat-cell *matCellDef="let row">
                <span class="status-chip" [class.active]="!row.isSubMenu" [class.inactive]="row.isSubMenu">
                  {{ row.isSubMenu ? 'Submenu' : 'Raiz' }}
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
                <div class="empty-state"><mat-icon>menu</mat-icon><p>Nenhum menu encontrado</p></div>
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
    .order-badge {
      background: rgba(92,107,192,0.2);
      color: #9fa8da;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    .icon-preview {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: #1a237e;
      display: flex;
      align-items: center;
      justify-content: center;
      mat-icon { font-size: 18px; color: #9fa8da; }
    }
    .route-badge {
      background: #1a1d26;
      color: #7986cb;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-family: monospace;
      border: 1px solid rgba(255,255,255,0.08);
    }
    .table-row:hover { background: var(--row-hover); }
  `]
})
export class MenusComponent implements OnInit {
  private menuService = inject(MenuService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  columns = ['icon', 'name', 'route', 'parent', 'isSubMenu', 'actions'];
  dataSource = new MatTableDataSource<Menu>([]);
  loading = signal(true);
  allMenus: Menu[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() { this.load(); }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate = (data, filter) =>
      [data.title, data.url].some(f => f?.toLowerCase().includes(filter));
  }

  load() {
    this.loading.set(true);
    this.menuService.getAll().subscribe({
      next: (data) => { this.allMenus = data; this.dataSource.data = data; this.loading.set(false); },
      error: () => { this.loading.set(false); this.notify('Erro ao carregar menus', true); }
    });
  }

  applyFilter(e: Event) {
    this.dataSource.filter = (e.target as HTMLInputElement).value.trim().toLowerCase();
  }

  openDialog(menu?: Menu) {
    const ref = this.dialog.open(MenuFormDialogComponent, {
      data: { menu: menu || null, allMenus: this.allMenus },
      width: '520px',
      disableClose: true
    });
    ref.afterClosed().subscribe(result => { if (result) this.load(); });
  }

  delete(menu: Menu) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Excluir Menu', message: `Deseja excluir o menu "${menu.title}"?`, confirmText: 'Excluir' }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.menuService.delete(menu.id!).subscribe({
          next: () => { this.notify('Menu excluído'); this.load(); },
          error: () => this.notify('Erro ao excluir menu', true)
        });
      }
    });
  }

  parentTitle(menuId?: number): string {
    if (!menuId) return '—';
    return this.allMenus.find(m => m.id === menuId)?.title || '—';
  }

  private notify(msg: string, error = false) {
    this.snackBar.open(msg, 'OK', { duration: 3000, panelClass: error ? ['error-snackbar'] : ['success-snackbar'] });
  }
}
