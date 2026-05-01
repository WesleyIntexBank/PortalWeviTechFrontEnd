import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirm-dialog">
      <div class="confirm-icon">
        <mat-icon>warning_amber</mat-icon>
      </div>
      <h2 mat-dialog-title>{{ data.title }}</h2>
      <mat-dialog-content>
        <p>{{ data.message }}</p>
      </mat-dialog-content>
      <mat-dialog-actions align="center">
        <button mat-stroked-button (click)="dialogRef.close(false)">
          {{ data.cancelText || 'Cancelar' }}
        </button>
        <button mat-flat-button color="warn" (click)="dialogRef.close(true)">
          {{ data.confirmText || 'Confirmar' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      text-align: center;
      padding: 24px;
      background: var(--surface);
      color: var(--text);
      transition: background 0.25s;

      h2 { font-size: 18px; font-weight: 600; margin-bottom: 8px; color: var(--text); }
      p { color: var(--text-sec); font-size: 14px; }
    }

    .confirm-icon {
      margin-bottom: 16px;
      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: var(--warning, #f57c00);
      }
    }

    mat-dialog-actions {
      gap: 12px;
      padding-top: 16px;
    }
  `]
})
export class ConfirmDialogComponent {
  dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);
  data: ConfirmDialogData = inject(MAT_DIALOG_DATA);
}
