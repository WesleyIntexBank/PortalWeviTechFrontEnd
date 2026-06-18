import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Menu } from '../models/menu.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MenuService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/menu`;

  getAll(): Observable<Menu[]> {
    return this.http.get<Menu[]>(this.url);
  }

  getByProfile(profileId: number): Observable<Menu[]> {
    return this.http.get<Menu[]>(`${environment.apiUrl}/profile/${profileId}`);
  }

  getById(id: number): Observable<Menu> {
    return this.http.get<Menu>(`${this.url}/${id}`);
  }

  create(menu: Menu): Observable<Menu> {
    return this.http.post<Menu>(this.url, menu);
  }

  update(id: number, menu: Menu): Observable<Menu> {
    return this.http.put<Menu>(`${this.url}/${id}`, menu);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
