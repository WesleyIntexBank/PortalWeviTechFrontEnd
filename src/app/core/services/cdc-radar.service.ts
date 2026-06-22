import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CDCRadar {
  documento: string;
  nome: string;
  situacaoRadar: string;
  dataSituacao: string;
  modalidade: string;
  subModalidade: string;
  operacoes: string;
}

@Injectable({ providedIn: 'root' })
export class CdcRadarService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/cdcradar`;

  buscarPorDocumento(documento: string): Observable<CDCRadar> {
    return this.http.get<CDCRadar>(`${this.url}/${documento}`);
  }
}
