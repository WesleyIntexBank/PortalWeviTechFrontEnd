import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ConveraIbanSearchRequest {
  iBanValue?: string;
  isoCountryCode?: string;
  countryName?: string;
  pageSize: number;
  pageNumber: number;
}

@Injectable({ providedIn: 'root' })
export class ConveraIbanService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/converaiban/searchbyiban`;

  search(body: ConveraIbanSearchRequest): Observable<any> {
    return this.http.post<any>(this.url, body);
  }
}
