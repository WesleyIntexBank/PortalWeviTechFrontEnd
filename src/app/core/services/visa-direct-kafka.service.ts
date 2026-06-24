import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface VisaDirectPayload {
  Id?: string;
  Status?: string;
  IdVisaDirect?: string;
  BOLETO: string;
  TIPO?: string;
  SUBTIPO?: string;
  MOEDA: string;
  NOME?: string;
  NOMEE?: string;
  ACCOUNT_NUMBER?: string;
  ROUTING_NUMBER?: string;
  BANCO_NOME?: string;
  BANCOBEN?: string;
  BANCOINT?: string;
  PAIS_SIGLA?: string;
  Country?: string;
  ENDERECO?: string;
  CIDADE?: string;
  ESTADO?: string;
  CEP?: string;
  PAIS?: string;
  PAGADOR?: string;
  PAGADORE?: string;
  PAGADORC?: string;
  PAGADORUF?: string;
  PAGADORCD?: string;
  PAGADORCEP?: string;
  TELEFONE?: string;
  VALORME?: number;
  VALORMN?: number;
  TAXANV?: number;
  TAXAOP?: number;
  IOF?: number;
  IOFTAXA?: number;
  YIELD?: number;
  VALORR?: number | null;
  DataME?: string | null;
  DtInicio?: string | null;
  DATAN?: string | null;
  DATAME?: string | null;
  DATAFX?: string;
  CODIGO?: string;
  NOMESRF?: string;
  Error?: string;
}

export interface VisaDirectKafkaResultado {
  boleto: string;
  sucesso: boolean;
  topic?: string;
  partition?: number;
  offset?: number;
  erro?: string;
}

@Injectable({ providedIn: 'root' })
export class VisaDirectKafkaService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/VisaDirectKafka`;

  enviarLote(registros: VisaDirectPayload[]): Observable<VisaDirectKafkaResultado[]> {
    return this.http.post<VisaDirectKafkaResultado[]>(this.base, registros);
  }
}
