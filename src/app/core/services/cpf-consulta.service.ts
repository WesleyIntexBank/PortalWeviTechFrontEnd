import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CpfConsultaPayload {
  Documento: string;
  DataNascimento: string;
}

@Injectable({ providedIn: 'root' })
export class CpfConsultaService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/cpf`;

  consultar(payload: CpfConsultaPayload): Observable<any> {
    return this.http.post<any>(this.url, payload);
  }
}
