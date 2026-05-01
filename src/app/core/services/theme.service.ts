import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  isDark = signal<boolean>(this.getInitialTheme());

  constructor() {
    effect(() => {
      const dark = this.isDark();
      document.documentElement.classList.toggle('dark-theme', dark);
      document.documentElement.classList.toggle('light-theme', !dark);
      localStorage.setItem('theme', dark ? 'dark' : 'light');
    });
    this.applyInitial();
  }

  toggle() {
    this.isDark.update(v => !v);
  }

  private getInitialTheme(): boolean {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark') return true;
    if (stored === 'light') return false;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
  }

  private applyInitial() {
    const dark = this.isDark();
    document.documentElement.classList.toggle('dark-theme', dark);
    document.documentElement.classList.toggle('light-theme', !dark);
  }
}
