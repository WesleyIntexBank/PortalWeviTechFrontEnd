import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigurationParams } from '../models/configuration-params.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ConfigurationParamsService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/configurationparams`;

  getAll(): Observable<ConfigurationParams[]> {
    return this.http.get<ConfigurationParams[]>(this.url);
  }

  getById(id: number): Observable<ConfigurationParams> {
    return this.http.get<ConfigurationParams>(`${this.url}/${id}`);
  }

  create(item: ConfigurationParams): Observable<ConfigurationParams> {
    return this.http.post<ConfigurationParams>(this.url, item);
  }

  update(item: ConfigurationParams): Observable<ConfigurationParams> {
    return this.http.put<ConfigurationParams>(this.url, item);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
