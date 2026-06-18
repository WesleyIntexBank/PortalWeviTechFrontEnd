import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProfileService } from '../../../core/services/profile.service';
import { Profile } from '../../../core/models/profile.model';

@Component({
  selector: 'app-profile-form-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule, MatSlideToggleModule,
    MatProgressBarModule, MatSnackBarModule
  ],
  template: `
    <div class="dialog-header">
      <h2>{{ data ? 'Editar Perfil' : 'Novo Perfil' }}</h2>
      <button mat-icon-button (click)="dialogRef.close()"><mat-icon>close</mat-icon></button>
    </div>

    @if (saving) { <mat-progress-bar mode="indeterminate"></mat-progress-bar> }

    <div class="dialog-content" [formGroup]="form">
      <mat-form-field appearance="outline">
        <mat-label>Nome do perfil</mat-label>
        <mat-icon matPrefix>badge</mat-icon>
        <input matInput formControlName="name" placeholder="Ex: Administrador">
        @if (form.get('name')?.hasError('required')) {
          <mat-error>Nome é obrigatório</mat-error>
        }
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Descrição</mat-label>
        <mat-icon matPrefix>description</mat-icon>
        <textarea matInput formControlName="description" rows="3" placeholder="Descreva as permissões deste perfil"></textarea>
      </mat-form-field>

      <mat-slide-toggle formControlName="active" color="primary">Perfil ativo</mat-slide-toggle>
    </div>

    <div class="dialog-actions">
      <button mat-stroked-button (click)="dialogRef.close()">Cancelar</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="saving">
        <mat-icon>save</mat-icon> {{ data ? 'Salvar' : 'Criar' }}
      </button>
    </div>
  `
})
export class ProfileFormDialogComponent {
  dialogRef = inject(MatDialogRef<ProfileFormDialogComponent>);
  data: Profile = inject(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private profileService = inject(ProfileService);
  private snackBar = inject(MatSnackBar);

  saving = false;
  form = this.fb.group({
    name: [this.data?.name || '', Validators.required],
    description: [this.data?.description || ''],
    active: [this.data?.active ?? true]
  });

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const payload = this.form.value as Profile;
    const req = this.data
      ? this.profileService.update({ ...payload, id: this.data.id })
      : this.profileService.create(payload);
    req.subscribe({
      next: () => {
        this.snackBar.open(this.data ? 'Perfil atualizado!' : 'Perfil criado!', 'OK', { duration: 3000, panelClass: ['success-snackbar'] });
        this.dialogRef.close(true);
      },
      error: () => { this.saving = false; this.snackBar.open('Erro ao salvar', 'OK', { duration: 3000, panelClass: ['error-snackbar'] }); }
    });
  }
}
