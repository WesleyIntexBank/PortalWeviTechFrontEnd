import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ListaRestritivaRequest {
  CPF_CNPJ: string;
  NOME: string;
  PESQUISA: number;
}

export interface TbLv {
  cdListado: string;
  deListado: string;
  deComplemento: string;
  cpfCnpj: string;
  dtNascFundacao: string;
  cdTpLista: string;
  deTpLista: string;
  cdListaExterna: string;
}

export interface ListaRestritivaResponse {
  result: {
    flErro: string;
    qtListado: string;
    listado: Array<{ tbLv: TbLv }>;
  };
}

@Injectable({ providedIn: 'root' })
export class ListaRestritivaService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/ListaRestritiva`;

  consultar(body: ListaRestritivaRequest): Observable<ListaRestritivaResponse> {
    return this.http.post<ListaRestritivaResponse>(this.url, body);
  }
}
