import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ConveraSwiftSearchRequest {
  bankcode?: string;
  isoCountryCode?: string;
  countryName?: string;
  page_size: number;
  page_number: number;
}

@Injectable({ providedIn: 'root' })
export class ConveraSwiftService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/converaswift/searchbydetail`;

  search(body: ConveraSwiftSearchRequest): Observable<any> {
    return this.http.post<any>(this.url, body);
  }
}
