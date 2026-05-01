import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatTooltipModule,
  ],
  template: `
    <div class="login-page">

      <!-- Botão de tema -->
      <button
        mat-icon-button
        class="theme-fab"
        [matTooltip]="themeService.isDark() ? 'Tema Claro' : 'Tema Escuro'"
        (click)="themeService.toggle()"
      >
        <mat-icon>{{ themeService.isDark() ? 'light_mode' : 'dark_mode' }}</mat-icon>
      </button>

      <!-- Painel Esquerdo -->
      <div class="left-panel">
        <div class="left-content">
          <div class="brand-logo">
            <img src="assets/logo.png" alt="WeviTech" class="logo" />
            <div class="brand-name">
              <span class="brand-wevi">Wevi</span><span class="brand-tech">Tech</span>
            </div>
          </div>

          <div class="brand-tagline">
            <p>Acesse com segurança o ambiente exclusivo para parceiros e correspondentes do Intex Bank.</p>
          </div>

          <div class="features">
            <div class="feature-item">
              <div class="feature-icon">
                <i class='bx bx-shield-quarter'></i>
              </div>
              <div>
                <strong>Acesso Seguro</strong>
                <span>Conexão criptografada e autenticada</span>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">
                <i class='bx bx-line-chart'></i>
              </div>
              <div>
                <strong>Gestão Completa</strong>
                <span>Controle total das suas operações</span>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">
                <i class='bx bx-support'></i>
              </div>
              <div>
                <strong>Suporte Dedicado</strong>
                <span>Atendimento especializado 24/7</span>
              </div>
            </div>
          </div>
        </div>

        <div class="left-footer">
          <span>© {{ currentYear }} Intex Bank. Todos os direitos reservados.</span>
        </div>
      </div>

      <!-- Painel Direito -->
      <div class="right-panel">
        <div class="form-card">

          <div class="form-header">
            <h2>Bem-vindo de volta</h2>
            <p>Informe suas credenciais para acessar o portal</p>
          </div>

          <form class="login-form" (ngSubmit)="onSubmit()">

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>CPF / CNPJ</mat-label>
              <input
                matInput
                type="text"
                placeholder="000.000.000-00"
                [(ngModel)]="document"
                name="document"
                required
                autocomplete="username"
              />
              <mat-icon matSuffix>person_outline</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Senha</mat-label>
              <input
                matInput
                [type]="showPassword() ? 'text' : 'password'"
                placeholder="Digite sua senha"
                [(ngModel)]="password"
                name="password"
                required
                autocomplete="current-password"
              />
              <button
                mat-icon-button
                matSuffix
                type="button"
                (click)="togglePassword()"
                tabindex="-1"
              >
                <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </mat-form-field>

            <div class="form-options">
              <mat-checkbox [(ngModel)]="rememberMe" name="rememberMe" class="remember-check">
                Lembrar acesso
              </mat-checkbox>
              <a href="#" class="forgot-link" (click)="$event.preventDefault()">
                Esqueceu sua senha?
              </a>
            </div>

            <button
              mat-flat-button
              type="submit"
              class="btn-login full-width"
              [disabled]="loading()"
            >
              @if (loading()) {
                <span class="loading-dots">Entrando</span>
              } @else {
                <ng-container>
                  <mat-icon>login</mat-icon>
                  Entrar
                </ng-container>
              }
            </button>

          </form>

          <div class="form-footer">
            <span>Problemas para acessar? </span>
            <a href="#" (click)="$event.preventDefault()">Entre em contato</a>
          </div>

        </div>
      </div>

    </div>
  `,
  styles: [`
    .login-page {
      display: flex;
      height: 100vh;
      width: 100vw;
      overflow: hidden;
      background: var(--bg);
      position: relative;
      transition: background 0.25s ease;
    }

    /* Botão flutuante de tema */
    .theme-fab {
      position: absolute;
      top: 16px;
      right: 16px;
      z-index: 10;
      color: var(--text-sec) !important;
      background: var(--surface) !important;
      border: 1px solid var(--border) !important;
      box-shadow: var(--card-shadow) !important;
      transition: color 0.2s, background 0.25s !important;
    }

    .theme-fab:hover { color: var(--accent) !important; }

    /* ─── Painel Esquerdo ─── */
    .left-panel {
      width: 45%;
      background: linear-gradient(160deg, #13161f 0%, #0d0f18 60%, #0b1a0d 100%);
      border-right: 1px solid rgba(112, 199, 60, 0.15);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 48px 52px;
      position: relative;
      overflow: hidden;
    }

    .left-panel::before {
      content: '';
      position: absolute;
      top: -120px;
      right: -120px;
      width: 420px;
      height: 420px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(112, 199, 60, 0.08) 0%, transparent 70%);
      pointer-events: none;
    }

    .left-panel::after {
      content: '';
      position: absolute;
      bottom: -80px;
      left: -80px;
      width: 300px;
      height: 300px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(112, 199, 60, 0.05) 0%, transparent 70%);
      pointer-events: none;
    }

    .left-content { position: relative; z-index: 1; }

    /* Brand logo */
    .brand-logo {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 48px;
    }

    .logo { height: 52px; filter: brightness(1.05); }

    .brand-name { display: flex; align-items: baseline; }

    .brand-wevi {
      color: #e8eaf6;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 0.3px;
    }

    .brand-tech {
      color: #70c73c;
      font-size: 28px;
      font-weight: 700;
    }

    .brand-tagline p {
      font-size: 15px;
      color: rgba(232, 234, 246, 0.55);
      line-height: 1.7;
      max-width: 380px;
    }

    .features {
      margin-top: 48px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .feature-item {
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }

    .feature-icon {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      background: rgba(112, 199, 60, 0.12);
      border: 1px solid rgba(112, 199, 60, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 20px;
      color: #70c73c;
    }

    .feature-item strong {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: #c5cae9;
      margin-bottom: 2px;
    }

    .feature-item span {
      font-size: 13px;
      color: rgba(197, 202, 233, 0.5);
    }

    .left-footer {
      font-size: 12px;
      color: rgba(232, 234, 246, 0.3);
      position: relative;
      z-index: 1;
    }

    /* ─── Painel Direito ─── */
    .right-panel {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg);
      padding: 32px;
      transition: background 0.25s ease;
    }

    .form-card {
      width: 100%;
      max-width: 420px;
    }

    .form-header { margin-bottom: 36px; }

    .form-header h2 {
      font-size: 28px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 8px;
      letter-spacing: -0.3px;
    }

    .form-header p {
      font-size: 14px;
      color: var(--text-sec);
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .full-width { width: 100%; }

    /* Angular Material overrides */
    ::ng-deep .login-page .right-panel mat-form-field { width: 100%; }

    ::ng-deep .login-page .right-panel .mat-mdc-text-field-wrapper {
      background: var(--input-bg) !important;
      border-radius: 10px !important;
    }

    ::ng-deep .login-page .right-panel .mdc-notched-outline__leading,
    ::ng-deep .login-page .right-panel .mdc-notched-outline__notch,
    ::ng-deep .login-page .right-panel .mdc-notched-outline__trailing {
      border-color: var(--border) !important;
    }

    ::ng-deep .login-page .right-panel .mat-mdc-form-field:hover .mdc-notched-outline__leading,
    ::ng-deep .login-page .right-panel .mat-mdc-form-field:hover .mdc-notched-outline__notch,
    ::ng-deep .login-page .right-panel .mat-mdc-form-field:hover .mdc-notched-outline__trailing {
      border-color: rgba(112, 199, 60, 0.4) !important;
    }

    ::ng-deep .login-page .right-panel .mat-mdc-form-field.mat-focused .mdc-notched-outline__leading,
    ::ng-deep .login-page .right-panel .mat-mdc-form-field.mat-focused .mdc-notched-outline__notch,
    ::ng-deep .login-page .right-panel .mat-mdc-form-field.mat-focused .mdc-notched-outline__trailing {
      border-color: #70c73c !important;
      border-width: 1.5px !important;
    }

    ::ng-deep .login-page .right-panel .mat-mdc-form-field.mat-focused .mdc-floating-label {
      color: #70c73c !important;
    }

    ::ng-deep .login-page .right-panel .mdc-text-field__input {
      color: var(--text) !important;
    }

    ::ng-deep .login-page .right-panel .mdc-floating-label {
      color: var(--text-sec) !important;
    }

    ::ng-deep .login-page .right-panel .mat-mdc-form-field .mat-icon {
      color: var(--text-ter);
      font-size: 20px;
    }

    .form-options {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 4px 0 20px;
    }

    .remember-check { font-size: 13px; }

    ::ng-deep .login-page .right-panel .mat-mdc-checkbox .mdc-checkbox__background {
      border-color: var(--border) !important;
    }

    ::ng-deep .login-page .right-panel .mat-mdc-checkbox.mat-mdc-checkbox-checked .mdc-checkbox__background {
      background-color: #70c73c !important;
      border-color: #70c73c !important;
    }

    ::ng-deep .login-page .right-panel .mdc-label {
      color: var(--text-sec) !important;
      font-size: 13px;
    }

    .forgot-link {
      font-size: 13px;
      color: #70c73c;
      text-decoration: none;
      transition: opacity 0.2s;
    }

    .forgot-link:hover { opacity: 0.75; }

    .btn-login {
      background: #70c73c !important;
      color: #0d0f18 !important;
      font-weight: 700 !important;
      font-size: 15px !important;
      height: 50px !important;
      border-radius: 10px !important;
      letter-spacing: 0.3px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 8px !important;
      transition: background 0.2s, opacity 0.2s !important;
      width: 100% !important;
    }

    .btn-login:hover:not([disabled]) { background: #5fb832 !important; }

    .btn-login[disabled] { opacity: 0.6 !important; }

    .btn-login mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #0d0f18 !important;
    }

    .loading-dots::after {
      content: '...';
      animation: dots 1.2s steps(4, end) infinite;
    }

    @keyframes dots {
      0%, 20%  { content: ''; }
      40%      { content: '.'; }
      60%      { content: '..'; }
      80%, 100%{ content: '...'; }
    }

    .form-footer {
      margin-top: 28px;
      text-align: center;
      font-size: 13px;
      color: var(--text-ter);
    }

    .form-footer a { color: #70c73c; text-decoration: none; }
    .form-footer a:hover { text-decoration: underline; }

    /* ─── Responsivo ─── */
    @media (max-width: 900px) {
      .left-panel { display: none; }
      .right-panel { padding: 24px 16px; }
      .theme-fab { top: 12px; right: 12px; }
    }

    @media (max-width: 480px) {
      .form-card { max-width: 100%; }
      .form-header h2 { font-size: 24px; }
    }
  `]
})
export class LoginComponent {
  document = '';
  password = '';
  rememberMe = false;
  showPassword = signal(false);
  loading = signal(false);

  currentYear = new Date().getFullYear();
  themeService = inject(ThemeService);
  private router = inject(Router);

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  onSubmit() {
    if (!this.document || !this.password) return;

    this.loading.set(true);

    setTimeout(() => {
      this.loading.set(false);
      this.router.navigate(['/dashboard']);
    }, 2000);
  }
}
