import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PixBtgRequest {
  Boleto: string;
  Tipo: 'GERAR_QR' | 'ENVIAR_PIX';
  ValorME?: number;
  ValorMN?: number;
  Moeda?: string;
  NomeBeneficiario?: string;
  CpfCnpjBeneficiario?: string;
  ChavePixBeneficiario?: string;
  BancoDestino?: string;
  NomeRemetente?: string;
}

export interface PixBtgResponse {
  boleto: string;
  status: string;
  queuedAt: string;
  mensagem: string;
}

export interface PixBtgPagamento {
  id: number;
  boleto: string;
  tipo: string;
  txId?: string;
  idPixBtg?: string;
  endToEndId?: string;
  chavePixBeneficiario?: string;
  nomeBeneficiario?: string;
  cpfCnpjBeneficiario?: string;
  moeda?: string;
  valorME?: number;
  valorMN?: number;
  emvPayload?: string;
  imageBase64?: string;
  status: string;
  error?: string;
  criadoEm: string;
  atualizadoEm?: string;
}

@Injectable({ providedIn: 'root' })
export class PixBtgService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/PixBtg`;

  enviar(request: PixBtgRequest): Observable<PixBtgResponse> {
    return this.http.post<PixBtgResponse>(this.base, request);
  }

  consultarStatus(boleto: string): Observable<PixBtgPagamento> {
    return this.http.get<PixBtgPagamento>(`${this.base}/${encodeURIComponent(boleto)}`);
  }

  listar(status?: string, page = 1, size = 50): Observable<{ total: number; page: number; size: number; items: PixBtgPagamento[] }> {
    let url = `${this.base}?page=${page}&size=${size}`;
    if (status) url += `&status=${status}`;
    return this.http.get<any>(url);
  }
}
