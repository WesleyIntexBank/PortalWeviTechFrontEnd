import { Component, inject, OnInit } from '@angular/core';
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
import { UserService } from '../../../core/services/user.service';
import { ProfileService } from '../../../core/services/profile.service';
import { EnterpriseService } from '../../../core/services/enterprise.service';
import { User } from '../../../core/models/user.model';
import { Profile } from '../../../core/models/profile.model';
import { Enterprise } from '../../../core/models/enterprise.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-user-form-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatIconModule,
    MatSlideToggleModule, MatProgressBarModule, MatSnackBarModule
  ],
  template: `
    <div class="dialog-header">
      <h2>{{ data ? 'Editar Usuário' : 'Novo Usuário' }}</h2>
      <button mat-icon-button (click)="dialogRef.close()">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    @if (saving) { <mat-progress-bar mode="indeterminate"></mat-progress-bar> }

    <div class="dialog-content" [formGroup]="form">
      <mat-form-field appearance="outline">
        <mat-label>Nome completo</mat-label>
        <mat-icon matPrefix>person</mat-icon>
        <input matInput formControlName="name" placeholder="Nome do usuário">
        @if (form.get('name')?.hasError('required')) {
          <mat-error>Nome é obrigatório</mat-error>
        }
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>E-mail</mat-label>
        <mat-icon matPrefix>email</mat-icon>
        <input matInput formControlName="email" type="email" placeholder="email@empresa.com">
        @if (form.get('email')?.hasError('email')) {
          <mat-error>E-mail inválido</mat-error>
        }
      </mat-form-field>

      @if (!data) {
        <mat-form-field appearance="outline">
          <mat-label>Senha</mat-label>
          <mat-icon matPrefix>lock</mat-icon>
          <input matInput formControlName="password" type="password" placeholder="Senha">
          @if (form.get('password')?.hasError('minlength')) {
            <mat-error>Mínimo 6 caracteres</mat-error>
          }
        </mat-form-field>
      }

      <div class="form-row">
        <mat-form-field appearance="outline">
          <mat-label>Perfil</mat-label>
          <mat-icon matPrefix>manage_accounts</mat-icon>
          <mat-select formControlName="profileId">
            @for (p of profiles; track p.id) {
              <mat-option [value]="p.id">{{ p.name }}</mat-option>
            }
          </mat-select>
          @if (form.get('profileId')?.hasError('required')) {
            <mat-error>Perfil é obrigatório</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Parceiro</mat-label>
          <mat-icon matPrefix>business</mat-icon>
          <mat-select formControlName="enterpriseId">
            @for (e of enterprises; track e.id) {
              <mat-option [value]="e.id">{{ e.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      <div style="display: flex; align-items: center; gap: 12px; padding: 8px 0">
        <mat-slide-toggle formControlName="active" color="primary">
          Usuário ativo
        </mat-slide-toggle>
      </div>
    </div>

    <div class="dialog-actions">
      <button mat-stroked-button (click)="dialogRef.close()">Cancelar</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="saving">
        <mat-icon>save</mat-icon> {{ data ? 'Salvar' : 'Criar' }}
      </button>
    </div>
  `
})
export class UserFormDialogComponent implements OnInit {
  dialogRef = inject(MatDialogRef<UserFormDialogComponent>);
  data: User = inject(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private profileService = inject(ProfileService);
  private enterpriseService = inject(EnterpriseService);
  private snackBar = inject(MatSnackBar);

  profiles: Profile[] = [];
  enterprises: Enterprise[] = [];
  saving = false;

  form = this.fb.group({
    name: [this.data?.name || '', Validators.required],
    email: [this.data?.email || '', [Validators.required, Validators.email]],
    password: ['', this.data ? [] : [Validators.required, Validators.minLength(6)]],
    profileId: [this.data?.profileId || null, Validators.required],
    enterpriseId: [this.data?.enterpriseId || null],
    active: [this.data?.active ?? true]
  });

  ngOnInit() {
    forkJoin({
      profiles: this.profileService.getAll(),
      enterprises: this.enterpriseService.getAll()
    }).subscribe(({ profiles, enterprises }) => {
      this.profiles = profiles;
      this.enterprises = enterprises;
    });
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const payload = this.form.value as User;

    const req = this.data
      ? this.userService.update(this.data.id!, payload)
      : this.userService.create(payload);

    req.subscribe({
      next: () => {
        this.snackBar.open(this.data ? 'Usuário atualizado!' : 'Usuário criado!', 'OK', { duration: 3000, panelClass: ['success-snackbar'] });
        this.dialogRef.close(true);
      },
      error: () => {
        this.saving = false;
        this.snackBar.open('Erro ao salvar usuário', 'OK', { duration: 3000, panelClass: ['error-snackbar'] });
      }
    });
  }
}
