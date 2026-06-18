import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BalancoRequest {
  pdfBase64: string;
}

export interface CompanyInfo {
  companyName: string;
  cnpj: string;
  bookOrderNumber: number;
  date: string;
}

export interface CompanyBalance {
  description: string;
  balanceInitial: number;
  balanceFinal: number;
}

export interface BalancoResponse {
  company: CompanyInfo;
  companyBalance: CompanyBalance[];
}

@Injectable({ providedIn: 'root' })
export class BalancoPatrimonialService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/BalancoPatrimonial`;

  extrair(body: BalancoRequest): Observable<BalancoResponse> {
    return this.http.post<BalancoResponse>(this.url, body);
  }
}
