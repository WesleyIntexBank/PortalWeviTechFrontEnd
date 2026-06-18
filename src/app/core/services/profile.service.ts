import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Profile } from '../models/profile.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/profile`;

  getAll(): Observable<Profile[]> {
    return this.http.get<Profile[]>(this.url);
  }

  getById(id: number): Observable<Profile> {
    return this.http.get<Profile>(`${this.url}/${id}`);
  }

  create(profile: Profile): Observable<Profile> {
    return this.http.post<Profile>(this.url, profile);
  }

  update(profile: Profile): Observable<Profile> {
    return this.http.put<Profile>(this.url, profile);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
