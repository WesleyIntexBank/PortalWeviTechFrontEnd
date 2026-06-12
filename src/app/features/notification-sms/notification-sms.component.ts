import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-notification-sms',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="page-container">

      <div class="page-header">
        <mat-icon>sms</mat-icon>
        <h1>Envio de SMS</h1>
      </div>

      <div class="card-container">
        <p class="card-desc">
          Envie mensagens de texto (SMS) via <strong>Zenvia</strong> para qualquer número com DDD.
        </p>

        <form [formGroup]="form" (ngSubmit)="enviar()" class="form-grid">

          <mat-form-field appearance="outline" class="field-full">
            <mat-label>Número de destino</mat-label>
            <mat-icon matPrefix>smartphone</mat-icon>
            <input
              matInput
              formControlName="number"
              placeholder="5511999999999"
              (input)="maskPhone($event)"
              maxlength="15"
            >
            <mat-hint>Formato: DDI + DDD + número (ex: 5511999999999)</mat-hint>
            @if (form.get('number')?.hasError('required') && form.get('number')?.touched) {
              <mat-error>Número é obrigatório</mat-error>
            }
            @if (form.get('number')?.hasError('pattern') && form.get('number')?.touched) {
              <mat-error>Número inválido — use apenas dígitos com DDI e DDD</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="field-full">
            <mat-label>Mensagem</mat-label>
            <mat-icon matPrefix>chat</mat-icon>
            <textarea
              matInput
              formControlName="message"
              rows="5"
              placeholder="Digite a mensagem SMS..."
              maxlength="160"
            ></textarea>
            <mat-hint align="end">{{ form.value.message?.length ?? 0 }} / 160</mat-hint>
            @if (form.get('message')?.hasError('required') && form.get('message')?.touched) {
              <mat-error>Mensagem é obrigatória</mat-error>
            }
            @if (form.get('message')?.hasError('maxlength')) {
              <mat-error>SMS limitado a 160 caracteres</mat-error>
            }
          </mat-form-field>

          <div class="actions-row">
            <button mat-flat-button color="primary" type="submit" class="btn-enviar" [disabled]="loading()">
              @if (loading()) { <mat-spinner diameter="20"></mat-spinner> }
              @else { <mat-icon>send</mat-icon> }
              {{ loading() ? 'Enviando...' : 'Enviar SMS' }}
            </button>
          </div>

        </form>
      </div>

      @if (error()) {
        <div class="feedback-banner error">
          <mat-icon>error_outline</mat-icon>
          <span>{{ error() }}</span>
        </div>
      }

      @if (success()) {
        <div class="feedback-banner success">
          <mat-icon>check_circle</mat-icon>
          <span>SMS enviado com sucesso!</span>
        </div>
      }

    </div>
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 20px; }

    .page-header {
      display: flex; align-items: center; gap: 12px;
      mat-icon { font-size: 28px; width: 28px; height: 28px; color: #42a5f5; }
      h1 { margin: 0; font-size: 22px; font-weight: 700; color: var(--text); }
    }

    .card-container {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
      box-shadow: var(--card-shadow);
    }

    .card-desc { margin: 0 0 20px; font-size: 14px; color: var(--text-sec); }

    .form-grid { display: flex; flex-direction: column; gap: 8px; }

    .field-full { width: 100%; }

    .actions-row { display: flex; justify-content: flex-end; padding-top: 8px; }

    .btn-enviar {
      height: 48px; padding: 0 32px;
      font-size: 14px; font-weight: 600;
      display: flex; align-items: center; gap: 8px;
    }

    .feedback-banner {
      display: flex; align-items: center; gap: 10px;
      padding: 14px 20px; border-radius: 10px; font-size: 14px;
      mat-icon { flex-shrink: 0; }
      &.error  { background: rgba(239,83,80,.10); border: 1px solid rgba(239,83,80,.30); color: #ef5350; }
      &.success { background: rgba(102,187,106,.10); border: 1px solid rgba(102,187,106,.30); color: #66bb6a; }
    }

    @media (max-width: 600px) {
      .actions-row { justify-content: stretch; }
      .btn-enviar { width: 100%; justify-content: center; }
    }
  `]
})
export class NotificationSmsComponent {
  private service = inject(NotificationService);

  loading = signal(false);
  error   = signal<string | null>(null);
  success = signal(false);

  form = new FormGroup({
    number:  new FormControl('', [Validators.required, Validators.pattern(/^\d{10,15}$/)]),
    message: new FormControl('', [Validators.required, Validators.maxLength(160)]),
  });

  maskPhone(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/\D/g, '');
    this.form.get('number')!.setValue(input.value, { emitEvent: false });
  }

  enviar() {
    if (this.loading()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set(null);
    this.success.set(false);

    const v = this.form.value;
    this.service.sendSms({ number: v.number!, message: v.message! }).subscribe({
      next: () => {
        this.success.set(true);
        this.form.reset();
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Erro ao enviar SMS. Tente novamente.');
        this.loading.set(false);
      }
    });
  }
}
