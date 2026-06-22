import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Acam204Notificacao {
  chave: string;
  mensagem: string;
  boletos: string[] | null;
}

export interface Acam204NotificationResult {
  date: string;
  notificacoes: Acam204Notificacao[];
  arquivoBase64: string | null;
}

@Injectable({ providedIn: 'root' })
export class Acam204Service {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/acam204validation`;

  validarPorData(dataInicio: string, dataFim: string): Observable<Acam204NotificationResult[]> {
    return this.http.post<Acam204NotificationResult[]>(`${this.url}/data`, {
      date: dataInicio,
      dateFinal: dataFim,
    });
  }

  validarPorXml(fileName: string, xmlBase64: string): Observable<Acam204NotificationResult> {
    return this.http.post<Acam204NotificationResult>(`${this.url}/xml`, {
      fileName,
      xmlBase64,
    });
  }
}
