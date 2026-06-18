import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfigurationParamsService } from '../../core/services/configuration-params.service';

const KNOWN_FONTES = [
  'APPINSIGHTS', 'AZURE', 'BARRAMENTO', 'CEP', 'CONVERA',
  'DS160', 'EMAIL', 'ESCAVADOR', 'GRAFANA', 'GROKIA',
  'OPENAI', 'RECEITAWS', 'ROUTINGNUMBER', 'SOA', 'STARMONEY', 'ZENVIA'
];

const FONTE_ICONS: Record<string, string> = {
  AZURE: 'cloud', GROKIA: 'auto_awesome', OPENAI: 'smart_toy',
  EMAIL: 'email', ZENVIA: 'sms', ESCAVADOR: 'gavel',
  CONVERA: 'currency_exchange', SOA: 'account_balance',
  BARRAMENTO: 'hub', STARMONEY: 'star', RECEITAWS: 'receipt',
  ROUTINGNUMBER: 'route', CEP: 'location_on',
  GRAFANA: 'monitoring', APPINSIGHTS: 'analytics', DS160: 'flight'
};

@Component({
  selector: 'app-configuration-params-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule,
    MatProgressSpinnerModule, MatTooltipModule, MatAutocompleteModule
  ],
  template: `
    <div class="dialog-container">
      <!-- Header -->
      <div class="dialog-header">
        <div class="dialog-title-group">
          <div class="title-icon">
            <mat-icon>{{ isEdit ? 'edit' : 'add_circle' }}</mat-icon>
          </div>
          <div>
            <h2>{{ isEdit ? 'Editar Parâmetro' : 'Novo Parâmetro' }}</h2>
            <p>{{ isEdit ? 'Atualize os dados do parâmetro' : 'Adicione um novo parâmetro de configuração' }}</p>
          </div>
        </div>
        <button mat-icon-button (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Body -->
      <form [formGroup]="form" (ngSubmit)="save()" class="dialog-body">

        <!-- Tipo detectado (badge) -->
        <div class="tipo-badge" [class.url-type]="tipoDetectado()" [class.cred-type]="!tipoDetectado()">
          <mat-icon>{{ tipoDetectado() ? 'link' : 'key' }}</mat-icon>
          Tipo: <strong>{{ tipoDetectado() ? 'Endpoint / URL' : 'Credencial / Chave' }}</strong>
        </div>

        <!-- Row 1: Fonte + Parâmetro -->
        <div class="form-row two-cols">
          <mat-form-field appearance="outline">
            <mat-label>Fonte</mat-label>
            <mat-icon matPrefix>folder</mat-icon>
            <input matInput formControlName="fonte" [matAutocomplete]="autoFonte"
                   (input)="filterFontes($event)" placeholder="Ex: AZURE">
            <mat-autocomplete #autoFonte="matAutocomplete">
              @for (f of filteredFontes(); track f) {
                <mat-option [value]="f">
                  <mat-icon style="font-size:16px;width:16px;height:16px;vertical-align:middle;margin-right:8px">
                    {{ getFonteIcon(f) }}
                  </mat-icon>{{ f }}
                </mat-option>
              }
            </mat-autocomplete>
            @if (form.get('fonte')?.invalid && form.get('fonte')?.touched) {
              <mat-error>Fonte é obrigatória</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Parâmetro</mat-label>
            <mat-icon matPrefix>tune</mat-icon>
            <input matInput formControlName="parametro" placeholder="Ex: AZURE_DOCUMENT_KEY">
            @if (form.get('parametro')?.invalid && form.get('parametro')?.touched) {
              <mat-error>Parâmetro é obrigatório</mat-error>
            }
          </mat-form-field>
        </div>

        <!-- Row 2: Descrição -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Descrição</mat-label>
          <mat-icon matPrefix>description</mat-icon>
          <input matInput formControlName="descricao" placeholder="Ex: Chave de acesso ao Azure Document Intelligence">
        </mat-form-field>

        <!-- Row 3: Valor -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Valor</mat-label>
          <mat-icon matPrefix>{{ tipoDetectado() ? 'link' : 'vpn_key' }}</mat-icon>
          <textarea matInput formControlName="valor" rows="3"
                    placeholder="Cole a chave, token ou URL aqui..."></textarea>
          @if (form.get('valor')?.invalid && form.get('valor')?.touched) {
            <mat-error>Valor é obrigatório</mat-error>
          }
          <mat-hint align="end">
            {{ tipoDetectado() ? 'URL detectada — será exibida como link' : 'Credencial — valor será mascarado' }}
          </mat-hint>
        </mat-form-field>

        <!-- Row 4: Status -->
        <div class="status-row">
          <button type="button" class="status-toggle" [class.on]="form.get('ativo')?.value"
                  (click)="toggleAtivo()">
            <mat-icon>{{ form.get('ativo')?.value ? 'toggle_on' : 'toggle_off' }}</mat-icon>
            <span>{{ form.get('ativo')?.value ? 'Parâmetro Ativo' : 'Parâmetro Inativo' }}</span>
          </button>
        </div>

      </form>

      <!-- Footer -->
      <div class="dialog-footer">
        <button mat-stroked-button type="button" (click)="close()" [disabled]="saving()">
          Cancelar
        </button>
        <button mat-flat-button color="primary" (click)="save()"
                [disabled]="form.invalid || saving()">
          @if (saving()) {
            <mat-spinner diameter="18" style="display:inline-block;margin-right:8px"></mat-spinner>
          } @else {
            <mat-icon>{{ isEdit ? 'save' : 'add' }}</mat-icon>
          }
          {{ isEdit ? 'Salvar' : 'Criar Parâmetro' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      display: flex;
      flex-direction: column;
      min-width: 480px;
      max-width: 100%;
      background: var(--surface);
      color: var(--text);
    }

    .dialog-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 24px 24px 20px;
      border-bottom: 1px solid var(--border);
    }

    .dialog-title-group {
      display: flex;
      align-items: center;
      gap: 14px;

      h2 { margin: 0; font-size: 18px; font-weight: 700; color: var(--text); }
      p { margin: 4px 0 0; font-size: 13px; color: var(--text-sec); }
    }

    .title-icon {
      width: 44px; height: 44px; border-radius: 10px;
      background: var(--active-color);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      mat-icon { color: #fff; }
    }

    .dialog-body {
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .tipo-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      padding: 8px 14px;
      border-radius: 8px;
      margin-bottom: 12px;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &.cred-type { background: rgba(245,158,11,.12); color: #d97706; border: 1px solid rgba(245,158,11,.25); }
      &.url-type { background: rgba(59,130,246,.12); color: #2563eb; border: 1px solid rgba(59,130,246,.25); }
    }

    .form-row { display: flex; gap: 12px; }
    .two-cols > * { flex: 1; min-width: 0; }
    .full-width { width: 100%; }

    .status-row { margin-top: 4px; }

    .status-toggle {
      display: inline-flex; align-items: center; gap: 8px;
      background: none; border: 1px solid var(--border); border-radius: 8px;
      padding: 8px 14px; cursor: pointer; color: var(--text-sec); font-size: 13px;
      transition: all 0.18s;
      mat-icon { font-size: 22px; width: 22px; height: 22px; }
      &.on { background: rgba(16,185,129,.1); border-color: rgba(16,185,129,.4); color: #059669; mat-icon { color: #059669; } }
    }

    .dialog-footer {
      display: flex; justify-content: flex-end; gap: 10px;
      padding: 16px 24px 20px; border-top: 1px solid var(--border);
      button { min-width: 120px; }
    }

    @media (max-width: 560px) {
      .dialog-container { min-width: unset; }
      .form-row.two-cols { flex-direction: column; }
    }
  `]
})
export class ConfigurationParamsFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(ConfigurationParamsService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<ConfigurationParamsFormComponent>);
  private data = inject(MAT_DIALOG_DATA);

  saving = signal(false);
  filteredFontes = signal<string[]>(KNOWN_FONTES);
  isEdit = false;

  form = this.fb.group({
    id: [0],
    fonte: ['', Validators.required],
    parametro: ['', Validators.required],
    descricao: [''],
    valor: ['', Validators.required],
    ativo: [true]
  });

  tipoDetectado(): boolean {
    const v = this.form.get('valor')?.value ?? '';
    return v.startsWith('http://') || v.startsWith('https://');
  }

  ngOnInit() {
    if (this.data) {
      this.isEdit = !!this.data.id;
      this.form.patchValue({
        id: this.data.id ?? 0,
        fonte: this.data.fonte ?? '',
        parametro: this.data.parametro ?? '',
        descricao: this.data.descricao ?? '',
        valor: this.data.valor ?? '',
        ativo: this.data.ativo ?? true
      });
    }
  }

  filterFontes(event: Event) {
    const q = (event.target as HTMLInputElement).value.toUpperCase();
    this.filteredFontes.set(q ? KNOWN_FONTES.filter(f => f.includes(q)) : KNOWN_FONTES);
  }

  getFonteIcon(fonte: string): string {
    return FONTE_ICONS[fonte] ?? 'settings';
  }

  toggleAtivo() {
    const cur = this.form.get('ativo')?.value;
    this.form.patchValue({ ativo: !cur });
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);

    const v = this.form.value;
    const payload = {
      id: v.id ?? 0,
      fonte: (v.fonte ?? '').toUpperCase().trim(),
      parametro: (v.parametro ?? '').toUpperCase().trim(),
      descricao: v.descricao ?? '',
      valor: v.valor ?? '',
      ativo: v.ativo ?? true,
      dataCriacao: new Date().toISOString()
    };

    const req$ = this.isEdit
      ? this.service.update(payload as any)
      : this.service.create(payload as any);

    req$.subscribe({
      next: () => {
        this.snackBar.open(this.isEdit ? 'Parâmetro atualizado!' : 'Parâmetro criado!', 'OK', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.snackBar.open(err?.error?.error ?? 'Erro ao salvar', 'OK', { duration: 5000 });
        this.saving.set(false);
      }
    });
  }

  close() { this.dialogRef.close(false); }
}
