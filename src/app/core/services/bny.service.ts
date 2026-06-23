import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
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

export interface BnyListItem {
  referencia: string;
  moeda: string;
  valorME: number;
  dataValor: string;
  nomeBeneficiario: string;
  bicDestino: string;
  clientReferenceId: string;
  clientDescription: string;
  mt103: string;
}

export interface BnyEnvioResultado {
  referencia: string;
  sucesso: boolean;
  id?: string;
  status?: string;
  erro?: string;
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

  enviarLote(items: BnyListItem[]): Observable<BnyEnvioResultado[]> {
    const calls = items.map(item =>
      this.sendPayment({
        message: item.mt103,
        clientReferenceId: item.clientReferenceId,
        clientDescription: item.clientDescription,
      }).pipe(
        map(res => ({
          referencia: item.referencia,
          sucesso: true,
          id: res.id,
          status: res.status,
        })),
        catchError(err => of({
          referencia: item.referencia,
          sucesso: false,
          erro: err?.error?.message ?? err?.message ?? 'Erro ao enviar',
        }))
      )
    );
    return forkJoin(calls);
  }
}
