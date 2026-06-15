import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RequestLogRow {
  timestamp: string;
  clientIp: string;
  name: string;
  url: string;
  success: string;
  resultCode: string;
  durationMs: number;
  operationId: string;
}

export interface RequestLogsResponse {
  rows: RequestLogRow[];
  total: number;
}

export interface SummaryResponse {
  totalRequests: number;
  successCount: number;
  failureCount: number;
  avgDurationMs: number;
  p95DurationMs: number;
}

export interface TopRouteRow {
  name: string;
  count: number;
  avgMs: number;
  errors: number;
}

export interface RequestFilter {
  from?: string;
  to?: string;
  ip?: string;
  route?: string;
  statusCode?: string;
  maxRows?: number;
}

@Injectable({ providedIn: 'root' })
export class AppInsightsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/AppInsights`;

  getRequests(filter: RequestFilter = {}): Observable<RequestLogsResponse> {
    let params = new HttpParams();
    if (filter.from)       params = params.set('from', filter.from);
    if (filter.to)         params = params.set('to', filter.to);
    if (filter.ip)         params = params.set('ip', filter.ip);
    if (filter.route)      params = params.set('route', filter.route);
    if (filter.statusCode) params = params.set('statusCode', filter.statusCode);
    if (filter.maxRows)    params = params.set('maxRows', filter.maxRows.toString());
    return this.http.get<RequestLogsResponse>(`${this.base}/requests`, { params });
  }

  getSummary(hours = 24): Observable<SummaryResponse> {
    return this.http.get<SummaryResponse>(`${this.base}/summary`, {
      params: new HttpParams().set('hours', hours.toString())
    });
  }

  getTopRoutes(hours = 24, top = 10): Observable<TopRouteRow[]> {
    return this.http.get<TopRouteRow[]>(`${this.base}/top-routes`, {
      params: new HttpParams().set('hours', hours.toString()).set('top', top.toString())
    });
  }
}
