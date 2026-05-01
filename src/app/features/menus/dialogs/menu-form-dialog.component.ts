import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MenuService } from '../../../core/services/menu.service';
import { Menu } from '../../../core/models/menu.model';

const MATERIAL_ICONS = [
  'dashboard','people','manage_accounts','business','menu_open','assignment',
  'settings','home','folder','description','analytics','bar_chart','pie_chart',
  'notifications','email','phone','location_on','calendar_today','search',
  'add','edit','delete','save','close','check','info','warning','error',
  'star','favorite','thumb_up','share','download','upload','refresh','sync'
];

@Component({
  selector: 'app-menu-form-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatIconModule,
    MatSlideToggleModule, MatProgressBarModule, MatSnackBarModule
  ],
  template: `
    <div class="dialog-header">
      <h2>{{ data.menu ? 'Editar Menu' : 'Novo Menu' }}</h2>
      <button mat-icon-button (click)="dialogRef.close()"><mat-icon>close</mat-icon></button>
    </div>

    @if (saving) { <mat-progress-bar mode="indeterminate"></mat-progress-bar> }

    <div class="dialog-content" [formGroup]="form">
      <div class="form-row">
        <mat-form-field appearance="outline">
          <mat-label>Nome</mat-label>
          <input matInput formControlName="name" placeholder="Ex: Usuários">
          @if (form.get('name')?.hasError('required')) {
            <mat-error>Nome é obrigatório</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" style="max-width: 100px">
          <mat-label>Ordem</mat-label>
          <input matInput formControlName="order" type="number" min="1">
        </mat-form-field>
      </div>

      <mat-form-field appearance="outline">
        <mat-label>Rota</mat-label>
        <mat-icon matPrefix>link</mat-icon>
        <input matInput formControlName="route" placeholder="/users">
        @if (form.get('route')?.hasError('required')) {
          <mat-error>Rota é obrigatória</mat-error>
        }
      </mat-form-field>

      <div class="form-row">
        <mat-form-field appearance="outline">
          <mat-label>Ícone</mat-label>
          <mat-select formControlName="icon">
            @for (icon of icons; track icon) {
              <mat-option [value]="icon">
                <mat-icon>{{ icon }}</mat-icon> {{ icon }}
              </mat-option>
            }
          </mat-select>
        </mat-form-field>

        <div class="icon-preview-large" *ngIf="form.get('icon')?.value">
          <mat-icon>{{ form.get('icon')?.value }}</mat-icon>
        </div>
      </div>

      <mat-form-field appearance="outline">
        <mat-label>Menu pai (opcional)</mat-label>
        <mat-select formControlName="parentId">
          <mat-option [value]="null">— Nenhum —</mat-option>
          @for (m of data.allMenus; track m.id) {
            @if (!data.menu || m.id !== data.menu.id) {
              <mat-option [value]="m.id">{{ m.title }}</mat-option>
            }
          }
        </mat-select>
      </mat-form-field>

      <mat-slide-toggle formControlName="active" color="primary">Menu ativo</mat-slide-toggle>
    </div>

    <div class="dialog-actions">
      <button mat-stroked-button (click)="dialogRef.close()">Cancelar</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="saving">
        <mat-icon>save</mat-icon> {{ data.menu ? 'Salvar' : 'Criar' }}
      </button>
    </div>
  `,
  styles: [`
    .icon-preview-large {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      background: #e8eaf6;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      align-self: center;
      mat-icon { color: #303f9f; font-size: 28px; width: 28px; height: 28px; }
    }
  `]
})
export class MenuFormDialogComponent {
  dialogRef = inject(MatDialogRef<MenuFormDialogComponent>);
  data: { menu: Menu | null; allMenus: Menu[] } = inject(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private menuService = inject(MenuService);
  private snackBar = inject(MatSnackBar);

  icons = MATERIAL_ICONS;
  saving = false;

  form = this.fb.group({
    name: [this.data.menu?.title || '', Validators.required],
    icon: [this.data.menu?.icon || 'circle'],
    route: [this.data.menu?.route || '', Validators.required],
    parentId: [this.data.menu?.parentId || null],
    order: [this.data.menu?.order || 1],
    active: [this.data.menu?.active ?? true]
  });

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const payload = this.form.value as Menu;
    const req = this.data.menu
      ? this.menuService.update(this.data.menu.id!, payload)
      : this.menuService.create(payload);

    req.subscribe({
      next: () => {
        this.snackBar.open(this.data.menu ? 'Menu atualizado!' : 'Menu criado!', 'OK', { duration: 3000, panelClass: ['success-snackbar'] });
        this.dialogRef.close(true);
      },
      error: () => { this.saving = false; this.snackBar.open('Erro ao salvar', 'OK', { duration: 3000, panelClass: ['error-snackbar'] }); }
    });
  }
}
