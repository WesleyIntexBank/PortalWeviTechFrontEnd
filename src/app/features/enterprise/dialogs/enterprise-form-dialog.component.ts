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
import { EnterpriseService } from '../../../core/services/enterprise.service';
import { Enterprise } from '../../../core/models/enterprise.model';

const STATES = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

@Component({
  selector: 'app-enterprise-form-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatIconModule,
    MatSlideToggleModule, MatProgressBarModule, MatSnackBarModule
  ],
  template: `
    <div class="dialog-header">
      <h2>{{ data ? 'Editar Parceiro' : 'Novo Parceiro' }}</h2>
      <button mat-icon-button (click)="dialogRef.close()"><mat-icon>close</mat-icon></button>
    </div>

    @if (saving) { <mat-progress-bar mode="indeterminate"></mat-progress-bar> }

    <div class="dialog-content" [formGroup]="form">
      <mat-form-field appearance="outline">
        <mat-label>Razão Social</mat-label>
        <mat-icon matPrefix>business</mat-icon>
        <input matInput formControlName="name" placeholder="Nome da empresa">
        @if (form.get('name')?.hasError('required')) {
          <mat-error>Razão Social é obrigatória</mat-error>
        }
      </mat-form-field>

      <div class="form-row">
        <mat-form-field appearance="outline">
          <mat-label>CNPJ</mat-label>
          <mat-icon matPrefix>badge</mat-icon>
          <input matInput formControlName="cnpj" placeholder="00.000.000/0000-00">
          @if (form.get('cnpj')?.hasError('required')) {
            <mat-error>CNPJ é obrigatório</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Telefone</mat-label>
          <mat-icon matPrefix>phone</mat-icon>
          <input matInput formControlName="phone" placeholder="(00) 00000-0000">
        </mat-form-field>
      </div>

      <mat-form-field appearance="outline">
        <mat-label>E-mail</mat-label>
        <mat-icon matPrefix>email</mat-icon>
        <input matInput formControlName="email" type="email" placeholder="contato@empresa.com">
        @if (form.get('email')?.hasError('email')) {
          <mat-error>E-mail inválido</mat-error>
        }
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Endereço</mat-label>
        <mat-icon matPrefix>location_on</mat-icon>
        <input matInput formControlName="address" placeholder="Rua, número, bairro">
      </mat-form-field>

      <div class="form-row">
        <mat-form-field appearance="outline">
          <mat-label>Cidade</mat-label>
          <input matInput formControlName="city">
        </mat-form-field>

        <mat-form-field appearance="outline" style="max-width: 100px">
          <mat-label>UF</mat-label>
          <mat-select formControlName="state">
            @for (s of states; track s) {
              <mat-option [value]="s">{{ s }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      <mat-slide-toggle formControlName="active" color="primary">Parceiro ativo</mat-slide-toggle>
    </div>

    <div class="dialog-actions">
      <button mat-stroked-button (click)="dialogRef.close()">Cancelar</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="saving">
        <mat-icon>save</mat-icon> {{ data ? 'Salvar' : 'Criar' }}
      </button>
    </div>
  `
})
export class EnterpriseFormDialogComponent {
  dialogRef = inject(MatDialogRef<EnterpriseFormDialogComponent>);
  data: Enterprise = inject(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private enterpriseService = inject(EnterpriseService);
  private snackBar = inject(MatSnackBar);

  states = STATES;
  saving = false;

  form = this.fb.group({
    name: [this.data?.name || '', Validators.required],
    cnpj: [this.data?.cnpj || '', Validators.required],
    email: [this.data?.email || '', [Validators.required, Validators.email]],
    phone: [this.data?.phone || ''],
    address: [this.data?.address || ''],
    city: [this.data?.city || ''],
    state: [this.data?.state || ''],
    active: [this.data?.active ?? true]
  });

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const payload = this.form.value as Enterprise;
    const req = this.data ? this.enterpriseService.update(this.data.id!, payload) : this.enterpriseService.create(payload);
    req.subscribe({
      next: () => {
        this.snackBar.open(this.data ? 'Parceiro atualizado!' : 'Parceiro criado!', 'OK', { duration: 3000, panelClass: ['success-snackbar'] });
        this.dialogRef.close(true);
      },
      error: () => { this.saving = false; this.snackBar.open('Erro ao salvar', 'OK', { duration: 3000, panelClass: ['error-snackbar'] }); }
    });
  }
}
