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
  Message: string;
  Size: string;
  Quality: string;
  NumberImages: number;
  ReferenceImages: string[];
}

export interface ImageResponse {
  success: boolean;
  imageUrl: string[];
}

export interface VideoPayload {
  Message: string;
  Duration: number;
  AspectRatio: string;
  Resolution: string;
  ReferenceImages: string[];
}

@Injectable({ providedIn: 'root' })
export class AiChatService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  sendText(payload: TextChatPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.api}/ChatOpenAI`, payload);
  }

  generateImage(payload: ImagePayload): Observable<ImageResponse> {
    return this.http.post<ImageResponse>(`${this.api}/GrokAITextToImage`, payload);
  }

  generateVideo(payload: VideoPayload): Observable<string> {
    return this.http.post(`${this.api}/GrokAITextToVideo`, payload, { responseType: 'text' });
  }

  speechToSpeech(base64: string): Observable<{ result: string }> {
    return this.http.post<{ result: string }>(`${this.api}/ChatOpenSpeechToSpeech`, { base64 });
  }
}
