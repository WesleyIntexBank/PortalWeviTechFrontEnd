import { Component } from '@angular/core';

@Component({
  selector: 'app-documento',
  standalone: true,
  template: `
    <div class="doc-container">
      <div class="doc-card">
        <div class="doc-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        </div>
        <h2>Documentação da API</h2>
        <p>A documentação está hospedada no Postman e não pode ser exibida diretamente aqui.</p>
        <a [href]="docUrl" target="_blank" rel="noopener noreferrer" class="doc-btn">
          Abrir documentação
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }

    .doc-container {
      display: flex;
      align-items: center;
      justify-content: center;
      height: calc(100vh - 52px);
      background: #f5f7fa;
    }

    .doc-card {
      background: #fff;
      border-radius: 12px;
      padding: 48px 56px;
      text-align: center;
      box-shadow: 0 2px 16px rgba(0,0,0,0.08);
      max-width: 420px;
      width: 100%;
    }

    .doc-icon {
      color: #6366f1;
      margin-bottom: 20px;
    }

    h2 {
      margin: 0 0 12px;
      font-size: 1.4rem;
      font-weight: 600;
      color: #1e293b;
    }

    p {
      margin: 0 0 28px;
      color: #64748b;
      font-size: 0.95rem;
      line-height: 1.5;
    }

    .doc-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #6366f1;
      color: #fff;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 8px;
      font-size: 0.95rem;
      font-weight: 500;
      transition: background 0.2s;
    }

    .doc-btn:hover {
      background: #4f46e5;
    }
  `]
})
export class DocumentoComponent {
  readonly docUrl = 'https://documenter.getpostman.com/view/984714/2sBXwjusmw';
}
