import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-kafka-monitor',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="page-container">
      <div class="iframe-wrapper">
        <div class="overlay" *ngIf="loading || error">
          <ng-container *ngIf="loading && !error">
            <mat-spinner diameter="48"></mat-spinner>
            <span class="overlay-text">Carregando AKHQ...</span>
          </ng-container>
          <ng-container *ngIf="error">
            <mat-icon class="error-icon">error_outline</mat-icon>
            <span class="overlay-text">{{ errorMessage }}</span>
            <button class="retry-btn" (click)="reload()">Tentar novamente</button>
          </ng-container>
        </div>
        <iframe
          [src]="akhqUrl"
          width="100%"
          height="100%"
          frameborder="0"
          allowfullscreen
          (load)="onLoad()"
          (error)="onError()"
        ></iframe>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      display: flex;
      flex-direction: column;
      height: calc(100vh - 92px);
      width: 100vw;
      max-width: 100%;
      padding: 0 !important;
      margin: 0;
      overflow: hidden;
    }

    .iframe-wrapper {
      position: relative;
      flex: 1;
      width: 100%;
      height: 100%;
      overflow: hidden;
      border: none;
      background: #1a1d23;

      iframe {
        display: block;
        width: 100%;
        height: 100%;
        border: none;
      }
    }

    .overlay {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      background: #1a1d23;
      z-index: 10;
    }

    .overlay-text { font-size: 15px; color: #ccccdc; }

    .error-icon { font-size: 48px; width: 48px; height: 48px; color: #e53935; }

    .retry-btn {
      margin-top: 4px;
      padding: 8px 24px;
      border: none;
      border-radius: 8px;
      background: #3d5afe;
      color: #fff;
      font-size: 14px;
      cursor: pointer;
      &:hover { opacity: 0.88; }
    }
  `]
})
export class KafkaMonitorComponent implements OnInit, OnDestroy {
  private sanitizer = inject(DomSanitizer);

  private readonly AKHQ_URL = 'https://kafka.wevitech.com.br';
  private readonly LOAD_TIMEOUT_MS = 15000;

  akhqUrl!: SafeResourceUrl;
  loading = true;
  error = false;
  errorMessage = 'Não foi possível carregar o AKHQ.';

  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  ngOnInit() {
    this.setUrl();
  }

  ngOnDestroy() {
    this.clearTimeout();
  }

  onLoad() {
    this.clearTimeout();
    this.loading = false;
    this.error = false;
  }

  onError() {
    this.clearTimeout();
    this.loading = false;
    this.error = true;
  }

  reload() {
    this.loading = true;
    this.error = false;
    this.setUrl();
  }

  private setUrl() {
    this.clearTimeout();
    this.akhqUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.AKHQ_URL);
    this.timeoutId = setTimeout(() => {
      if (this.loading) {
        this.loading = false;
        this.error = true;
        this.errorMessage = 'O AKHQ não respondeu. Verifique se kafka.wevitech.com.br está acessível.';
      }
    }, this.LOAD_TIMEOUT_MS);
  }

  private clearTimeout() {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}
