import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { KafkaService, KafkaMessage, ProduceResult } from '../../core/services/kafka.service';

@Component({
  selector: 'app-kafka-tester',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatChipsModule,
    MatSlideToggleModule,
  ],
  template: `
    <div class="page-container">

      <div class="page-header">
        <mat-icon>hub</mat-icon>
        <h1>Kafka Tester</h1>
      </div>

      <mat-tab-group animationDuration="200ms" class="tabs">

        <!-- ── TAB PRODUCE ─────────────────────────────────────── -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">upload</mat-icon>
            Produce
          </ng-template>

          <div class="tab-content">
            <form [formGroup]="produceForm" (ngSubmit)="produce()" class="form-grid">

              <mat-form-field appearance="outline" class="field-full">
                <mat-label>Tópico</mat-label>
                <mat-icon matPrefix>topic</mat-icon>
                <input matInput formControlName="topic" placeholder="notifications">
                @if (produceForm.get('topic')?.hasError('required') && produceForm.get('topic')?.touched) {
                  <mat-error>Tópico é obrigatório</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="field-full">
                <mat-label>Key (opcional)</mat-label>
                <mat-icon matPrefix>vpn_key</mat-icon>
                <input matInput formControlName="key" placeholder="pedido-123">
              </mat-form-field>

              <mat-form-field appearance="outline" class="field-full">
                <mat-label>Mensagem (value)</mat-label>
                <mat-icon matPrefix>message</mat-icon>
                <textarea matInput formControlName="value" rows="5"
                  placeholder='{ "evento": "pedido_aprovado", "id": 123 }'></textarea>
                @if (produceForm.get('value')?.hasError('required') && produceForm.get('value')?.touched) {
                  <mat-error>Mensagem é obrigatória</mat-error>
                }
              </mat-form-field>

              <div class="actions-row">
                <button mat-flat-button color="primary" type="submit"
                  class="btn-action" [disabled]="produceLoading()">
                  @if (produceLoading()) {
                    <mat-spinner diameter="20"></mat-spinner>
                  } @else {
                    <mat-icon>send</mat-icon>
                  }
                  {{ produceLoading() ? 'Enviando...' : 'Publicar Mensagem' }}
                </button>
              </div>
            </form>

            @if (produceError()) {
              <div class="feedback-banner error">
                <mat-icon>error_outline</mat-icon>
                <span>{{ produceError() }}</span>
              </div>
            }

            @if (produceResult()) {
              <div class="result-card">
                <div class="result-header">
                  <mat-icon class="result-ok">check_circle</mat-icon>
                  <span>Mensagem publicada com sucesso</span>
                </div>
                <div class="result-grid">
                  <div class="result-item">
                    <span class="result-label">Tópico</span>
                    <span class="result-value">{{ produceResult()!.topic }}</span>
                  </div>
                  <div class="result-item">
                    <span class="result-label">Partição</span>
                    <span class="result-value">{{ produceResult()!.partition }}</span>
                  </div>
                  <div class="result-item">
                    <span class="result-label">Offset</span>
                    <span class="result-value">{{ produceResult()!.offset }}</span>
                  </div>
                  <div class="result-item">
                    <span class="result-label">Key</span>
                    <span class="result-value">{{ produceResult()!.key }}</span>
                  </div>
                  <div class="result-item full">
                    <span class="result-label">Timestamp</span>
                    <span class="result-value">{{ produceResult()!.timestamp | date:'dd/MM/yyyy HH:mm:ss' }}</span>
                  </div>
                </div>
              </div>
            }
          </div>
        </mat-tab>

        <!-- ── TAB CONSUME ─────────────────────────────────────── -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">download</mat-icon>
            Consume
          </ng-template>

          <div class="tab-content">
            <form [formGroup]="consumeForm" (ngSubmit)="consume()" class="form-grid">

              <mat-form-field appearance="outline">
                <mat-label>Tópico</mat-label>
                <mat-icon matPrefix>topic</mat-icon>
                <input matInput formControlName="topic" placeholder="notifications">
                @if (consumeForm.get('topic')?.hasError('required') && consumeForm.get('topic')?.touched) {
                  <mat-error>Tópico é obrigatório</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Group ID</mat-label>
                <mat-icon matPrefix>group</mat-icon>
                <input matInput formControlName="groupId" placeholder="extranet-consumer">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Máx. mensagens</mat-label>
                <mat-icon matPrefix>filter_list</mat-icon>
                <input matInput formControlName="maxMessages" type="number" min="1" max="100">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Timeout (ms)</mat-label>
                <mat-icon matPrefix>timer</mat-icon>
                <input matInput formControlName="timeoutMs" type="number" min="500" max="30000">
              </mat-form-field>

              <div class="toggle-row field-full">
                <mat-slide-toggle formControlName="fromBeginning" color="primary">
                  Ler do início (from beginning)
                </mat-slide-toggle>
                <span class="toggle-hint">
                  {{ consumeForm.value.fromBeginning
                    ? 'Lê todas as mensagens desde o offset 0, sem commitar'
                    : 'Retoma do último offset commitado pelo Group ID' }}
                </span>
              </div>

              <div class="actions-row">
                <button mat-flat-button color="accent" type="submit"
                  class="btn-action" [disabled]="consumeLoading()">
                  @if (consumeLoading()) {
                    <mat-spinner diameter="20"></mat-spinner>
                  } @else {
                    <mat-icon>inbox</mat-icon>
                  }
                  {{ consumeLoading() ? 'Consumindo...' : 'Consumir Mensagens' }}
                </button>
              </div>
            </form>

            @if (consumeError()) {
              <div class="feedback-banner error">
                <mat-icon>error_outline</mat-icon>
                <span>{{ consumeError() }}</span>
              </div>
            }

            @if (consumeNoNew()) {
              <div class="feedback-banner info">
                <mat-icon>info_outline</mat-icon>
                <span>Nenhuma mensagem nova — exibindo último resultado</span>
              </div>
            }

            @if (consumeMessages() !== null) {
              <div class="consume-result">
                <div class="consume-header">
                  <mat-icon>inbox</mat-icon>
                  <span>{{ consumeMessages()!.length }} mensagem(ns)</span>
                </div>

                @for (msg of consumeMessages()!; track msg.offset) {
                  <div class="msg-card">
                    <div class="msg-meta">
                      <span class="chip partition">P{{ msg.partition }}</span>
                      <span class="chip offset">&#64;{{ msg.offset }}</span>
                      @if (msg.key) { <span class="chip key">{{ msg.key }}</span> }
                      <span class="msg-time">{{ msg.timestamp | date:'dd/MM HH:mm:ss' }}</span>
                    </div>
                    <pre class="msg-value">{{ formatJson(msg.value) }}</pre>
                  </div>
                }
              </div>
            }
          </div>
        </mat-tab>

      </mat-tab-group>
    </div>
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 20px; }

    .page-header {
      display: flex; align-items: center; gap: 12px;
      mat-icon { font-size: 28px; width: 28px; height: 28px; color: var(--primary, #3d5afe); }
      h1 { margin: 0; font-size: 22px; font-weight: 700; color: var(--text); }
    }

    .tabs { background: transparent; }

    .tab-icon { margin-right: 6px; font-size: 18px; width: 18px; height: 18px; vertical-align: middle; }

    .tab-content { padding: 24px 0 0; }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 16px;
    }

    .field-full { grid-column: 1 / -1; }

    .toggle-row {
      display: flex; align-items: center; gap: 12px;
      padding: 4px 0 8px;
    }

    .toggle-hint { font-size: 13px; color: var(--text-sec, #aaa); }

    .actions-row {
      grid-column: 1 / -1;
      display: flex;
      justify-content: flex-end;
      padding-top: 8px;
    }

    .btn-action {
      height: 48px; padding: 0 32px;
      font-size: 14px; font-weight: 600;
      display: flex; align-items: center; gap: 8px;
    }

    /* Feedback */
    .feedback-banner {
      display: flex; align-items: center; gap: 10px;
      padding: 14px 20px; border-radius: 10px; margin-top: 16px;
      font-size: 14px;
      mat-icon { flex-shrink: 0; }
      &.error { background: rgba(239,83,80,.10); border: 1px solid rgba(239,83,80,.30); color: #ef5350; }
      &.info  { background: rgba(61,90,254,.10); border: 1px solid rgba(61,90,254,.30); color: #7986cb; }
    }

    /* Result produce */
    .result-card {
      margin-top: 20px;
      background: var(--card, #1e2130);
      border: 1px solid rgba(102,187,106,.3);
      border-radius: 12px;
      padding: 20px;
    }

    .result-header {
      display: flex; align-items: center; gap: 10px;
      font-size: 15px; font-weight: 600; color: #66bb6a;
      margin-bottom: 16px;
    }

    .result-ok { color: #66bb6a; }

    .result-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .result-item {
      display: flex; flex-direction: column; gap: 2px;
      &.full { grid-column: 1 / -1; }
    }

    .result-label { font-size: 11px; color: var(--text-sec, #aaa); text-transform: uppercase; letter-spacing: .8px; }
    .result-value { font-size: 14px; font-weight: 500; color: var(--text, #e0e0e0); font-family: monospace; }

    /* Consume result */
    .consume-result { margin-top: 20px; display: flex; flex-direction: column; gap: 12px; }

    .consume-header {
      display: flex; align-items: center; gap: 8px;
      font-size: 15px; font-weight: 600; color: var(--text, #e0e0e0);
      mat-icon { color: var(--primary, #3d5afe); }
    }

    .empty-hint { font-size: 13px; color: var(--text-sec, #aaa); font-weight: 400; }

    .msg-card {
      background: var(--card, #1e2130);
      border: 1px solid var(--border, rgba(255,255,255,.08));
      border-radius: 10px;
      padding: 14px 16px;
    }

    .msg-meta {
      display: flex; align-items: center; gap: 8px;
      margin-bottom: 10px; flex-wrap: wrap;
    }

    .chip {
      font-size: 11px; font-weight: 600; border-radius: 20px;
      padding: 2px 10px; font-family: monospace;
      &.partition { background: rgba(61,90,254,.18); color: #7986cb; }
      &.offset    { background: rgba(255,167,38,.15); color: #ffa726; }
      &.key       { background: rgba(102,187,106,.15); color: #66bb6a; }
    }

    .msg-time { font-size: 12px; color: var(--text-sec, #aaa); margin-left: auto; }

    .msg-value {
      margin: 0;
      font-size: 13px;
      font-family: 'Fira Code', 'Courier New', monospace;
      color: var(--text);
      background: var(--input-bg);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 10px 12px;
      white-space: pre-wrap;
      word-break: break-all;
      max-height: 200px;
      overflow-y: auto;
    }

    @media (max-width: 600px) {
      .form-grid { grid-template-columns: 1fr; }
      .field-full { grid-column: 1; }
      .actions-row { justify-content: stretch; }
      .btn-action { width: 100%; justify-content: center; }
    }
  `]
})
export class KafkaTesterComponent {
  private service = inject(KafkaService);

  produceLoading = signal(false);
  produceError   = signal<string | null>(null);
  produceResult  = signal<ProduceResult | null>(null);

  consumeLoading  = signal(false);
  consumeError    = signal<string | null>(null);
  consumeMessages = signal<KafkaMessage[] | null>(null);
  consumeNoNew    = signal(false);

  produceForm = new FormGroup({
    topic: new FormControl('notifications', Validators.required),
    key:   new FormControl(''),
    value: new FormControl('', Validators.required),
  });

  consumeForm = new FormGroup({
    topic:         new FormControl('notifications', Validators.required),
    groupId:       new FormControl('extranet-consumer'),
    maxMessages:   new FormControl(10),
    timeoutMs:     new FormControl(3000),
    fromBeginning: new FormControl(false),
  });

  produce() {
    if (this.produceLoading()) return;
    this.produceForm.markAllAsTouched();
    if (this.produceForm.invalid) return;

    this.produceLoading.set(true);
    this.produceError.set(null);
    this.produceResult.set(null);

    const v = this.produceForm.value;
    this.service.produce({ topic: v.topic!, value: v.value!, key: v.key || undefined })
      .subscribe({
        next: (res) => {
          this.produceResult.set(res);
          this.produceLoading.set(false);
        },
        error: (err) => {
          this.produceError.set(err?.error?.message ?? 'Erro ao publicar mensagem.');
          this.produceLoading.set(false);
        }
      });
  }

  consume() {
    if (this.consumeLoading()) return;
    this.consumeForm.markAllAsTouched();
    if (this.consumeForm.invalid) return;

    this.consumeLoading.set(true);
    this.consumeError.set(null);
    this.consumeNoNew.set(false);

    const v = this.consumeForm.value;
    this.service.consume(v.topic!, v.groupId!, v.maxMessages!, v.timeoutMs!, v.fromBeginning!)
      .subscribe({
        next: (res) => {
          if (res.messages.length > 0) {
            this.consumeMessages.set(res.messages);
          } else {
            this.consumeNoNew.set(true);
          }
          this.consumeLoading.set(false);
        },
        error: (err) => {
          this.consumeError.set(err?.error?.message ?? 'Erro ao consumir mensagens.');
          this.consumeLoading.set(false);
        }
      });
  }

  formatJson(value: string): string {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
}
