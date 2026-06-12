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
  selector: 'app-notification-whatsapp',
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
        <span class="wa-icon">
          <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </span>
        <h1>Envio de WhatsApp</h1>
      </div>

      <div class="card-container">
        <p class="card-desc">
          Envie mensagens via <strong>WhatsApp</strong> através da integração com <strong>Zenvia</strong>.
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
              placeholder="Digite a mensagem WhatsApp..."
              maxlength="1024"
            ></textarea>
            <mat-hint align="end">{{ form.value.message?.length ?? 0 }} / 1024</mat-hint>
            @if (form.get('message')?.hasError('required') && form.get('message')?.touched) {
              <mat-error>Mensagem é obrigatória</mat-error>
            }
          </mat-form-field>

          <div class="actions-row">
            <button mat-flat-button type="submit" class="btn-enviar" [disabled]="loading()">
              @if (loading()) { <mat-spinner diameter="20"></mat-spinner> }
              @else {
                <span class="wa-btn-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </span>
              }
              {{ loading() ? 'Enviando...' : 'Enviar WhatsApp' }}
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
          <span>Mensagem WhatsApp enviada com sucesso!</span>
        </div>
      }

    </div>
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 20px; }

    .page-header {
      display: flex; align-items: center; gap: 12px;
      h1 { margin: 0; font-size: 22px; font-weight: 700; color: var(--text); }
    }

    .wa-icon {
      display: flex; align-items: center; justify-content: center;
      width: 36px; height: 36px; color: #25d366;
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
      background: #25d366 !important;
      color: #fff !important;
    }

    .btn-enviar:disabled { opacity: 0.6; }

    .wa-btn-icon { display: flex; align-items: center; }

    .feedback-banner {
      display: flex; align-items: center; gap: 10px;
      padding: 14px 20px; border-radius: 10px; font-size: 14px;
      mat-icon { flex-shrink: 0; }
      &.error  { background: rgba(239,83,80,.10); border: 1px solid rgba(239,83,80,.30); color: #ef5350; }
      &.success { background: rgba(37,211,102,.10); border: 1px solid rgba(37,211,102,.30); color: #25d366; }
    }

    @media (max-width: 600px) {
      .actions-row { justify-content: stretch; }
      .btn-enviar { width: 100%; justify-content: center; }
    }
  `]
})
export class NotificationWhatsAppComponent {
  private service = inject(NotificationService);

  loading = signal(false);
  error   = signal<string | null>(null);
  success = signal(false);

  form = new FormGroup({
    number:  new FormControl('', [Validators.required, Validators.pattern(/^\d{10,15}$/)]),
    message: new FormControl('', Validators.required),
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
    this.service.sendWhatsApp({ number: v.number!, message: v.message! }).subscribe({
      next: () => {
        this.success.set(true);
        this.form.reset();
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Erro ao enviar mensagem. Tente novamente.');
        this.loading.set(false);
      }
    });
  }
}
