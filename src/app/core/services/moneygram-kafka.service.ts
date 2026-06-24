import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MoneyGramPayload {
  BOLETO: string;
  NOME?: string;
  CPF?: string;
  DATA_NASCIMENTO?: string;
  TELEFONE?: string;
  ENDERECO_RUA?: string;
  ENDERECO_CIDADE?: string;
  ENDERECO_CEP?: string;
  NOME_BENEFICIARIO?: string;
  PAIS_DESTINO?: string;
  MOEDA?: string;
  VALOR_ME?: number;
  VALOR_MN?: number;
  TIPO_ENTREGA?: string;
  CONTA_BENEFICIARIO?: string;
  ROUTING_BENEFICIARIO?: string;
  TIPO_CONTA?: string;
}

export interface MoneyGramResultado {
  boleto: string;
  sucesso: boolean;
  topic?: string;
  partition?: number;
  offset?: number;
  erro?: string;
}

@Injectable({ providedIn: 'root' })
export class MoneyGramKafkaService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/MoneyGramKafka`;

  enviar(payload: MoneyGramPayload[]): Observable<MoneyGramResultado[]> {
    return this.http.post<MoneyGramResultado[]>(this.base, payload);
  }
}
