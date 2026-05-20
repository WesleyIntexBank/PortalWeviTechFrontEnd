import { Component, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-documento',
  standalone: true,
  template: `
    <div class="iframe-wrapper">
      <iframe
        [src]="safeUrl"
        class="doc-iframe"
        frameborder="0"
        allowfullscreen
      ></iframe>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }

    .iframe-wrapper {
      position: fixed;
      top: 52px;
      left: 272px;
      right: 0;
      bottom: 0;
      z-index: 0;
    }

    .doc-iframe {
      width: 100%;
      height: 100%;
      border: none;
      display: block;
    }
  `]
})
export class DocumentoComponent {
  private sanitizer = inject(DomSanitizer);

  safeUrl: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
    'https://documenter.getpostman.com/view/984714/2sBXwjusmw'
  );
}
