import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Param {
  key: string;
  value: string;
  description: string;
}

interface Endpoint {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  description: string;
  headers?: Param[];
  queryParams?: Param[];
  bodyLang?: string;
  body?: string;
  response?: string;
  responseStatus?: number;
}

interface Group {
  id: string;
  name: string;
  expanded: boolean;
  endpoints: Endpoint[];
}

@Component({
  selector: 'app-documento',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="docs-root">

      <!-- ── Sidebar ───────────────────────────────────────────────────── -->
      <aside class="docs-sidebar">
        <div class="sidebar-brand">
          <div class="brand-dot"></div>
          <span class="brand-name">Intex API</span>
          <span class="brand-version">v1.0</span>
        </div>
        <nav class="sidebar-nav">
          @for (group of groups; track group.id) {
            <div class="nav-group">
              <button class="nav-group-header" (click)="group.expanded = !group.expanded">
                <span>{{ group.name }}</span>
                <svg class="chevron" [class.rotated]="!group.expanded"
                     viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              @if (group.expanded) {
                @for (ep of group.endpoints; track ep.id) {
                  <button class="nav-endpoint" [class.active]="activeId === ep.id"
                          (click)="scrollTo(ep.id)">
                    <span class="nav-badge"
                          [style.color]="methodColor(ep.method)"
                          [style.background]="methodBg(ep.method)">{{ ep.method }}</span>
                    <span class="nav-ep-name">{{ ep.name }}</span>
                  </button>
                }
              }
            </div>
          }
        </nav>
      </aside>

      <!-- ── Content ───────────────────────────────────────────────────── -->
      <main class="docs-content">

        @for (group of groups; track group.id) {
          <div class="group-block">
            <h2 class="group-title">{{ group.name }}</h2>

            @for (ep of group.endpoints; track ep.id) {
              <section [id]="ep.id" class="endpoint-block">

                <!-- left -->
                <div class="ep-left">
                  <div class="ep-header">
                    <span class="method-badge"
                          [style.color]="methodColor(ep.method)"
                          [style.background]="methodBg(ep.method)">{{ ep.method }}</span>
                    <code class="ep-url">{{ ep.url }}</code>
                  </div>
                  <h3 class="ep-name">{{ ep.name }}</h3>
                  <p class="ep-desc">{{ ep.description }}</p>

                  @if (ep.headers && ep.headers.length) {
                    <div class="ep-section">
                      <h4 class="ep-section-title">Headers</h4>
                      <table class="params-table">
                        <thead><tr><th>Key</th><th>Value</th><th>Description</th></tr></thead>
                        <tbody>
                          @for (h of ep.headers; track h.key) {
                            <tr>
                              <td class="key-cell">{{ h.key }}</td>
                              <td><code class="val-code">{{ h.value }}</code></td>
                              <td class="desc-cell">{{ h.description }}</td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  }

                  @if (ep.queryParams && ep.queryParams.length) {
                    <div class="ep-section">
                      <h4 class="ep-section-title">Query Params</h4>
                      <table class="params-table">
                        <thead><tr><th>Key</th><th>Value</th><th>Description</th></tr></thead>
                        <tbody>
                          @for (p of ep.queryParams; track p.key) {
                            <tr>
                              <td class="key-cell">{{ p.key }}</td>
                              <td><code class="val-code">{{ p.value }}</code></td>
                              <td class="desc-cell">{{ p.description }}</td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  }

                  @if (ep.body) {
                    <div class="ep-section">
                      <h4 class="ep-section-title">
                        Body
                        <span class="lang-tag">{{ ep.bodyLang || 'json' }}</span>
                      </h4>
                      <pre class="code-left">{{ ep.body }}</pre>
                    </div>
                  }
                </div>

                <!-- right -->
                <div class="ep-right">
                  @if (ep.response) {
                    <div class="response-block">
                      <div class="response-header">
                        <span class="status-badge ok">
                          {{ ep.responseStatus || 200 }}
                          {{ statusLabel(ep.responseStatus || 200) }}
                        </span>
                        <span class="response-label">Example Response</span>
                      </div>
                      <pre class="code-right">{{ ep.response }}</pre>
                    </div>
                  }
                </div>

              </section>
            }
          </div>
        }

      </main>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      margin: -20px;
      width: calc(100% + 40px);
    }

    /* ── Root ────────────────────────────────────── */
    .docs-root {
      display: flex;
      height: calc(100vh - 52px);
      background: #1a1c23;
      color: #d1d5db;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 13px;
      overflow: hidden;
    }

    /* ── Sidebar ─────────────────────────────────── */
    .docs-sidebar {
      width: 236px;
      min-width: 236px;
      background: #12141a;
      border-right: 1px solid #252731;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px 18px;
      border-bottom: 1px solid #252731;
    }

    .brand-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #49cc90;
      flex-shrink: 0;
    }

    .brand-name {
      font-size: 14px;
      font-weight: 700;
      color: #e8eaf6;
    }

    .brand-version {
      font-size: 10px;
      color: #4b5563;
      background: #1e2029;
      padding: 1px 6px;
      border-radius: 10px;
      margin-left: auto;
    }

    .sidebar-nav {
      flex: 1;
      overflow-y: auto;
      padding: 6px 0 16px;
    }

    .sidebar-nav::-webkit-scrollbar { width: 4px; }
    .sidebar-nav::-webkit-scrollbar-track { background: transparent; }
    .sidebar-nav::-webkit-scrollbar-thumb { background: #252731; border-radius: 4px; }

    .nav-group-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 7px 18px;
      background: none;
      border: none;
      color: #6b7280;
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.9px;
      text-transform: uppercase;
      cursor: pointer;
      text-align: left;
      transition: color 0.15s;
    }

    .nav-group-header:hover { color: #e8eaf6; }

    .chevron { width: 12px; height: 12px; flex-shrink: 0; transition: transform 0.2s; }
    .chevron.rotated { transform: rotate(-90deg); }

    .nav-endpoint {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 5px 18px 5px 22px;
      background: none;
      border: none;
      border-left: 2px solid transparent;
      color: #9ca3af;
      font-size: 12px;
      cursor: pointer;
      text-align: left;
      transition: color 0.15s, background 0.15s, border-color 0.15s;
    }

    .nav-endpoint:hover {
      color: #e8eaf6;
      background: rgba(255,255,255,0.03);
    }

    .nav-endpoint.active {
      color: #e8eaf6;
      background: rgba(255,255,255,0.04);
      border-left-color: #6366f1;
    }

    .nav-badge {
      font-size: 9px;
      font-weight: 800;
      padding: 2px 5px;
      border-radius: 3px;
      flex-shrink: 0;
      min-width: 42px;
      text-align: center;
      letter-spacing: 0.3px;
    }

    .nav-ep-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* ── Main content ────────────────────────────── */
    .docs-content {
      flex: 1;
      overflow-y: auto;
    }

    .docs-content::-webkit-scrollbar { width: 5px; }
    .docs-content::-webkit-scrollbar-track { background: transparent; }
    .docs-content::-webkit-scrollbar-thumb { background: #252731; border-radius: 4px; }

    .group-block {
      border-bottom: 1px solid #252731;
    }

    .group-title {
      margin: 0;
      padding: 18px 32px 14px;
      font-size: 17px;
      font-weight: 700;
      color: #e8eaf6;
      background: #14161d;
      border-bottom: 1px solid #252731;
      letter-spacing: 0.2px;
    }

    /* ── Endpoint block ──────────────────────────── */
    .endpoint-block {
      display: flex;
      border-bottom: 1px solid #1e2029;
    }

    .ep-left {
      flex: 1;
      padding: 26px 32px;
      border-right: 1px solid #1e2029;
      min-width: 0;
    }

    .ep-right {
      width: 370px;
      min-width: 370px;
      padding: 26px 22px;
      background: #12141a;
    }

    .ep-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }

    .method-badge {
      font-size: 11px;
      font-weight: 800;
      padding: 3px 9px;
      border-radius: 4px;
      flex-shrink: 0;
      letter-spacing: 0.4px;
    }

    .ep-url {
      font-family: 'Fira Code', 'Courier New', monospace;
      font-size: 13px;
      color: #c4c9d8;
      word-break: break-all;
      background: transparent;
    }

    .ep-name {
      margin: 0 0 8px;
      font-size: 15px;
      font-weight: 600;
      color: #e8eaf6;
    }

    .ep-desc {
      margin: 0 0 22px;
      color: #9ca3af;
      line-height: 1.65;
      font-size: 13px;
    }

    /* ── Params ──────────────────────────────────── */
    .ep-section {
      margin-bottom: 22px;
    }

    .ep-section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 10px;
      font-size: 11px;
      font-weight: 700;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }

    .lang-tag {
      font-size: 10px;
      font-weight: 500;
      padding: 1px 6px;
      border-radius: 4px;
      background: #252731;
      color: #6b7280;
      text-transform: lowercase;
      letter-spacing: 0;
    }

    .params-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      border: 1px solid #252731;
      border-radius: 6px;
      overflow: hidden;
    }

    .params-table th {
      text-align: left;
      padding: 7px 12px;
      background: #1a1c23;
      color: #6b7280;
      font-weight: 700;
      font-size: 10.5px;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      border-bottom: 1px solid #252731;
    }

    .params-table td {
      padding: 8px 12px;
      border-bottom: 1px solid #1e2029;
      color: #d1d5db;
      vertical-align: top;
    }

    .params-table tr:last-child td { border-bottom: none; }

    .key-cell {
      font-family: 'Fira Code', monospace;
      color: #a5b4fc;
      white-space: nowrap;
    }

    .val-code {
      font-family: 'Fira Code', monospace;
      font-size: 11px;
      color: #fbbf24;
      background: #1e2029;
      padding: 1px 6px;
      border-radius: 3px;
    }

    .desc-cell { color: #9ca3af; }

    .code-left {
      background: #1e2029;
      border: 1px solid #252731;
      border-radius: 6px;
      padding: 14px 16px;
      margin: 0;
      font-family: 'Fira Code', 'Courier New', monospace;
      font-size: 12px;
      color: #e2e8f0;
      line-height: 1.65;
      overflow-x: auto;
      white-space: pre;
    }

    /* ── Right: response ─────────────────────────── */
    .response-block { }

    .response-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }

    .status-badge {
      font-size: 11px;
      font-weight: 700;
      padding: 3px 9px;
      border-radius: 4px;
    }

    .status-badge.ok {
      color: #4ade80;
      background: rgba(74,222,128,0.12);
    }

    .response-label {
      font-size: 10.5px;
      color: #4b5563;
      text-transform: uppercase;
      letter-spacing: 0.7px;
      font-weight: 600;
    }

    .code-right {
      background: #0d0f14;
      border: 1px solid #1a1c23;
      border-radius: 6px;
      padding: 14px 16px;
      margin: 0;
      font-family: 'Fira Code', 'Courier New', monospace;
      font-size: 11.5px;
      color: #86efac;
      line-height: 1.65;
      overflow-x: auto;
      white-space: pre;
      max-height: 320px;
      overflow-y: auto;
    }

    .code-right::-webkit-scrollbar { width: 4px; height: 4px; }
    .code-right::-webkit-scrollbar-track { background: transparent; }
    .code-right::-webkit-scrollbar-thumb { background: #252731; border-radius: 4px; }
  `]
})
export class DocumentoComponent {
  activeId: string | null = null;

  methodColor(m: string): string {
    return ({ GET: '#61AFFE', POST: '#49CC90', PUT: '#FCA130', DELETE: '#F93E3E', PATCH: '#50E3C2' } as Record<string,string>)[m] ?? '#999';
  }

  methodBg(m: string): string {
    return ({ GET: 'rgba(97,175,254,0.13)', POST: 'rgba(73,204,144,0.13)', PUT: 'rgba(252,161,48,0.13)', DELETE: 'rgba(249,62,62,0.13)', PATCH: 'rgba(80,227,194,0.13)' } as Record<string,string>)[m] ?? '#2a2d38';
  }

  statusLabel(code: number): string {
    return ({ 200: 'OK', 201: 'Created', 204: 'No Content', 400: 'Bad Request', 401: 'Unauthorized', 404: 'Not Found', 500: 'Server Error' } as Record<number,string>)[code] ?? 'OK';
  }

  scrollTo(id: string) {
    this.activeId = id;
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  groups: Group[] = [
    {
      id: 'auth', name: 'Autenticação', expanded: true,
      endpoints: [
        {
          id: 'auth-login', name: 'Login', method: 'POST',
          url: 'https://api.intex.com.br/auth/login',
          description: 'Autentica um usuário e retorna o token de acesso JWT junto com o refresh token.',
          headers: [{ key: 'Content-Type', value: 'application/json', description: 'Tipo do conteúdo da requisição' }],
          bodyLang: 'json',
          body: `{
  "username": "usuario@empresa.com",
  "password": "senha123"
}`,
          responseStatus: 200,
          response: `{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVC...",
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
  "expiresIn": 3600,
  "user": {
    "id": 1,
    "name": "Wesley Bezerra",
    "email": "usuario@empresa.com",
    "role": "admin"
  }
}`
        },
        {
          id: 'auth-refresh', name: 'Refresh Token', method: 'POST',
          url: 'https://api.intex.com.br/auth/refresh',
          description: 'Renova o token de acesso usando o refresh token antes do vencimento.',
          headers: [{ key: 'Authorization', value: 'Bearer {{refreshToken}}', description: 'Refresh token obtido no login' }],
          responseStatus: 200,
          response: `{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVC...",
  "expiresIn": 3600
}`
        }
      ]
    },
    {
      id: 'cotacao', name: 'Cotação', expanded: true,
      endpoints: [
        {
          id: 'cotacao-list', name: 'Listar Cotações', method: 'GET',
          url: 'https://api.intex.com.br/cotacao',
          description: 'Retorna as cotações atuais de todas as moedas disponíveis para operação.',
          headers: [{ key: 'Authorization', value: 'Bearer {{token}}', description: 'Token JWT de autenticação' }],
          queryParams: [
            { key: 'data', value: '2024-01-15', description: 'Data de referência (YYYY-MM-DD). Padrão: hoje' },
            { key: 'moedas', value: 'USD,EUR,GBP', description: 'Filtrar por moedas específicas (separado por vírgula)' }
          ],
          responseStatus: 200,
          response: `{
  "data": "2024-01-15",
  "cotacoes": [
    {
      "moeda": "USD",
      "nome": "Dólar Americano",
      "compra": 4.9850,
      "venda": 5.0120,
      "variacao": 0.35
    },
    {
      "moeda": "EUR",
      "nome": "Euro",
      "compra": 5.3820,
      "venda": 5.4110,
      "variacao": -0.12
    },
    {
      "moeda": "GBP",
      "nome": "Libra Esterlina",
      "compra": 6.2140,
      "venda": 6.2530,
      "variacao": 0.08
    }
  ]
}`
        },
        {
          id: 'cotacao-moeda', name: 'Histórico por Moeda', method: 'GET',
          url: 'https://api.intex.com.br/cotacao/:moeda',
          description: 'Retorna o histórico de cotação de uma moeda específica em um intervalo de datas.',
          headers: [{ key: 'Authorization', value: 'Bearer {{token}}', description: 'Token JWT de autenticação' }],
          queryParams: [
            { key: 'dataInicio', value: '2024-01-01', description: 'Data de início do período (YYYY-MM-DD)' },
            { key: 'dataFim', value: '2024-01-31', description: 'Data de fim do período (YYYY-MM-DD)' },
            { key: 'page', value: '1', description: 'Página dos resultados' },
            { key: 'pageSize', value: '30', description: 'Quantidade de registros por página' }
          ],
          responseStatus: 200,
          response: `{
  "moeda": "USD",
  "nome": "Dólar Americano",
  "total": 22,
  "page": 1,
  "pageSize": 30,
  "historico": [
    { "data": "2024-01-15", "compra": 4.9850, "venda": 5.0120 },
    { "data": "2024-01-14", "compra": 4.9680, "venda": 4.9950 },
    { "data": "2024-01-13", "compra": 4.9420, "venda": 4.9690 }
  ]
}`
        }
      ]
    },
    {
      id: 'clientes', name: 'Clientes', expanded: true,
      endpoints: [
        {
          id: 'clientes-list', name: 'Listar Clientes', method: 'GET',
          url: 'https://api.intex.com.br/clientes',
          description: 'Retorna a lista paginada de clientes cadastrados com filtros opcionais.',
          headers: [{ key: 'Authorization', value: 'Bearer {{token}}', description: 'Token JWT de autenticação' }],
          queryParams: [
            { key: 'page', value: '1', description: 'Página dos resultados' },
            { key: 'pageSize', value: '20', description: 'Registros por página (máx. 100)' },
            { key: 'search', value: 'EMPRESA', description: 'Busca por nome ou CNPJ/CPF' },
            { key: 'status', value: 'ativo', description: 'Filtro por status: ativo, inativo' }
          ],
          responseStatus: 200,
          response: `{
  "total": 148,
  "page": 1,
  "pageSize": 20,
  "clientes": [
    {
      "id": 1,
      "nome": "EMPRESA EXEMPLO LTDA",
      "documento": "12.345.678/0001-99",
      "tipo": "PJ",
      "email": "financeiro@empresa.com",
      "status": "ativo",
      "dataCadastro": "2023-06-10"
    }
  ]
}`
        },
        {
          id: 'clientes-get', name: 'Buscar Cliente', method: 'GET',
          url: 'https://api.intex.com.br/clientes/:id',
          description: 'Retorna todos os dados de um cliente específico pelo ID.',
          headers: [{ key: 'Authorization', value: 'Bearer {{token}}', description: 'Token JWT de autenticação' }],
          responseStatus: 200,
          response: `{
  "id": 1,
  "nome": "EMPRESA EXEMPLO LTDA",
  "documento": "12.345.678/0001-99",
  "tipo": "PJ",
  "email": "financeiro@empresa.com",
  "telefone": "+55 11 99999-9999",
  "status": "ativo",
  "dataCadastro": "2023-06-10",
  "endereco": {
    "logradouro": "Av. Paulista, 1000",
    "cidade": "São Paulo",
    "estado": "SP",
    "cep": "01310-100"
  },
  "totalOperacoes": 12,
  "volumeTotal": 520000.00
}`
        },
        {
          id: 'clientes-create', name: 'Cadastrar Cliente', method: 'POST',
          url: 'https://api.intex.com.br/clientes',
          description: 'Cria um novo cadastro de cliente Pessoa Física ou Jurídica.',
          headers: [
            { key: 'Authorization', value: 'Bearer {{token}}', description: 'Token JWT de autenticação' },
            { key: 'Content-Type', value: 'application/json', description: 'Tipo do conteúdo' }
          ],
          bodyLang: 'json',
          body: `{
  "nome": "EMPRESA EXEMPLO LTDA",
  "documento": "12.345.678/0001-99",
  "tipo": "PJ",
  "email": "financeiro@empresa.com",
  "telefone": "+55 11 99999-9999",
  "endereco": {
    "logradouro": "Av. Paulista, 1000",
    "cidade": "São Paulo",
    "estado": "SP",
    "cep": "01310-100"
  }
}`,
          responseStatus: 201,
          response: `{
  "id": 149,
  "nome": "EMPRESA EXEMPLO LTDA",
  "documento": "12.345.678/0001-99",
  "tipo": "PJ",
  "email": "financeiro@empresa.com",
  "status": "ativo",
  "dataCadastro": "2024-01-15"
}`
        },
        {
          id: 'clientes-update', name: 'Atualizar Cliente', method: 'PUT',
          url: 'https://api.intex.com.br/clientes/:id',
          description: 'Atualiza os dados cadastrais de um cliente existente.',
          headers: [
            { key: 'Authorization', value: 'Bearer {{token}}', description: 'Token JWT de autenticação' },
            { key: 'Content-Type', value: 'application/json', description: 'Tipo do conteúdo' }
          ],
          bodyLang: 'json',
          body: `{
  "email": "novo.email@empresa.com",
  "telefone": "+55 11 88888-8888",
  "status": "ativo"
}`,
          responseStatus: 200,
          response: `{
  "id": 1,
  "nome": "EMPRESA EXEMPLO LTDA",
  "email": "novo.email@empresa.com",
  "telefone": "+55 11 88888-8888",
  "status": "ativo"
}`
        }
      ]
    },
    {
      id: 'operacoes', name: 'Operações de Câmbio', expanded: true,
      endpoints: [
        {
          id: 'op-list', name: 'Listar Operações', method: 'GET',
          url: 'https://api.intex.com.br/operacoes',
          description: 'Retorna a lista paginada de operações de câmbio com filtros por período, cliente e status.',
          headers: [{ key: 'Authorization', value: 'Bearer {{token}}', description: 'Token JWT de autenticação' }],
          queryParams: [
            { key: 'dataInicio', value: '2024-01-01', description: 'Data inicial do filtro (YYYY-MM-DD)' },
            { key: 'dataFim', value: '2024-01-31', description: 'Data final do filtro (YYYY-MM-DD)' },
            { key: 'clienteId', value: '1', description: 'Filtrar por ID do cliente' },
            { key: 'status', value: 'aprovada', description: 'Status: pendente, aprovada, cancelada, liquidada' },
            { key: 'moeda', value: 'USD', description: 'Filtrar por moeda (sigla)' }
          ],
          responseStatus: 200,
          response: `{
  "total": 87,
  "page": 1,
  "pageSize": 20,
  "operacoes": [
    {
      "id": "OP-2024-0087",
      "clienteId": 1,
      "clienteNome": "EMPRESA EXEMPLO LTDA",
      "tipo": "compra",
      "moeda": "USD",
      "valor": 10000.00,
      "taxa": 5.0120,
      "valorBRL": 50120.00,
      "status": "aprovada",
      "dataOperacao": "2024-01-15T14:32:00Z"
    }
  ]
}`
        },
        {
          id: 'op-create', name: 'Criar Operação', method: 'POST',
          url: 'https://api.intex.com.br/operacoes',
          description: 'Registra uma nova operação de câmbio vinculada a um cliente.',
          headers: [
            { key: 'Authorization', value: 'Bearer {{token}}', description: 'Token JWT de autenticação' },
            { key: 'Content-Type', value: 'application/json', description: 'Tipo do conteúdo' }
          ],
          bodyLang: 'json',
          body: `{
  "clienteId": 1,
  "tipo": "compra",
  "moeda": "USD",
  "valor": 10000.00,
  "natureza": "importacao",
  "observacao": "Pagamento de mercadorias - NF 1234"
}`,
          responseStatus: 201,
          response: `{
  "id": "OP-2024-0088",
  "clienteId": 1,
  "tipo": "compra",
  "moeda": "USD",
  "valor": 10000.00,
  "taxa": 5.0120,
  "valorBRL": 50120.00,
  "status": "pendente",
  "dataOperacao": "2024-01-15T15:45:00Z",
  "prazoLiquidacao": "2024-01-17"
}`
        },
        {
          id: 'op-get', name: 'Buscar Operação', method: 'GET',
          url: 'https://api.intex.com.br/operacoes/:id',
          description: 'Retorna todos os detalhes de uma operação específica pelo ID.',
          headers: [{ key: 'Authorization', value: 'Bearer {{token}}', description: 'Token JWT de autenticação' }],
          responseStatus: 200,
          response: `{
  "id": "OP-2024-0087",
  "clienteId": 1,
  "clienteNome": "EMPRESA EXEMPLO LTDA",
  "tipo": "compra",
  "moeda": "USD",
  "valor": 10000.00,
  "taxa": 5.0120,
  "valorBRL": 50120.00,
  "status": "liquidada",
  "natureza": "importacao",
  "observacao": "Pagamento de mercadorias - NF 1234",
  "dataOperacao": "2024-01-15T14:32:00Z",
  "dataLiquidacao": "2024-01-17T10:00:00Z",
  "documentos": ["DOC-2024-0145", "DOC-2024-0146"]
}`
        },
        {
          id: 'op-cancel', name: 'Cancelar Operação', method: 'DELETE',
          url: 'https://api.intex.com.br/operacoes/:id',
          description: 'Cancela uma operação com status pendente. Operações já aprovadas ou liquidadas não podem ser canceladas.',
          headers: [{ key: 'Authorization', value: 'Bearer {{token}}', description: 'Token JWT de autenticação' }],
          responseStatus: 200,
          response: `{
  "id": "OP-2024-0088",
  "status": "cancelada",
  "motivoCancelamento": "Solicitado pelo cliente",
  "dataCancelamento": "2024-01-15T16:30:00Z"
}`
        }
      ]
    },
    {
      id: 'documentos', name: 'Documentos', expanded: true,
      endpoints: [
        {
          id: 'doc-upload', name: 'Upload de Documento', method: 'POST',
          url: 'https://api.intex.com.br/documentos/upload',
          description: 'Realiza o upload de um documento (PDF, PNG, JPG) vinculado a uma operação ou cliente.',
          headers: [
            { key: 'Authorization', value: 'Bearer {{token}}', description: 'Token JWT de autenticação' },
            { key: 'Content-Type', value: 'multipart/form-data', description: 'Necessário para envio de arquivo' }
          ],
          bodyLang: 'form-data',
          body: `arquivo:    [binary file]
tipo:       contrato
operacaoId: OP-2024-0088
clienteId:  1`,
          responseStatus: 201,
          response: `{
  "id": "DOC-2024-0145",
  "nome": "contrato_op_0088.pdf",
  "tipo": "contrato",
  "tamanho": 245760,
  "mimeType": "application/pdf",
  "operacaoId": "OP-2024-0088",
  "url": "https://storage.intex.com.br/docs/DOC-2024-0145.pdf",
  "dataUpload": "2024-01-15T16:00:00Z"
}`
        },
        {
          id: 'doc-get', name: 'Buscar Documento', method: 'GET',
          url: 'https://api.intex.com.br/documentos/:id',
          description: 'Retorna os metadados e a URL de acesso temporária de um documento.',
          headers: [{ key: 'Authorization', value: 'Bearer {{token}}', description: 'Token JWT de autenticação' }],
          responseStatus: 200,
          response: `{
  "id": "DOC-2024-0145",
  "nome": "contrato_op_0088.pdf",
  "tipo": "contrato",
  "tamanho": 245760,
  "mimeType": "application/pdf",
  "operacaoId": "OP-2024-0088",
  "clienteId": 1,
  "url": "https://storage.intex.com.br/docs/DOC-2024-0145.pdf",
  "dataUpload": "2024-01-15T16:00:00Z",
  "expiracaoUrl": "2024-01-15T17:00:00Z"
}`
        },
        {
          id: 'doc-delete', name: 'Excluir Documento', method: 'DELETE',
          url: 'https://api.intex.com.br/documentos/:id',
          description: 'Remove permanentemente um documento do sistema. Esta ação não pode ser desfeita.',
          headers: [{ key: 'Authorization', value: 'Bearer {{token}}', description: 'Token JWT de autenticação' }],
          responseStatus: 204,
          response: `(sem corpo na resposta)`
        }
      ]
    }
  ];
}
