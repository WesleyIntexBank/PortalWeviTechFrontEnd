import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TextChatPayload {
  user: string;
  newMessage: string;
  previousMessagesUsers: { content: string }[];
  previousMessagesAssistents: { content: string }[];
}

export interface ImagePayload {
  message: string;
  size?: string;
}

@Injectable({ providedIn: 'root' })
export class AiChatService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  sendText(payload: TextChatPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.api}/ChatOpenAI`, payload);
  }

  generateImage(payload: ImagePayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.api}/ChatOpenAIImage`, payload);
  }

  speechToSpeech(base64: string): Observable<{ result: string }> {
    return this.http.post<{ result: string }>(`${this.api}/ChatOpenSpeechToSpeech`, { base64 });
  }
}
