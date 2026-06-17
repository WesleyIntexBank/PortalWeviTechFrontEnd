import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';
import { environment } from '../../../environments/environment';

// Bearer token é injetado automaticamente pelo authInterceptor em todas as requisições.
@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  getAll(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/User`);
  }

  getById(userId: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/Users/${userId}`);
  }

  getByUserId(userId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/User/${userId}`);
  }

  getMesa(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/UserMesa`);
  }

  getMesaByEnterprise(enterpriseId: number): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/UserMesa/${enterpriseId}`);
  }

  create(user: User): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/User`, user);
  }

  update(userId: number, user: User): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/User/${userId}`, user);
  }

  uploadPhoto(user: { id: number; photo: string }): Observable<number> {
    return this.http.put<number>(`${this.baseUrl}/UploadUserPhoto`, user);
  }

  delete(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/User/${userId}`);
  }

  loadPhoto(userId: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/LoadUserPhoto/${userId}`);
  }

  getByCredit(userId: number): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/GetByCredit/${userId}`);
  }

  getByDebit(userId: number): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/GetByDebit/${userId}`);
  }
}
