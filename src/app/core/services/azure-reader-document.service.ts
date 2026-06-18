import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type TypeDocumento = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const TYPE_DOCUMENTO_LABELS: Record<TypeDocumento, string> = {
  0: 'IRPF',
  1: 'PDF',
  2: 'RG',
  3: 'CNH',
  4: 'CPF',
  5: 'Word',
  6: 'PowerPoint',
  7: 'Excel',
  8: 'Imagem',
};

export interface AzureReaderRequest {
  user: string;
  fileName: string;
  newMessage: string;
  base64: string;
  search: boolean;
  tipo: TypeDocumento;
}

export interface CelulaTabela {
  rowIndex: number;
  columnIndex: number;
  content: string;
}

export interface TabelaEstruturada {
  linhas: number;
  colunas: number;
  celulas: CelulaTabela[];
}

export interface PaginaConteudo {
  pagina: number;
  linhas: string[];
}

export interface DocumentoIRPF {
  dataProcessamento: string;
  totalPaginas: number;
  conteudo: PaginaConteudo[];
  tabelas: TabelaEstruturada[];
}

export type AzureReaderResponse =
  | { message: DocumentoIRPF }
  | { message: string };

@Injectable({ providedIn: 'root' })
export class AzureReaderDocumentService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/AzureReaderDocument`;

  analisar(body: AzureReaderRequest): Observable<AzureReaderResponse> {
    return this.http.post<AzureReaderResponse>(this.url, body);
  }
}
