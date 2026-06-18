import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LoginRequest {
  userName: string;
  password: string;
}

export interface AuthResponse {
  userId: number;
  userRole?: number;
  userName?: string;
  name?: string;
  email?: string;
  token?: string;
  tokenType?: string;
  tokenExpiration?: number;
  isA2F?: number;
  dateExpirated?: string;
  ws_MoneyGram?: number;
  ws_Change?: number;
  wS_Receita?: number;
  wS_CEP?: number;
  wS_MasterCard?: number;
}

export interface GenerateQrRequest {
  userName: string;
  password: string;
}

export interface GenerateQrResponse {
  base64?: string;
  key?: { accountName: string; accountSecret: string };
  message?: string;
}

export interface ValidateCodeRequest {
  userName: string;
  password: string;
  code: string;
}

export interface ValidateCodeResponse {
  result: boolean;
  token: string;
}

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private baseUrl = `${environment.apiUrl}/Auth`;

  isAuthenticated = signal(false);
  currentUser = signal<AuthResponse | null>(null);

  constructor() {
    const token = localStorage.getItem(TOKEN_KEY);
    const user = localStorage.getItem(USER_KEY);
    this.isAuthenticated.set(!!token);
    if (user) {
      try { this.currentUser.set(JSON.parse(user)); } catch { /* ignore */ }
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.baseUrl, credentials).pipe(
      tap(response => {
        if (!response) return;
        // Salva usuário parcial sempre (inclusive quando isA2F=1 sem token)
        // para que validateCode possa recuperar os dados depois
        localStorage.setItem(USER_KEY, JSON.stringify(response));
        if (response.token) {
          this.setToken(response.token);
          this.currentUser.set(response);
        }
      })
    );
  }

  generateQr(credentials: GenerateQrRequest): Observable<GenerateQrResponse> {
    return this.http.post<GenerateQrResponse>(`${this.baseUrl}/generateqr`, credentials);
  }

  validateCode(payload: ValidateCodeRequest): Observable<ValidateCodeResponse> {
    return this.http.post<ValidateCodeResponse>(`${this.baseUrl}/validatecode`, payload).pipe(
      tap(response => {
        if (response?.result && response.token) {
          this.setToken(response.token);
          // recupera usuário parcial salvo durante o login para manter currentUser populado
          const stored = localStorage.getItem(USER_KEY);
          if (stored) {
            try {
              const user: AuthResponse = JSON.parse(stored);
              user.token = response.token;
              this.currentUser.set(user);
              localStorage.setItem(USER_KEY, JSON.stringify(user));
            } catch { /* ignore */ }
          }
        }
      })
    );
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
    localStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }
}
