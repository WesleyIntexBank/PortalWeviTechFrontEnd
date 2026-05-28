import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { inject } from '@angular/core';

@Component({
  selector: 'app-metricas',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="page-container">
      <div class="iframe-wrapper">
        <div class="overlay" *ngIf="loading || error">
          <ng-container *ngIf="loading && !error">
            <mat-spinner diameter="48"></mat-spinner>
            <span class="overlay-text">Carregando dashboard...</span>
          </ng-container>
          <ng-container *ngIf="error">
            <mat-icon class="error-icon">error_outline</mat-icon>
            <span class="overlay-text">{{ errorMessage }}</span>
            <button class="retry-btn" (click)="reload()">Tentar novamente</button>
          </ng-container>
        </div>
        <iframe
          [src]="dashboardUrl"
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
      width: 100vw; /* ALTERADO: Força a largura a ser exatamente 100% da janela visível */
      max-width: 100%; /* Evita quebras dependendo do layout */
      padding: 0 !important; /* ALTERADO: O !important garante que nenhum layout global sobrescreva */
      margin: 0;
      overflow: hidden;
    }

    .iframe-wrapper {
      position: relative;
      flex: 1;
      width: 100%;
      height: 100%;
      border-radius: 0; /* ALTERADO: Removido cantos arredondados */
      overflow: hidden;
      border: none;     /* ALTERADO: Removida a borda cinza externa */
      background: #181b1f; /* ALTERADO: Fundo padrão escuro do Grafana evita o "piscar" branco antes do load */

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
      background: #181b1f; /* ALTERADO: Overlay escuro combinando com o Grafana */
      z-index: 10;
      border-radius: 0;
    }

    .overlay-text {
      font-size: 15px;
      color: #ccccdc; /* ALTERADO: Cor do texto legível no fundo escuro */
    }

    .error-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #e53935;
    }

    .retry-btn {
      margin-top: 4px;
      padding: 8px 24px;
      border: none;
      border-radius: 8px;
      background: var(--primary-dark, #3d5afe);
      color: #fff;
      font-size: 14px;
      cursor: pointer;

      &:hover {
        opacity: 0.88;
      }
    }
  `]
})
export class MetricasComponent implements OnInit {
  private sanitizer = inject(DomSanitizer);

  // Note que mantive o parâmetro &kiosk no final da URL. Ele é excelente pois remove o menu lateral do próprio Grafana.
  private readonly grafanaUrl = 'https://grafana.wevitech.com.br/public-dashboards/0030e99ba44148f29a8fa64cfb541379?theme=dark&kiosk';
  private readonly LOAD_TIMEOUT_MS = 15000;

  dashboardUrl!: SafeResourceUrl;
  loading = true;
  error = false;
  errorMessage = 'Não foi possível carregar o dashboard.';

  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  ngOnInit() {
    this.setUrl();
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
    this.errorMessage = 'Não foi possível carregar o dashboard.';
  }

  reload() {
    this.loading = true;
    this.error = false;
    this.setUrl();
  }

  private setUrl() {
    this.clearTimeout();
    this.dashboardUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.grafanaUrl);
    this.timeoutId = setTimeout(() => {
      if (this.loading) {
        this.loading = false;
        this.error = true;
        this.errorMessage = 'O servidor Grafana não respondeu. Verifique se grafana.wevitech.com.br está acessível.';
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
