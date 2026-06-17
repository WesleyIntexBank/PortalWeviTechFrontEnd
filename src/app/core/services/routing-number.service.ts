import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RoutingNumberService {
  private http = inject(HttpClient);

  get(number: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/routingnumber/${number}`);
  }
}
