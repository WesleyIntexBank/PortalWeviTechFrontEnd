import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-notification-email',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
  ],
  template: `
    <div class="page-container">

      <div class="page-header">
        <mat-icon>email</mat-icon>
        <h1>Envio de E-mail</h1>
      </div>

      <div class="card-container">
        <form [formGroup]="form" (ngSubmit)="enviar()" class="form-grid">

          <mat-form-field appearance="outline" class="field-full">
            <mat-label>Para (destinatário)</mat-label>
            <mat-icon matPrefix>alternate_email</mat-icon>
            <input matInput formControlName="to" placeholder="destinatario@email.com" type="email">
            @if (form.get('to')?.hasError('required') && form.get('to')?.touched) {
              <mat-error>Destinatário é obrigatório</mat-error>
            }
            @if (form.get('to')?.hasError('email') && form.get('to')?.touched) {
              <mat-error>E-mail inválido</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="field-full">
            <mat-label>CC (cópia) — opcional</mat-label>
            <mat-icon matPrefix>alternate_email</mat-icon>
            <input matInput formControlName="cc" placeholder="copia@email.com" type="email">
            @if (form.get('cc')?.hasError('email') && form.get('cc')?.touched) {
              <mat-error>E-mail de cópia inválido</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="field-full">
            <mat-label>Assunto</mat-label>
            <mat-icon matPrefix>subject</mat-icon>
            <input matInput formControlName="subject" placeholder="Assunto do e-mail">
            @if (form.get('subject')?.hasError('required') && form.get('subject')?.touched) {
              <mat-error>Assunto é obrigatório</mat-error>
            }
          </mat-form-field>

          <div class="toggle-row">
            <mat-slide-toggle formControlName="isHtml" color="primary">
              Corpo em HTML
            </mat-slide-toggle>
            <span class="toggle-hint">{{ form.value.isHtml ? 'Insira tags HTML no corpo' : 'Texto simples' }}</span>
          </div>

          <mat-form-field appearance="outline" class="field-full">
            <mat-label>Corpo da mensagem</mat-label>
            <mat-icon matPrefix>article</mat-icon>
            <textarea
              matInput
              formControlName="body"
              rows="8"
              [placeholder]="form.value.isHtml ? '<h1>Olá!</h1><p>Segue o boleto.</p>' : 'Digite sua mensagem aqui...'"
            ></textarea>
            @if (form.get('body')?.hasError('required') && form.get('body')?.touched) {
              <mat-error>Corpo da mensagem é obrigatório</mat-error>
            }
          </mat-form-field>

          <div class="actions-row">
            <button
              mat-flat-button
              color="primary"
              type="submit"
              class="btn-enviar"
              [disabled]="loading()"
            >
              @if (loading()) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                <mat-icon>send</mat-icon>
              }
              {{ loading() ? 'Enviando...' : 'Enviar E-mail' }}
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
          <span>E-mail enviado com sucesso!</span>
        </div>
      }

    </div>
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 20px; }

    .page-header {
      display: flex; align-items: center; gap: 12px;
      mat-icon { font-size: 28px; width: 28px; height: 28px; color: var(--primary, #3d5afe); }
      h1 { margin: 0; font-size: 22px; font-weight: 700; color: var(--text); }
    }

    .card-container {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
      box-shadow: var(--card-shadow);
    }

    .form-grid { display: flex; flex-direction: column; gap: 4px; }

    .field-full { width: 100%; }

    .toggle-row {
      display: flex; align-items: center; gap: 12px;
      padding: 4px 0 12px;
    }

    .toggle-hint { font-size: 13px; color: var(--text-sec); }

    .actions-row { display: flex; justify-content: flex-end; padding-top: 8px; }

    .btn-enviar {
      height: 48px; padding: 0 32px;
      font-size: 14px; font-weight: 600;
      display: flex; align-items: center; gap: 8px;
    }

    .feedback-banner {
      display: flex; align-items: center; gap: 10px;
      padding: 14px 20px; border-radius: 10px;
      font-size: 14px;
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
export class NotificationEmailComponent {
  private service = inject(NotificationService);

  loading = signal(false);
  error   = signal<string | null>(null);
  success = signal(false);

  form = new FormGroup({
    to:      new FormControl('', [Validators.required, Validators.email]),
    cc:      new FormControl('', [Validators.email]),
    subject: new FormControl('', Validators.required),
    body:    new FormControl('', Validators.required),
    isHtml:  new FormControl(true),
  });

  enviar() {
    if (this.loading()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set(null);
    this.success.set(false);

    const v = this.form.value;
    this.service.sendEmail({
      to:      v.to!,
      cc:      v.cc || undefined,
      subject: v.subject!,
      body:    v.body!,
      isHtml:  v.isHtml ?? true,
    }).subscribe({
      next: () => {
        this.success.set(true);
        this.form.reset({ isHtml: true });
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Erro ao enviar e-mail. Tente novamente.');
        this.loading.set(false);
      }
    });
  }
}
