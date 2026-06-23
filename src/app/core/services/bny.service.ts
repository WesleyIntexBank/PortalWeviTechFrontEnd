import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BnyPaymentRequest {
  message: string;
  clientReferenceId: string;
  clientDescription: string;
}

export interface BnyPaymentAccepted {
  id: string;
  clientReferenceId: string;
  status: string;
  queuedAt: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class BnyService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/BnyPayments`;

  sendPayment(request: BnyPaymentRequest): Observable<BnyPaymentAccepted> {
    return this.http.post<BnyPaymentAccepted>(this.base, request);
  }

  getStatus(xrefId: string): Observable<any> {
    return this.http.get<any>(`${this.base}/${xrefId}`);
  }
}
