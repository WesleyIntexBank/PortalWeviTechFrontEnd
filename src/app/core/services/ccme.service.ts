import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CcmePayer {
  id?: number;
  socialName: string;
  cpfCnpj: string;
  address?: string;
  city?: string;
  state?: string;
  situation: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CcmeRecipient {
  id?: number;
  socialName: string;
  country: string;
  bankName?: string;
  bankSwift?: string;
  bankAccount?: string;
  bankIban?: string;
  bankAba?: string;
  bankSortCode?: string;
  bankBranchCode?: string;
  intermediateBank?: string;
  intermediateSwift?: string;
  intermediateAccount?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CcmeCurrency {
  id?: number;
  code: string;
  symbol: string;
  description: string;
  active: boolean;
}

export interface CcmePaymentOrder {
  id?: number;
  code?: string;
  valueDate: string;
  value: number;
  currencyCode: string;
  charges: string;
  status?: string;
  previousStatus?: string;
  payerId: number;
  recipientId: number;
  payerName?: string;
  recipientName?: string;
  invoice?: string;
  reason?: string;
  defaultReason?: string;
  user?: string;
  omitBrokerData: boolean;
  compliance?: boolean;
  complianceReason?: string;
  returnReason?: string;
  error?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CcmePaymentOrderLog {
  id: number;
  paymentOrderId: number;
  user?: string;
  action: string;
  status: string;
  notes?: string;
  createdAt: string;
}

export interface CcmePosting {
  id?: number;
  value: number;
  date: string;
  type: string;
  history: string;
  currencyCode: string;
  reference?: string;
  createdAt?: string;
}

export interface CcmeAccountBalance {
  currencyCode: string;
  totalCredits: number;
  totalDebits: number;
  balance: number;
}

@Injectable({ providedIn: 'root' })
export class CcmeService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  // Payers
  getPayers(): Observable<CcmePayer[]> {
    return this.http.get<CcmePayer[]>(`${this.baseUrl}/CcmePayer`);
  }
  createPayer(payer: CcmePayer): Observable<CcmePayer> {
    return this.http.post<CcmePayer>(`${this.baseUrl}/CcmePayer`, payer);
  }
  updatePayer(id: number, payer: CcmePayer): Observable<CcmePayer> {
    return this.http.put<CcmePayer>(`${this.baseUrl}/CcmePayer/${id}`, payer);
  }
  deletePayer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/CcmePayer/${id}`);
  }

  // Recipients
  getRecipients(): Observable<CcmeRecipient[]> {
    return this.http.get<CcmeRecipient[]>(`${this.baseUrl}/CcmeRecipient`);
  }
  createRecipient(r: CcmeRecipient): Observable<CcmeRecipient> {
    return this.http.post<CcmeRecipient>(`${this.baseUrl}/CcmeRecipient`, r);
  }
  updateRecipient(id: number, r: CcmeRecipient): Observable<CcmeRecipient> {
    return this.http.put<CcmeRecipient>(`${this.baseUrl}/CcmeRecipient/${id}`, r);
  }
  deleteRecipient(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/CcmeRecipient/${id}`);
  }

  // Currencies
  getCurrencies(): Observable<CcmeCurrency[]> {
    return this.http.get<CcmeCurrency[]>(`${this.baseUrl}/CcmeCurrency`);
  }

  // Payment Orders
  getOrders(status?: string): Observable<CcmePaymentOrder[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<CcmePaymentOrder[]>(`${this.baseUrl}/CcmePaymentOrder`, { params });
  }
  getOrderById(id: number): Observable<CcmePaymentOrder> {
    return this.http.get<CcmePaymentOrder>(`${this.baseUrl}/CcmePaymentOrder/${id}`);
  }
  getOrderLog(id: number): Observable<CcmePaymentOrderLog[]> {
    return this.http.get<CcmePaymentOrderLog[]>(`${this.baseUrl}/CcmePaymentOrder/${id}/log`);
  }
  createOrder(order: CcmePaymentOrder): Observable<CcmePaymentOrder> {
    return this.http.post<CcmePaymentOrder>(`${this.baseUrl}/CcmePaymentOrder`, order);
  }
  confirmOrder(id: number, payload: any): Observable<CcmePaymentOrder> {
    return this.http.put<CcmePaymentOrder>(`${this.baseUrl}/CcmePaymentOrder/${id}/confirm`, payload);
  }
  releaseOrder(id: number, payload: any): Observable<CcmePaymentOrder> {
    return this.http.put<CcmePaymentOrder>(`${this.baseUrl}/CcmePaymentOrder/${id}/release`, payload);
  }
  approveOrder(id: number, payload: any): Observable<CcmePaymentOrder> {
    return this.http.put<CcmePaymentOrder>(`${this.baseUrl}/CcmePaymentOrder/${id}/approve`, payload);
  }
  cancelOrder(id: number, payload: any): Observable<CcmePaymentOrder> {
    return this.http.put<CcmePaymentOrder>(`${this.baseUrl}/CcmePaymentOrder/${id}/cancel`, payload);
  }
  returnOrder(id: number, payload: any): Observable<CcmePaymentOrder> {
    return this.http.put<CcmePaymentOrder>(`${this.baseUrl}/CcmePaymentOrder/${id}/return`, payload);
  }

  // Postings
  getPostings(currencyCode?: string): Observable<CcmePosting[]> {
    let params = new HttpParams();
    if (currencyCode) params = params.set('currencyCode', currencyCode);
    return this.http.get<CcmePosting[]>(`${this.baseUrl}/CcmePosting`, { params });
  }
  createPosting(p: CcmePosting): Observable<CcmePosting> {
    return this.http.post<CcmePosting>(`${this.baseUrl}/CcmePosting`, p);
  }
  deletePosting(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/CcmePosting/${id}`);
  }

  // Balance
  getBalance(currencyCode?: string): Observable<CcmeAccountBalance[]> {
    let params = new HttpParams();
    if (currencyCode) params = params.set('currencyCode', currencyCode);
    return this.http.get<CcmeAccountBalance[]>(`${this.baseUrl}/CcmeAccountBalance`, { params });
  }
}
