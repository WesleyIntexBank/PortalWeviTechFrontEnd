import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CpfEstendidaService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/CPFEstendida`;

  consultar(documento: string): Observable<any> {
    return this.http.post<any>(this.url, { Documento: documento });
  }
}
