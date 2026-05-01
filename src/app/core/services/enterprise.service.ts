import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Enterprise } from '../models/enterprise.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EnterpriseService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/enterprise`;

  getAll(): Observable<Enterprise[]> {
    return this.http.get<Enterprise[]>(this.url);
  }

  getById(id: number): Observable<Enterprise> {
    return this.http.get<Enterprise>(`${this.url}/${id}`);
  }

  create(enterprise: Enterprise): Observable<Enterprise> {
    return this.http.post<Enterprise>(this.url, enterprise);
  }

  update(id: number, enterprise: Enterprise): Observable<Enterprise> {
    return this.http.put<Enterprise>(`${this.url}/${id}`, enterprise);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
