import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface EmailMessageDto {
  to: string;
  cc?: string;
  subject: string;
  body: string;
  isHtml: boolean;
}

export interface ZenviaMessageDto {
  number: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http = inject(HttpClient);

  sendEmail(dto: EmailMessageDto): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/Email`, dto);
  }

  sendSms(dto: ZenviaMessageDto): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/Sms`, dto);
  }

  sendWhatsApp(dto: ZenviaMessageDto): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/WhatsApp`, dto);
  }
}
