import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BrasilApiService {
  private http = inject(HttpClient);

  getCvmCorretoras(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/CvmCorretoras`);
  }

  getTaxas(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/TaxasBrasil`);
  }

  getPixParticipantes(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/PixParticipantes`);
  }
}
