import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

const TOKEN_KEY = 'auth_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);

  isAuthenticated = signal(false);

  constructor() {
    this.isAuthenticated.set(!!localStorage.getItem(TOKEN_KEY));
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    this.isAuthenticated.set(true);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }
}
