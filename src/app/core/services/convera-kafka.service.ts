import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ConveraPayload {
  Id?: string;
  Status?: string;
  IdConvera?: string;
  BOLETO: string;
  TIPO?: string;
  SUBTIPO?: string;
  MOEDA: string;
  NOME?: string;
  NOMEE?: string;
  INTERNET?: string;
  SWIFT?: string;
  ABA?: string;
  BANCO_NOME?: string;
  BANCOBEN?: string;
  BANCOINT?: string;
  BANCO_CHIPS?: string;
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

export interface ConveraKafkaResultado {
  boleto: string;
  sucesso: boolean;
  topic?: string;
  partition?: number;
  offset?: number;
  erro?: string;
}

@Injectable({ providedIn: 'root' })
export class ConveraKafkaService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/ConveraKafka`;

  enviarLote(registros: ConveraPayload[]): Observable<ConveraKafkaResultado[]> {
    return this.http.post<ConveraKafkaResultado[]>(this.base, registros);
  }
}
