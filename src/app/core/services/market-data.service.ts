import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

function toParams(obj: Record<string, string | number | null | undefined>): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined && value !== '') {
      params = params.set(key, String(value));
    }
  }
  return params;
}

@Injectable({ providedIn: 'root' })
export class MarketDataService {
  private http = inject(HttpClient);
  private marketUrl = `${environment.apiUrl}/Market`;
  private summaryUrl = `${environment.apiUrl}/Summary`;
  private symbolUrl = `${environment.apiUrl}/Symbol`;
  private chartUrl = `${environment.apiUrl}/Chart`;
  private newsUrl = `${environment.apiUrl}/News`;
  private searchUrl = `${environment.apiUrl}/Search`;

  // market
  getEtf(screenerId: string, region: string, offset = 0, limit = 0): Observable<any> {
    return this.http.get<any>(`${this.marketUrl}/etf`, { params: toParams({ screenerId, region, offset, limit }) });
  }

  getCrypto(screenerId: string, offset = 0, limit = 0): Observable<any> {
    return this.http.get<any>(`${this.marketUrl}/crypto`, { params: toParams({ screenerId, offset, limit }) });
  }

  getOverview(category: string, region: string): Observable<any> {
    return this.http.get<any>(`${this.marketUrl}/overview`, { params: toParams({ category, region }) });
  }

  getOption(screenerId: string, region: string): Observable<any> {
    return this.http.get<any>(`${this.marketUrl}/option`, { params: toParams({ screenerId, region }) });
  }

  getEquity(screenerId: string, region: string): Observable<any> {
    return this.http.get<any>(`${this.marketUrl}/equity`, { params: toParams({ screenerId, region }) });
  }

  getMutualFund(screenerId: string, region: string): Observable<any> {
    return this.http.get<any>(`${this.marketUrl}/mutual-fund`, { params: toParams({ screenerId, region }) });
  }

  // summary
  getOptionPrice(symbol: string): Observable<any> {
    return this.http.get<any>(`${this.summaryUrl}/option-price`, { params: toParams({ symbol }) });
  }

  getRelatedList(symbol: string, limit = 10): Observable<any> {
    return this.http.get<any>(`${this.summaryUrl}/related-list`, { params: toParams({ symbol, limit }) });
  }

  getSymbolInfo(symbol: string): Observable<any> {
    return this.http.get<any>(`${this.summaryUrl}/symbol-info`, { params: toParams({ symbol }) });
  }

  getSymbolProfile(symbol: string): Observable<any> {
    return this.http.get<any>(`${this.summaryUrl}/symbol-profile`, { params: toParams({ symbol }) });
  }

  getRelatedSymbol(symbol: string, limit = 5): Observable<any> {
    return this.http.get<any>(`${this.summaryUrl}/related-symbol`, { params: toParams({ symbol, limit }) });
  }

  // symbol
  getComposite(symbol: string): Observable<any> {
    return this.http.get<any>(`${this.symbolUrl}/composite`, { params: toParams({ symbol }) });
  }

  getSecFiling(symbol: string, limit = 10): Observable<any> {
    return this.http.get<any>(`${this.symbolUrl}/secfiling`, { params: toParams({ symbol, limit }) });
  }

  getFundamentalTimeseries(symbol: string): Observable<any> {
    return this.http.get<any>(`${this.symbolUrl}/fundamental-timeseries`, { params: toParams({ symbol }) });
  }

  getFundamental(symbol: string): Observable<any> {
    return this.http.get<any>(`${this.symbolUrl}/fundamental`, { params: toParams({ symbol }) });
  }

  getCalendar(symbol: string, limit = 10): Observable<any> {
    return this.http.get<any>(`${this.symbolUrl}/calendar`, { params: toParams({ symbol, limit }) });
  }

  getEarning(symbol: string, limit = 10): Observable<any> {
    return this.http.get<any>(`${this.symbolUrl}/earning`, { params: toParams({ symbol, limit }) });
  }

  getPriceHistory(symbol: string, from?: number, to?: number, type = 'price_history', frequency = '1d', limit = 10): Observable<any> {
    return this.http.get<any>(`${this.symbolUrl}/price-history`, { params: toParams({ symbol, from, to, type, frequency, limit }) });
  }

  getCorporateAction(symbol: string): Observable<any> {
    return this.http.get<any>(`${this.symbolUrl}/corporate-action`, { params: toParams({ symbol }) });
  }

  getSustainability(symbol: string): Observable<any> {
    return this.http.get<any>(`${this.symbolUrl}/sustainability`, { params: toParams({ symbol }) });
  }

  getUpgradeDowngrade(symbol: string, limit = 10): Observable<any> {
    return this.http.get<any>(`${this.symbolUrl}/upgrade-downgrade`, { params: toParams({ symbol, limit }) });
  }

  getInsiderHolder(symbol: string, limit = 10): Observable<any> {
    return this.http.get<any>(`${this.symbolUrl}/insider-holder`, { params: toParams({ symbol, limit }) });
  }

  getQuoteType(symbol: string): Observable<any> {
    return this.http.get<any>(`${this.symbolUrl}/quote-type`, { params: toParams({ symbol }) });
  }

  // chart
  getSimpleChart(symbol: string, limit = 10, range = '1d'): Observable<any> {
    return this.http.get<any>(`${this.chartUrl}/simple-chart`, { params: toParams({ symbol, limit, range }) });
  }

  getAdvancedChart(symbol: string, limit = 10, from?: number, to?: number, range = '1d'): Observable<any> {
    return this.http.get<any>(`${this.chartUrl}/advanced-chart`, { params: toParams({ symbol, limit, from, to, range }) });
  }

  // news
  getNewsDetail(id: string): Observable<any> {
    return this.http.get<any>(`${this.newsUrl}/detail`, { params: toParams({ id }) });
  }

  getHotNews(limit = 10): Observable<any> {
    return this.http.get<any>(`${this.newsUrl}/hot-news`, { params: toParams({ limit }) });
  }

  getNewsList(symbol: string, limit = 10): Observable<any> {
    return this.http.get<any>(`${this.newsUrl}/list`, { params: toParams({ symbol, limit }) });
  }

  // search
  getSearchListDetail(id: string, limit = 10, offset = 0): Observable<any> {
    return this.http.get<any>(`${this.searchUrl}/list-detail`, { params: toParams({ id, limit, offset }) });
  }

  getSearchList(keyword: string, limit = 20): Observable<any> {
    return this.http.get<any>(`${this.searchUrl}/list`, { params: toParams({ keyword, limit }) });
  }

  getSearchSymbol(keyword: string, limit = 10): Observable<any> {
    return this.http.get<any>(`${this.searchUrl}/symbol`, { params: toParams({ keyword, limit }) });
  }

  getSearchNews(keyword: string, limit = 10): Observable<any> {
    return this.http.get<any>(`${this.searchUrl}/news`, { params: toParams({ keyword, limit }) });
  }
}
