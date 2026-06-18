import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ConfigurationParamsService } from '../../core/services/configuration-params.service';
import { ConfigurationParams } from '../../core/models/configuration-params.model';

@Component({
  selector: 'app-configuration-params-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule,
    MatCheckboxModule, MatButtonModule, MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Editar' : 'Novo' }} Parâmetro</h2>

    <mat-dialog-content>
      <div class="form-grid">
        <mat-form-field appearance="outline" class="full">
          <mat-label>Fonte (grupo)</mat-label>
          <input matInput [(ngModel)]="model.fonte" placeholder="Ex: GROKIA, EMAIL, ZENVIA, AZURE, OPENAI" required>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full">
          <mat-label>Parâmetro (chave)</mat-label>
          <input matInput [(ngModel)]="model.parametro" placeholder="Ex: GROKIA_API_KEY" required>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full">
          <mat-label>Descrição</mat-label>
          <input matInput [(ngModel)]="model.descricao" placeholder="Descrição do parâmetro" required>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full">
          <mat-label>Valor</mat-label>
          <textarea matInput [(ngModel)]="model.valor" rows="3" placeholder="Valor do parâmetro" required></textarea>
        </mat-form-field>

        <mat-checkbox [(ngModel)]="model.ativo" color="primary">Ativo</mat-checkbox>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close(false)">Cancelar</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="saving || !isValid()">
        {{ saving ? 'Salvando...' : 'Salvar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-grid {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 8px 0;
      min-width: 400px;
    }
    .full { width: 100%; }
  `]
})
export class ConfigurationParamsFormComponent implements OnInit {
  dialogRef = inject(MatDialogRef<ConfigurationParamsFormComponent>);
  data: ConfigurationParams | null = inject(MAT_DIALOG_DATA);
  private service = inject(ConfigurationParamsService);
  private snackBar = inject(MatSnackBar);

  model: ConfigurationParams = { id: 0, fonte: '', descricao: '', ativo: true, dataCriacao: '', parametro: '', valor: '' };
  isEdit = false;
  saving = false;

  ngOnInit() {
    if (this.data) {
      this.model = { ...this.data };
      this.isEdit = true;
    }
  }

  isValid(): boolean {
    return !!this.model.fonte && !!this.model.parametro && !!this.model.descricao && !!this.model.valor;
  }

  save() {
    if (!this.isValid()) return;
    this.saving = true;

    const op = this.isEdit
      ? this.service.update(this.model)
      : this.service.create(this.model);

    op.subscribe({
      next: () => {
        this.snackBar.open(`Parâmetro ${this.isEdit ? 'atualizado' : 'criado'} com sucesso!`, 'OK', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.saving = false;
        const msg = err?.error?.error ?? 'Erro ao salvar parâmetro';
        this.snackBar.open(msg, 'OK', { duration: 6000 });
      }
    });
  }
}
