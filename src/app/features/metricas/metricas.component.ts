import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { inject } from '@angular/core';

@Component({
  selector: 'app-metricas',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <mat-icon>bar_chart</mat-icon>
        <h1>Métricas</h1>
      </div>
      <div class="iframe-wrapper">
        <iframe
          [src]="dashboardUrl"
          width="100%"
          height="100%"
          frameborder="0"
          allowfullscreen
        ></iframe>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      display: flex;
      flex-direction: column;
      height: calc(100vh - 92px);
      padding: 16px;
    }

    .page-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
      flex-shrink: 0;

      mat-icon {
        color: var(--primary-dark, #3d5afe);
        font-size: 28px;
        width: 28px;
        height: 28px;
      }

      h1 {
        margin: 0;
        font-size: 22px;
        font-weight: 700;
        color: var(--text, #333);
      }
    }

    .iframe-wrapper {
      flex: 1;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid var(--border, #e0e0e0);
      background: var(--surface, #fff);

      iframe {
        display: block;
        width: 100%;
        height: 100%;
        border: none;
      }
    }
  `]
})
export class MetricasComponent implements OnInit {
  private sanitizer = inject(DomSanitizer);
  dashboardUrl!: SafeResourceUrl;

  ngOnInit() {
    // Altere para a porta real da sua API local ou para a URL de produção do barramento
    const apiProxyUrl = 'https://api.wevitech.com.br/api/DashboardProxy';

    // Autoriza a rota interna no Angular
    this.dashboardUrl = this.sanitizer.bypassSecurityTrustResourceUrl(apiProxyUrl);
  }
}
