import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EscavadorProcessosService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/escavadorprocessos`;

  consultar(cpfCnpj: string, limit = 100): Observable<any> {
    const params = new HttpParams().set('cpfCnpj', cpfCnpj).set('limit', limit.toString());
    return this.http.get<any>(this.url, { params });
  }
}
