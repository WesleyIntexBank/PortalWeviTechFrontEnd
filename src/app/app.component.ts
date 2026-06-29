import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';
import { TrackingService } from './core/services/tracking.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet></router-outlet>'
})
export class AppComponent {
  private theme = inject(ThemeService);
  private tracking = inject(TrackingService);

  constructor() {
    this.tracking.init();
  }
}
