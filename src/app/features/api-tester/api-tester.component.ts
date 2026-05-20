import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

interface ReqHeader {
  key: string;
  value: string;
  enabled: boolean;
}

interface ApiResponse {
  status: number;
  statusText: string;
  time: number;
  size: number;
  responseHeaders: { key: string; value: string }[];
  body: string;
  isJson: boolean;
  isError: boolean;
}

interface SavedRequest {
  id: string;
  name: string;
  method: string;
  url: string;
  authType: string;
  bearerToken: string;
  basicUser: string;
  basicPass: string;
  apiKeyName: string;
  apiKeyValue: string;
  reqHeaders: ReqHeader[];
  body: string;
}

interface Collection {
  id: string;
  name: string;
  requests: SavedRequest[];
}

@Component({
  selector: 'app-api-tester',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatTooltipModule],
  template: `
    <div class="api-root">

      <!-- Page Header -->
      <div class="page-header">
        <mat-icon>api</mat-icon>
        <h1>API Tester</h1>
      </div>

      <!-- Workspace: sidebar + editor -->
      <div class="workspace">

        <!-- ─── Collections Sidebar ─────────────────────── -->
        <div class="col-panel">
          <div class="col-panel-hdr">
            <span class="col-panel-title">
              <mat-icon>folder_special</mat-icon> Collections
            </span>
            <button class="icon-btn" (click)="startNewCollection()" matTooltip="Nova collection">
              <mat-icon>create_new_folder</mat-icon>
            </button>
          </div>

          @if (showNewColForm) {
            <div class="new-col-form">
              <input
                [(ngModel)]="newColName"
                class="nc-input"
                placeholder="Nome da collection"
                (keydown.enter)="createCollection()"
                (keydown.escape)="showNewColForm = false"
                #ncInput
              >
              <div class="nc-actions">
                <button class="nc-btn nc-ok" (click)="createCollection()">
                  <mat-icon>check</mat-icon>
                </button>
                <button class="nc-btn nc-cancel" (click)="showNewColForm = false">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            </div>
          }

          <div class="col-list">
            @if (!collections.length) {
              <div class="col-empty">
                <mat-icon>folder_open</mat-icon>
                <p>Sem collections</p>
                <span>Clique em + para criar</span>
              </div>
            }

            @for (col of collections; track col.id) {
              <div class="col-group">
                <div class="col-group-hdr" (click)="toggleColExpand(col.id)">
                  <mat-icon class="col-arrow" [class.open]="expandedCols.has(col.id)">
                    chevron_right
                  </mat-icon>
                  <mat-icon class="col-folder-icon">
                    {{ expandedCols.has(col.id) ? 'folder_open' : 'folder' }}
                  </mat-icon>
                  <span class="col-name">{{ col.name }}</span>
                  <span class="col-count">{{ col.requests.length }}</span>
                  <button
                    class="icon-btn del-btn sm"
                    (click)="deleteCollection(col.id, $event)"
                    matTooltip="Excluir collection"
                  >
                    <mat-icon>delete_outline</mat-icon>
                  </button>
                </div>

                @if (expandedCols.has(col.id)) {
                  <div class="req-list">
                    @if (!col.requests.length) {
                      <div class="req-empty">Sem requisições salvas</div>
                    }
                    @for (req of col.requests; track req.id) {
                      <div
                        class="req-row"
                        [class.active]="activeReqId === req.id"
                        (click)="loadRequest(req)"
                      >
                        <span class="method-tag m-{{ req.method.toLowerCase() }}">{{ req.method }}</span>
                        <span class="req-name" [title]="req.name">{{ req.name }}</span>
                        <button
                          class="icon-btn del-btn sm"
                          (click)="deleteRequest(col.id, req.id, $event)"
                          matTooltip="Remover"
                        >
                          <mat-icon>close</mat-icon>
                        </button>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- ─── Editor Panel ────────────────────────────── -->
        <div class="editor-panel">

          <!-- URL Bar -->
          <div class="url-bar">
            <select [(ngModel)]="method" class="method-select" [ngClass]="'m-' + method.toLowerCase()">
              @for (m of methods; track m) { <option [value]="m">{{ m }}</option> }
            </select>
            <input
              [(ngModel)]="url"
              class="url-input"
              placeholder="https://api.exemplo.com/endpoint"
              (keydown.enter)="send()"
            >
            <button
              class="save-btn"
              (click)="openSaveDialog()"
              [disabled]="!url.trim()"
              matTooltip="Salvar na collection"
            >
              <mat-icon>bookmark_add</mat-icon> Salvar
            </button>
            <button class="send-btn" (click)="send()" [disabled]="loading() || !url.trim()">
              @if (loading()) { <span class="spin"></span> Enviando... }
              @else { <mat-icon>send</mat-icon> Enviar }
            </button>
          </div>

          <!-- Config Card -->
          <div class="card">
            <div class="tabs">
              <button class="tab" [class.active]="tab === 'auth'" (click)="tab = 'auth'">
                Auth @if (authType !== 'none') { <span class="dot"></span> }
              </button>
              <button class="tab" [class.active]="tab === 'headers'" (click)="tab = 'headers'">
                Headers @if (enabledHeaders > 0) { <span class="badge">{{ enabledHeaders }}</span> }
              </button>
              @if (hasBody) {
                <button class="tab" [class.active]="tab === 'body'" (click)="tab = 'body'">
                  Body @if (body.trim()) { <span class="dot"></span> }
                </button>
              }
            </div>

            <div class="tab-content">

              <!-- Auth -->
              @if (tab === 'auth') {
                <div class="form-grid">
                  <div class="field">
                    <label>Autenticação</label>
                    <select [(ngModel)]="authType" class="f-select">
                      <option value="none">Nenhuma</option>
                      <option value="bearer">Bearer Token</option>
                      <option value="basic">Basic Auth</option>
                      <option value="apikey">API Key (Header)</option>
                    </select>
                  </div>

                  @if (authType === 'bearer') {
                    <div class="field">
                      <label>Token</label>
                      <input [(ngModel)]="bearerToken" class="f-input" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...">
                    </div>
                  }

                  @if (authType === 'basic') {
                    <div class="field-row">
                      <div class="field">
                        <label>Usuário</label>
                        <input [(ngModel)]="basicUser" class="f-input" placeholder="username">
                      </div>
                      <div class="field">
                        <label>Senha</label>
                        <input [(ngModel)]="basicPass" type="password" class="f-input" placeholder="password">
                      </div>
                    </div>
                  }

                  @if (authType === 'apikey') {
                    <div class="field-row">
                      <div class="field">
                        <label>Nome do Header</label>
                        <input [(ngModel)]="apiKeyName" class="f-input" placeholder="X-API-Key">
                      </div>
                      <div class="field">
                        <label>Valor</label>
                        <input [(ngModel)]="apiKeyValue" class="f-input" placeholder="sua-api-key">
                      </div>
                    </div>
                  }

                  @if (authType === 'none') {
                    <p class="info-msg"><mat-icon>info_outline</mat-icon> Nenhuma autenticação configurada.</p>
                  }
                </div>
              }

              <!-- Headers -->
              @if (tab === 'headers') {
                <div class="headers-section">
                  <div class="h-list">
                    @for (h of reqHeaders; track $index; let i = $index) {
                      <div class="h-row">
                        <input type="checkbox" [(ngModel)]="h.enabled" class="h-check">
                        <input [(ngModel)]="h.key" placeholder="Key" class="h-inp h-key">
                        <span class="h-colon">:</span>
                        <input [(ngModel)]="h.value" placeholder="Value" class="h-inp h-val">
                        <button class="icon-btn del-btn" (click)="removeHeader(i)" matTooltip="Remover">
                          <mat-icon>close</mat-icon>
                        </button>
                      </div>
                    }
                  </div>
                  <button class="add-btn" (click)="addHeader()">
                    <mat-icon>add</mat-icon> Adicionar Header
                  </button>
                </div>
              }

              <!-- Body -->
              @if (tab === 'body' && hasBody) {
                <div class="body-section">
                  <div class="body-toolbar">
                    <span class="body-label">JSON</span>
                    <button class="icon-btn" (click)="formatBody()" matTooltip="Formatar JSON"><mat-icon>auto_fix_high</mat-icon></button>
                    <button class="icon-btn" (click)="body = ''" matTooltip="Limpar"><mat-icon>clear</mat-icon></button>
                  </div>
                  <textarea
                    [(ngModel)]="body"
                    class="body-editor"
                    placeholder='{&#10;  "key": "value"&#10;}'
                    spellcheck="false"
                    rows="8"
                  ></textarea>
                </div>
              }

            </div>
          </div>

          <!-- Response -->
          @if (response()) {
            <div class="card">
              <div class="res-header">
                <div class="res-meta">
                  <span class="status-badge" [ngClass]="statusClass(response()!.status)">
                    {{ response()!.status || '—' }} {{ response()!.statusText }}
                  </span>
                  <span class="meta-pill"><mat-icon>schedule</mat-icon>{{ response()!.time }}ms</span>
                  <span class="meta-pill"><mat-icon>storage</mat-icon>{{ fmtSize(response()!.size) }}</span>
                </div>
                <button class="icon-btn" (click)="copy()" matTooltip="Copiar"><mat-icon>content_copy</mat-icon></button>
              </div>

              <div class="tabs">
                <button class="tab" [class.active]="resTab === 0" (click)="resTab = 0">Body</button>
                <button class="tab" [class.active]="resTab === 1" (click)="resTab = 1">
                  Headers <span class="badge">{{ response()!.responseHeaders.length }}</span>
                </button>
              </div>

              @if (resTab === 0) {
                <pre class="res-body" [innerHTML]="renderBody()"></pre>
              }

              @if (resTab === 1) {
                <div class="res-headers">
                  @for (h of response()!.responseHeaders; track h.key) {
                    <div class="rh-row">
                      <span class="rh-key">{{ h.key }}</span>
                      <span class="rh-val">{{ h.value }}</span>
                    </div>
                  }
                </div>
              }
            </div>
          }

        </div><!-- /editor-panel -->
      </div><!-- /workspace -->

    </div><!-- /api-root -->

    <!-- ─── Save Dialog Overlay ─────────────────────────── -->
    @if (showSaveDialog) {
      <div class="overlay" (click)="closeSaveDialogOnBackdrop($event)">
        <div class="save-dialog">
          <div class="save-dialog-hdr">
            <mat-icon>bookmark_add</mat-icon>
            <span>Salvar Requisição</span>
            <button class="icon-btn" (click)="showSaveDialog = false"><mat-icon>close</mat-icon></button>
          </div>

          <div class="save-dialog-body">
            <div class="field">
              <label>Nome da Requisição</label>
              <input
                [(ngModel)]="saveReqName"
                class="f-input"
                placeholder="Ex: Listar usuários"
                (keydown.enter)="saveRequest()"
                (keydown.escape)="showSaveDialog = false"
              >
            </div>

            <div class="field">
              <label>Collection</label>
              @if (collections.length) {
                <select [(ngModel)]="saveToColId" class="f-select">
                  @for (col of collections; track col.id) {
                    <option [value]="col.id">{{ col.name }}</option>
                  }
                </select>
              } @else {
                <p class="no-col-warning">
                  <mat-icon>warning_amber</mat-icon>
                  Nenhuma collection. Crie uma primeiro.
                </p>
              }
            </div>
          </div>

          <div class="save-dialog-actions">
            <button class="btn-cancel" (click)="showSaveDialog = false">Cancelar</button>
            <button
              class="btn-save"
              (click)="saveRequest()"
              [disabled]="!saveReqName.trim() || !collections.length"
            >
              <mat-icon>save</mat-icon> Salvar
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ─── Toast Notification ──────────────────────────── -->
    @if (toast) {
      <div class="toast" [class.toast-success]="toast.type === 'success'" [class.toast-error]="toast.type === 'error'">
        <mat-icon>{{ toast.type === 'success' ? 'check_circle' : 'error_outline' }}</mat-icon>
        {{ toast.msg }}
      </div>
    }
  `,
  styles: [`
    /* ─── Root ─────────────────────────────────────────── */
    .api-root {
      display: flex;
      flex-direction: column;
    }

    /* ─── Workspace ────────────────────────────────────── */
    .workspace {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }

    /* ─── Collections Sidebar ──────────────────────────── */
    .col-panel {
      width: 268px;
      flex-shrink: 0;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .col-panel-hdr {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 12px 12px 14px;
      border-bottom: 1px solid var(--border);
      background: var(--bg);
    }

    .col-panel-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 700;
      color: var(--text-sec);
      text-transform: uppercase;
      letter-spacing: 0.6px;
      mat-icon { font-size: 16px; width: 16px; height: 16px; color: var(--body-label); }
    }

    /* New collection inline form */
    .new-col-form {
      padding: 10px 10px 8px;
      border-bottom: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 6px;
      background: rgba(61,90,254,0.04);
    }
    .nc-input {
      background: var(--bg);
      border: 1px solid var(--primary-dark, #3d5afe);
      border-radius: 7px;
      padding: 8px 10px;
      font-size: 13px;
      color: var(--text);
      outline: none;
      width: 100%;
    }
    .nc-actions { display: flex; gap: 6px; }
    .nc-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      border-radius: 7px;
      height: 32px;
      cursor: pointer;
      transition: opacity 0.2s;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
    .nc-btn:hover { opacity: 0.85; }
    .nc-ok { background: var(--primary-dark, #3d5afe); color: #fff; }
    .nc-cancel { background: rgba(244,67,54,0.12); color: #f44336; }

    /* Collections list */
    .col-list { overflow-y: auto; max-height: 540px; }

    .col-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 28px 12px;
      gap: 6px;
      mat-icon { font-size: 32px; width: 32px; height: 32px; color: var(--text-ter); }
      p { font-size: 13px; color: var(--text-sec); font-weight: 500; }
      span { font-size: 11px; color: var(--text-ter); }
    }

    .col-group { border-bottom: 1px solid var(--border); }
    .col-group:last-child { border-bottom: none; }

    .col-group-hdr {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 9px 8px 9px 10px;
      cursor: pointer;
      transition: background 0.15s;
      user-select: none;
    }
    .col-group-hdr:hover { background: var(--row-hover); }

    .col-arrow {
      font-size: 16px; width: 16px; height: 16px;
      color: var(--text-ter);
      transition: transform 0.2s;
      flex-shrink: 0;
    }
    .col-arrow.open { transform: rotate(90deg); }

    .col-folder-icon {
      font-size: 16px; width: 16px; height: 16px;
      color: #ff9800;
      flex-shrink: 0;
    }

    .col-name {
      flex: 1;
      font-size: 13px;
      font-weight: 500;
      color: var(--text);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .col-count {
      font-size: 10px;
      font-weight: 700;
      background: rgba(255,255,255,0.07);
      color: var(--text-sec);
      padding: 1px 6px;
      border-radius: 10px;
      flex-shrink: 0;
    }

    /* Requests list */
    .req-list {
      background: rgba(0,0,0,0.12);
      border-top: 1px solid var(--border);
    }

    .req-empty {
      padding: 10px 16px;
      font-size: 11px;
      color: var(--text-ter);
      font-style: italic;
    }

    .req-row {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 7px 8px 7px 20px;
      cursor: pointer;
      transition: background 0.15s;
      border-bottom: 1px solid rgba(255,255,255,0.03);
    }
    .req-row:last-child { border-bottom: none; }
    .req-row:hover { background: rgba(255,255,255,0.05); }
    .req-row.active { background: rgba(61,90,254,0.1); border-left: 2px solid var(--primary-dark, #3d5afe); padding-left: 18px; }

    .method-tag {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 5px;
      border-radius: 4px;
      flex-shrink: 0;
      letter-spacing: 0.3px;
      background: rgba(255,255,255,0.06);
    }
    .method-tag.m-get    { color: #4caf50; }
    .method-tag.m-post   { color: #ff9800; }
    .method-tag.m-put    { color: #2196f3; }
    .method-tag.m-delete { color: #f44336; }
    .method-tag.m-patch  { color: #9c27b0; }

    .req-name {
      flex: 1;
      font-size: 12px;
      color: var(--text-sec);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .req-row.active .req-name { color: var(--text); }

    /* ─── Editor Panel ──────────────────────────────────── */
    .editor-panel {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    /* ─── URL Bar ──────────────────────────────────────── */
    .url-bar {
      display: flex;
      gap: 8px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 8px;
      transition: border-color 0.2s;
    }
    .url-bar:focus-within { border-color: var(--primary-dark, #3d5afe); }

    .method-select {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      outline: none;
      min-width: 90px;
      color: var(--text);
      transition: border-color 0.2s;
    }
    .method-select:focus { border-color: var(--primary-dark, #3d5afe); }
    .m-get    { color: #4caf50 !important; }
    .m-post   { color: #ff9800 !important; }
    .m-put    { color: #2196f3 !important; }
    .m-delete { color: #f44336 !important; }
    .m-patch  { color: #9c27b0 !important; }

    .url-input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      font-size: 14px;
      color: var(--text);
      padding: 8px 4px;
      min-width: 0;
    }
    .url-input::placeholder { color: var(--text-sec); }

    .save-btn {
      display: flex;
      align-items: center;
      gap: 5px;
      background: rgba(255,255,255,0.06);
      color: var(--text-sec);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 8px 14px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
      flex-shrink: 0;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }
    .save-btn:hover:not(:disabled) {
      background: rgba(61,90,254,0.12);
      border-color: var(--primary-dark, #3d5afe);
      color: var(--primary-dark, #3d5afe);
    }
    .save-btn:disabled { opacity: 0.35; cursor: not-allowed; }

    .send-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #3d5afe, #70c73c);
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 8px 18px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.15s;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .send-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
    .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .send-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .spin {
      width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,0.35);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spinning 0.65s linear infinite;
      flex-shrink: 0;
    }
    @keyframes spinning { to { transform: rotate(360deg); } }

    /* ─── Card ─────────────────────────────────────────── */
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
    }

    /* ─── Tabs ─────────────────────────────────────────── */
    .tabs {
      display: flex;
      border-bottom: 1px solid var(--border);
      padding: 0 8px;
      gap: 2px;
    }
    .tab {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 16px;
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      color: var(--text-sec);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: color 0.2s, border-color 0.2s;
      margin-bottom: -1px;
    }
    .tab:hover { color: var(--text); }
    .tab.active { color: var(--primary-dark, #3d5afe); border-bottom-color: var(--primary-dark, #3d5afe); }

    .dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: #70c73c; flex-shrink: 0;
    }
    .badge {
      background: rgba(61,90,254,0.15);
      color: var(--primary-dark, #3d5afe);
      font-size: 10px;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 10px;
    }

    /* ─── Tab Content ──────────────────────────────────── */
    .tab-content { padding: 16px; }

    .form-grid { display: flex; flex-direction: column; gap: 12px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .field label {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-sec);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .f-select, .f-input {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 9px 12px;
      font-size: 14px;
      color: var(--text);
      outline: none;
      transition: border-color 0.2s;
      width: 100%;
    }
    .f-select:focus, .f-input:focus { border-color: var(--primary-dark, #3d5afe); }
    .info-msg {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-sec);
      font-size: 13px;
      mat-icon { font-size: 16px; width: 16px; height: 16px; opacity: 0.6; }
    }

    /* Headers */
    .headers-section { display: flex; flex-direction: column; gap: 8px; }
    .h-list { display: flex; flex-direction: column; gap: 6px; }
    .h-row { display: flex; align-items: center; gap: 8px; }
    .h-check {
      width: 16px; height: 16px;
      accent-color: var(--primary-dark, #3d5afe);
      cursor: pointer; flex-shrink: 0;
    }
    .h-inp {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 7px 10px;
      font-size: 13px;
      color: var(--text);
      outline: none;
      transition: border-color 0.2s;
    }
    .h-inp:focus { border-color: var(--primary-dark, #3d5afe); }
    .h-key { flex: 0 0 200px; }
    .h-val { flex: 1; }
    .h-colon { color: var(--text-sec); font-size: 16px; }

    /* ─── Icon Buttons ──────────────────────────────────── */
    .icon-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--text-sec);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 30px; height: 30px;
      border-radius: 6px;
      transition: background 0.2s, color 0.2s;
      flex-shrink: 0;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }
    .icon-btn:hover { background: rgba(255,255,255,0.08); color: var(--text); }
    .icon-btn.sm { width: 24px; height: 24px; }
    .icon-btn.sm mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .del-btn:hover { background: rgba(244,67,54,0.1) !important; color: #f44336 !important; }

    .add-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: transparent;
      border: 1px dashed var(--border);
      border-radius: 8px;
      padding: 7px 14px;
      font-size: 13px;
      color: var(--text-sec);
      cursor: pointer;
      transition: all 0.2s;
      align-self: flex-start;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }
    .add-btn:hover {
      border-color: var(--primary-dark, #3d5afe);
      color: var(--primary-dark, #3d5afe);
      background: rgba(61,90,254,0.05);
    }

    /* Body */
    .body-section { display: flex; flex-direction: column; gap: 8px; }
    .body-toolbar { display: flex; align-items: center; gap: 6px; }
    .body-label {
      font-size: 11px; font-weight: 700;
      color: var(--text-sec);
      background: var(--bg);
      border: 1px solid var(--border);
      padding: 3px 10px; border-radius: 12px;
      letter-spacing: 0.5px;
    }
    .body-editor {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px;
      font-size: 13px;
      font-family: 'Consolas', 'Monaco', monospace;
      color: var(--text);
      outline: none;
      resize: vertical;
      width: 100%;
      line-height: 1.6;
      transition: border-color 0.2s;
    }
    .body-editor:focus { border-color: var(--primary-dark, #3d5afe); }

    /* ─── Response ─────────────────────────────────────── */
    .res-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
    }
    .res-meta { display: flex; align-items: center; gap: 12px; }

    .status-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
    }
    .s-ok  { background: rgba(76,175,80,0.15);  color: #4caf50; }
    .s-3xx { background: rgba(255,152,0,0.15);  color: #ff9800; }
    .s-4xx { background: rgba(244,67,54,0.15);  color: #f44336; }
    .s-5xx { background: rgba(156,39,176,0.15); color: #9c27b0; }
    .s-err { background: rgba(244,67,54,0.15);  color: #f44336; }

    .meta-pill {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: var(--text-sec);
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }

    .res-body {
      margin: 0;
      padding: 16px;
      font-size: 13px;
      font-family: 'Consolas', 'Monaco', monospace;
      color: var(--text);
      white-space: pre-wrap;
      word-break: break-all;
      max-height: 520px;
      overflow-y: auto;
      line-height: 1.6;
    }
    .res-body::-webkit-scrollbar { width: 4px; }
    .res-body::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

    :host ::ng-deep .j-key  { color: #e06c75; }
    :host ::ng-deep .j-str  { color: #98c379; }
    :host ::ng-deep .j-num  { color: #d19a66; }
    :host ::ng-deep .j-bool { color: #56b6c2; }
    :host ::ng-deep .j-null { color: #56b6c2; opacity: 0.7; }

    .res-headers {
      padding: 8px 16px 16px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .rh-row {
      display: flex;
      gap: 12px;
      padding: 6px 8px;
      border-radius: 6px;
      font-size: 12px;
    }
    .rh-row:hover { background: var(--row-hover); }
    .rh-key { color: #e06c75; font-family: monospace; min-width: 200px; font-weight: 600; }
    .rh-val { color: var(--text-sec); font-family: monospace; word-break: break-all; }

    /* ─── Save Dialog Overlay ──────────────────────────── */
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.55);
      backdrop-filter: blur(3px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .save-dialog {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      width: 420px;
      max-width: 95vw;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      overflow: hidden;
    }

    .save-dialog-hdr {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px 16px 16px 20px;
      border-bottom: 1px solid var(--border);
      background: var(--bg);
      mat-icon { color: var(--body-label); font-size: 20px; width: 20px; height: 20px; }
      span { flex: 1; font-size: 15px; font-weight: 600; color: var(--text); }
    }

    .save-dialog-body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .no-col-warning {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #ff9800;
      font-size: 13px;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }

    .save-dialog-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      padding: 12px 20px 16px;
      border-top: 1px solid var(--border);
    }

    .btn-cancel {
      background: transparent;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 9px 18px;
      font-size: 13px;
      color: var(--text-sec);
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-cancel:hover { background: var(--row-hover); color: var(--text); }

    .btn-save {
      display: flex;
      align-items: center;
      gap: 6px;
      background: var(--primary-dark, #3d5afe);
      border: none;
      border-radius: 8px;
      padding: 9px 20px;
      font-size: 13px;
      font-weight: 600;
      color: #fff;
      cursor: pointer;
      transition: opacity 0.2s;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }
    .btn-save:hover:not(:disabled) { opacity: 0.88; }
    .btn-save:disabled { opacity: 0.4; cursor: not-allowed; }

    /* ─── Toast ────────────────────────────────────────── */
    .toast {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 24px;
      font-size: 13px;
      font-weight: 500;
      z-index: 2000;
      box-shadow: 0 4px 20px rgba(0,0,0,0.35);
      animation: toast-in 0.2s ease;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
    .toast-success { background: #2e7d32; color: #fff; }
    .toast-error   { background: #b71c1c; color: #fff; }
    @keyframes toast-in { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }

    /* ─── Responsive ───────────────────────────────────── */
    @media (max-width: 768px) {
      .workspace { flex-direction: column; }
      .col-panel { width: 100%; }
      .col-list { max-height: 240px; }
      .url-bar { flex-wrap: wrap; }
      .url-input { width: 100%; order: 3; }
      .field-row { grid-template-columns: 1fr; }
      .h-key { flex: 0 0 120px; }
      .save-btn span { display: none; }
    }
  `]
})
export class ApiTesterComponent implements OnInit {
  // ─── Request state ──────────────────────────────────
  method = 'GET';
  url = '';
  authType = 'none';
  bearerToken = '';
  basicUser = '';
  basicPass = '';
  apiKeyName = 'X-API-Key';
  apiKeyValue = '';
  reqHeaders: ReqHeader[] = [{ key: '', value: '', enabled: true }];
  body = '';
  tab = 'auth';
  resTab = 0;

  loading = signal(false);
  response = signal<ApiResponse | null>(null);

  readonly methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

  // ─── Collections state ──────────────────────────────
  collections: Collection[] = [];
  expandedCols = new Set<string>();
  activeReqId: string | null = null;

  showNewColForm = false;
  newColName = '';

  showSaveDialog = false;
  saveReqName = '';
  saveToColId = '';

  toast: { msg: string; type: 'success' | 'error' } | null = null;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly STORAGE_KEY = 'api-tester-collections';

  ngOnInit() {
    this.loadFromStorage();
  }

  // ─── Storage ────────────────────────────────────────
  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) this.collections = JSON.parse(stored);
    } catch {}
  }

  private saveToStorage() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.collections));
  }

  private uid(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  // ─── Collection actions ─────────────────────────────
  startNewCollection() {
    this.showNewColForm = true;
    this.newColName = '';
  }

  createCollection() {
    const name = this.newColName.trim();
    if (!name) return;
    const col: Collection = { id: this.uid(), name, requests: [] };
    this.collections = [...this.collections, col];
    this.expandedCols.add(col.id);
    this.showNewColForm = false;
    this.newColName = '';
    this.saveToStorage();
    this.showToast('Collection criada!', 'success');
  }

  deleteCollection(id: string, event: Event) {
    event.stopPropagation();
    this.collections = this.collections.filter(c => c.id !== id);
    this.expandedCols.delete(id);
    if (this.collections.length === 0) this.activeReqId = null;
    this.saveToStorage();
    this.showToast('Collection removida', 'success');
  }

  toggleColExpand(id: string) {
    if (this.expandedCols.has(id)) this.expandedCols.delete(id);
    else this.expandedCols.add(id);
  }

  // ─── Save dialog ────────────────────────────────────
  openSaveDialog() {
    if (!this.url.trim()) return;
    this.saveReqName = `${this.method} ${this.url}`;
    this.saveToColId = this.collections[0]?.id ?? '';
    this.showSaveDialog = true;
  }

  closeSaveDialogOnBackdrop(event: Event) {
    if ((event.target as HTMLElement).classList.contains('overlay')) {
      this.showSaveDialog = false;
    }
  }

  saveRequest() {
    const name = this.saveReqName.trim();
    const col = this.collections.find(c => c.id === this.saveToColId);
    if (!name || !col) return;

    const req: SavedRequest = {
      id: this.uid(), name,
      method: this.method, url: this.url,
      authType: this.authType, bearerToken: this.bearerToken,
      basicUser: this.basicUser, basicPass: this.basicPass,
      apiKeyName: this.apiKeyName, apiKeyValue: this.apiKeyValue,
      reqHeaders: this.reqHeaders.map(h => ({ ...h })),
      body: this.body,
    };

    col.requests = [...col.requests, req];
    this.collections = [...this.collections];
    this.expandedCols.add(col.id);
    this.activeReqId = req.id;
    this.showSaveDialog = false;
    this.saveToStorage();
    this.showToast('Requisição salva!', 'success');
  }

  // ─── Load request ────────────────────────────────────
  loadRequest(req: SavedRequest) {
    this.method = req.method;
    this.url = req.url;
    this.authType = req.authType;
    this.bearerToken = req.bearerToken;
    this.basicUser = req.basicUser;
    this.basicPass = req.basicPass;
    this.apiKeyName = req.apiKeyName;
    this.apiKeyValue = req.apiKeyValue;
    this.reqHeaders = req.reqHeaders.map(h => ({ ...h }));
    this.body = req.body;
    this.activeReqId = req.id;
    this.response.set(null);
    if (!this.reqHeaders.length) this.addHeader();
  }

  // ─── Delete request ──────────────────────────────────
  deleteRequest(colId: string, reqId: string, event: Event) {
    event.stopPropagation();
    const col = this.collections.find(c => c.id === colId);
    if (!col) return;
    col.requests = col.requests.filter(r => r.id !== reqId);
    this.collections = [...this.collections];
    if (this.activeReqId === reqId) this.activeReqId = null;
    this.saveToStorage();
    this.showToast('Requisição removida', 'success');
  }

  // ─── Toast ───────────────────────────────────────────
  private showToast(msg: string, type: 'success' | 'error') {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast = { msg, type };
    this.toastTimer = setTimeout(() => (this.toast = null), 2500);
  }

  // ─── Request form helpers ────────────────────────────
  get hasBody(): boolean {
    return ['POST', 'PUT', 'PATCH'].includes(this.method);
  }

  get enabledHeaders(): number {
    return this.reqHeaders.filter(h => h.enabled && h.key.trim()).length;
  }

  addHeader() {
    this.reqHeaders = [...this.reqHeaders, { key: '', value: '', enabled: true }];
  }

  removeHeader(i: number) {
    this.reqHeaders = this.reqHeaders.filter((_, idx) => idx !== i);
    if (!this.reqHeaders.length) this.addHeader();
  }

  formatBody() {
    try { this.body = JSON.stringify(JSON.parse(this.body), null, 2); } catch {}
  }

  copy() {
    const r = this.response();
    if (r) navigator.clipboard.writeText(r.body).catch(() => {});
  }

  // ─── Send request ────────────────────────────────────
  async send() {
    if (!this.url.trim() || this.loading()) return;
    this.loading.set(true);
    this.response.set(null);

    const headers: Record<string, string> = {};

    if (this.authType === 'bearer' && this.bearerToken)
      headers['Authorization'] = `Bearer ${this.bearerToken}`;
    else if (this.authType === 'basic' && (this.basicUser || this.basicPass))
      headers['Authorization'] = `Basic ${btoa(`${this.basicUser}:${this.basicPass}`)}`;
    else if (this.authType === 'apikey' && this.apiKeyName && this.apiKeyValue)
      headers[this.apiKeyName] = this.apiKeyValue;

    for (const h of this.reqHeaders)
      if (h.enabled && h.key.trim()) headers[h.key.trim()] = h.value;

    const bodyStr = this.hasBody && this.body.trim() ? this.body.trim() : undefined;
    if (bodyStr && !headers['Content-Type']) headers['Content-Type'] = 'application/json';

    const t0 = performance.now();

    try {
      const res = await fetch(this.url.trim(), { method: this.method, headers, body: bodyStr });

      const time = Math.round(performance.now() - t0);
      const raw = await res.text();
      const size = new TextEncoder().encode(raw).length;

      let body = raw;
      let isJson = false;
      try { body = JSON.stringify(JSON.parse(raw), null, 2); isJson = true; } catch {}

      const responseHeaders: { key: string; value: string }[] = [];
      res.headers.forEach((v, k) => responseHeaders.push({ key: k, value: v }));

      this.response.set({ status: res.status, statusText: res.statusText, time, size, responseHeaders, body, isJson, isError: false });
      this.resTab = 0;
    } catch (err: any) {
      this.response.set({
        status: 0, statusText: 'Erro de Rede',
        time: Math.round(performance.now() - t0),
        size: 0, responseHeaders: [],
        body: err?.message ?? 'Falha na requisição. Verifique a URL e as permissões CORS.',
        isJson: false, isError: true,
      });
    } finally {
      this.loading.set(false);
    }
  }

  statusClass(s: number): string {
    if (s >= 200 && s < 300) return 's-ok';
    if (s >= 300 && s < 400) return 's-3xx';
    if (s >= 400 && s < 500) return 's-4xx';
    if (s >= 500) return 's-5xx';
    return 's-err';
  }

  fmtSize(b: number): string {
    if (b < 1024) return `${b} B`;
    if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1048576).toFixed(1)} MB`;
  }

  private esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  renderBody(): string {
    const r = this.response();
    if (!r) return '';
    const escaped = this.esc(r.body);
    if (!r.isJson) return escaped;
    return escaped.replace(
      /("(?:\\u[0-9a-fA-F]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (m) => {
        if (/^"/.test(m)) return `<span class="${/:$/.test(m) ? 'j-key' : 'j-str'}">${m}</span>`;
        if (m === 'true' || m === 'false') return `<span class="j-bool">${m}</span>`;
        if (m === 'null') return `<span class="j-null">${m}</span>`;
        return `<span class="j-num">${m}</span>`;
      }
    );
  }
}
