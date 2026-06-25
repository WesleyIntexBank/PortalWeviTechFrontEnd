import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import {
  CcmeService, CcmePayer, CcmeRecipient, CcmeCurrency,
  CcmePaymentOrder, CcmePosting, CcmeAccountBalance, CcmePaymentOrderLog
} from '../../core/services/ccme.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-ccme-envio',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatTableModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDividerModule,
  ],
  templateUrl: './ccme-envio.component.html',
})
export class CcmeEnvioComponent implements OnInit {
  private ccme = inject(CcmeService);
  private auth = inject(AuthService);
  private snack = inject(MatSnackBar);

  // ── Signals ─────────────────────────────────────────────────────────────
  loading = signal(false);
  orders = signal<CcmePaymentOrder[]>([]);
  payers = signal<CcmePayer[]>([]);
  recipients = signal<CcmeRecipient[]>([]);
  currencies = signal<CcmeCurrency[]>([]);
  postings = signal<CcmePosting[]>([]);
  balances = signal<CcmeAccountBalance[]>([]);
  selectedOrderLog = signal<CcmePaymentOrderLog[]>([]);
  selectedOrder = signal<CcmePaymentOrder | null>(null);
  editingPayer = signal<CcmePayer | null>(null);
  editingRecipient = signal<CcmeRecipient | null>(null);

  orderColumns = ['code', 'valueDate', 'value', 'currency', 'payer', 'recipient', 'status', 'actions'];
  payerColumns = ['socialName', 'cpfCnpj', 'city', 'situation', 'actions'];
  recipientColumns = ['socialName', 'country', 'bankSwift', 'bankAccount', 'actions'];
  postingColumns = ['date', 'type', 'value', 'currency', 'history', 'actions'];
  balanceColumns = ['currencyCode', 'totalCredits', 'totalDebits', 'balance'];
  logColumns = ['createdAt', 'user', 'action', 'status', 'notes'];

  // ── Forms ────────────────────────────────────────────────────────────────
  orderForm = new FormGroup({
    valueDate: new FormControl('', Validators.required),
    value: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    currencyCode: new FormControl('USD', Validators.required),
    charges: new FormControl('OUR', Validators.required),
    payerId: new FormControl<number | null>(null, Validators.required),
    recipientId: new FormControl<number | null>(null, Validators.required),
    invoice: new FormControl(''),
    reason: new FormControl(''),
    omitBrokerData: new FormControl(false),
  });

  payerForm = new FormGroup({
    socialName: new FormControl('', Validators.required),
    cpfCnpj: new FormControl('', Validators.required),
    address: new FormControl(''),
    city: new FormControl(''),
    state: new FormControl(''),
    situation: new FormControl('Active', Validators.required),
  });

  recipientForm = new FormGroup({
    socialName: new FormControl('', Validators.required),
    country: new FormControl('', Validators.required),
    bankName: new FormControl(''),
    bankSwift: new FormControl(''),
    bankAccount: new FormControl(''),
    bankIban: new FormControl(''),
    bankAba: new FormControl(''),
    bankSortCode: new FormControl(''),
    bankBranchCode: new FormControl(''),
    intermediateBank: new FormControl(''),
    intermediateSwift: new FormControl(''),
    intermediateAccount: new FormControl(''),
  });

  postingForm = new FormGroup({
    date: new FormControl('', Validators.required),
    value: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    type: new FormControl('Debit', Validators.required),
    history: new FormControl('', Validators.required),
    currencyCode: new FormControl('USD', Validators.required),
    reference: new FormControl(''),
  });

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading.set(true);
    this.ccme.getOrders().subscribe({ next: v => this.orders.set(v), error: () => {} });
    this.ccme.getPayers().subscribe({ next: v => this.payers.set(v), error: () => {} });
    this.ccme.getRecipients().subscribe({ next: v => this.recipients.set(v), error: () => {} });
    this.ccme.getCurrencies().subscribe({ next: v => this.currencies.set(v), error: () => {} });
    this.ccme.getPostings().subscribe({ next: v => this.postings.set(v), error: () => {} });
    this.ccme.getBalance().subscribe({ next: v => { this.balances.set(v); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  // ── Orders ───────────────────────────────────────────────────────────────
  submitOrder(): void {
    if (this.orderForm.invalid) return;
    const v = this.orderForm.value;
    const order: CcmePaymentOrder = {
      valueDate: v.valueDate!,
      value: v.value!,
      currencyCode: v.currencyCode!,
      charges: v.charges!,
      payerId: v.payerId!,
      recipientId: v.recipientId!,
      invoice: v.invoice ?? undefined,
      reason: v.reason ?? undefined,
      omitBrokerData: v.omitBrokerData ?? false,
      user: this.auth.currentUser()?.userName,
    };
    this.loading.set(true);
    this.ccme.createOrder(order).subscribe({
      next: () => { this.snack.open('Ordem criada e enviada para processamento!', 'OK', { duration: 3000 }); this.orderForm.reset({ currencyCode: 'USD', charges: 'OUR', omitBrokerData: false }); this.loadAll(); },
      error: err => { this.snack.open(err?.error ?? 'Erro ao criar ordem', 'OK', { duration: 4000 }); this.loading.set(false); }
    });
  }

  viewLog(order: CcmePaymentOrder): void {
    this.selectedOrder.set(order);
    this.ccme.getOrderLog(order.id!).subscribe({ next: v => this.selectedOrderLog.set(v), error: () => {} });
  }

  transition(order: CcmePaymentOrder, action: string): void {
    const payload = { user: this.auth.currentUser()?.userName, notes: null };
    let obs: any;
    if (action === 'confirm') obs = this.ccme.confirmOrder(order.id!, payload);
    else if (action === 'release') obs = this.ccme.releaseOrder(order.id!, payload);
    else if (action === 'approve') obs = this.ccme.approveOrder(order.id!, payload);
    else if (action === 'cancel') obs = this.ccme.cancelOrder(order.id!, payload);
    else return;
    obs.subscribe({
      next: () => { this.snack.open(`Ordem ${action} com sucesso`, 'OK', { duration: 2500 }); this.loadAll(); },
      error: (e: any) => this.snack.open(e?.error ?? `Erro ao ${action}`, 'OK', { duration: 4000 })
    });
  }

  // ── Payers ───────────────────────────────────────────────────────────────
  submitPayer(): void {
    if (this.payerForm.invalid) return;
    const v = this.payerForm.value as CcmePayer;
    const editing = this.editingPayer();
    const obs = editing ? this.ccme.updatePayer(editing.id!, v) : this.ccme.createPayer(v);
    obs.subscribe({
      next: () => { this.snack.open(editing ? 'Pagador atualizado!' : 'Pagador criado!', 'OK', { duration: 2500 }); this.payerForm.reset({ situation: 'Active' }); this.editingPayer.set(null); this.ccme.getPayers().subscribe(p => this.payers.set(p)); },
      error: () => this.snack.open('Erro ao salvar pagador', 'OK', { duration: 3000 })
    });
  }

  editPayer(p: CcmePayer): void {
    this.editingPayer.set(p);
    this.payerForm.patchValue(p);
  }

  deletePayer(id: number): void {
    this.ccme.deletePayer(id).subscribe({
      next: () => { this.snack.open('Pagador excluído', 'OK', { duration: 2000 }); this.ccme.getPayers().subscribe(p => this.payers.set(p)); },
      error: () => this.snack.open('Erro ao excluir', 'OK', { duration: 3000 })
    });
  }

  // ── Recipients ───────────────────────────────────────────────────────────
  submitRecipient(): void {
    if (this.recipientForm.invalid) return;
    const v = this.recipientForm.value as CcmeRecipient;
    const editing = this.editingRecipient();
    const obs = editing ? this.ccme.updateRecipient(editing.id!, v) : this.ccme.createRecipient(v);
    obs.subscribe({
      next: () => { this.snack.open(editing ? 'Beneficiário atualizado!' : 'Beneficiário criado!', 'OK', { duration: 2500 }); this.recipientForm.reset(); this.editingRecipient.set(null); this.ccme.getRecipients().subscribe(r => this.recipients.set(r)); },
      error: () => this.snack.open('Erro ao salvar beneficiário', 'OK', { duration: 3000 })
    });
  }

  editRecipient(r: CcmeRecipient): void {
    this.editingRecipient.set(r);
    this.recipientForm.patchValue(r);
  }

  deleteRecipient(id: number): void {
    this.ccme.deleteRecipient(id).subscribe({
      next: () => { this.snack.open('Beneficiário excluído', 'OK', { duration: 2000 }); this.ccme.getRecipients().subscribe(r => this.recipients.set(r)); },
      error: () => this.snack.open('Erro ao excluir', 'OK', { duration: 3000 })
    });
  }

  // ── Postings ─────────────────────────────────────────────────────────────
  submitPosting(): void {
    if (this.postingForm.invalid) return;
    const v = this.postingForm.value as CcmePosting;
    this.ccme.createPosting(v).subscribe({
      next: () => { this.snack.open('Lançamento criado!', 'OK', { duration: 2500 }); this.postingForm.reset({ type: 'Debit', currencyCode: 'USD' }); this.ccme.getPostings().subscribe(p => this.postings.set(p)); this.ccme.getBalance().subscribe(b => this.balances.set(b)); },
      error: () => this.snack.open('Erro ao criar lançamento', 'OK', { duration: 3000 })
    });
  }

  deletePosting(id: number): void {
    this.ccme.deletePosting(id).subscribe({
      next: () => { this.snack.open('Lançamento excluído', 'OK', { duration: 2000 }); this.ccme.getPostings().subscribe(p => this.postings.set(p)); this.ccme.getBalance().subscribe(b => this.balances.set(b)); },
      error: () => this.snack.open('Erro ao excluir', 'OK', { duration: 3000 })
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  statusColor(status: string): string {
    const map: Record<string, string> = {
      QUEUED: 'accent', PENDING: 'primary', CONFIRMED: 'primary',
      RELEASED: 'primary', APPROVED: 'primary', SENT: 'primary',
      RETURNED: 'warn', CANCELED: 'warn', ERROR: 'warn'
    };
    return map[status] ?? 'default';
  }

  canConfirm = (o: CcmePaymentOrder) => o.status === 'PENDING';
  canRelease = (o: CcmePaymentOrder) => o.status === 'CONFIRMED';
  canApprove = (o: CcmePaymentOrder) => o.status === 'RELEASED';
  canCancel = (o: CcmePaymentOrder) => !['SENT', 'RETURNED', 'CANCELED'].includes(o.status ?? '');
}
