import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ProduceRequest {
  topic: string;
  value: string;
  key?: string;
}

export interface ProduceResult {
  topic: string;
  partition: number;
  offset: number;
  key: string;
  timestamp: string;
}

export interface KafkaMessage {
  key: string | null;
  value: string;
  topic: string;
  partition: number;
  offset: number;
  timestamp: string;
}

export interface ConsumeResult {
  count: number;
  messages: KafkaMessage[];
}

@Injectable({ providedIn: 'root' })
export class KafkaService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/Kafka`;

  produce(req: ProduceRequest): Observable<ProduceResult> {
    return this.http.post<ProduceResult>(`${this.base}/produce`, req);
  }

  consume(topic: string, groupId: string, maxMessages = 10, timeoutMs = 3000, fromBeginning = false): Observable<ConsumeResult> {
    return this.http.get<ConsumeResult>(`${this.base}/consume`, {
      params: { topic, groupId, maxMessages, timeoutMs, fromBeginning }
    });
  }
}
