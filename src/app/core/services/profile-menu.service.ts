import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProfileMenu } from '../models/profile-menu.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProfileMenuService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/profile-menu`;

  getAll(): Observable<ProfileMenu[]> {
    return this.http.get<ProfileMenu[]>(this.url);
  }

  getByProfile(profileId: number): Observable<ProfileMenu[]> {
    return this.http.get<ProfileMenu[]>(`${this.url}?profileId=${profileId}`);
  }

  create(profileMenu: ProfileMenu): Observable<ProfileMenu> {
    return this.http.post<ProfileMenu>(this.url, profileMenu);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  saveProfileMenus(profileId: number, menuIds: number[]): Observable<ProfileMenu[]> {
    return this.http.post<ProfileMenu[]>(`${this.url}/profile/${profileId}`, { menuIds });
  }
}
