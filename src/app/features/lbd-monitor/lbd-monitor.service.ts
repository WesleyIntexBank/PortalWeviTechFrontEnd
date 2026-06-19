import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AlertaDto, BackupDto, BackupResumoDto, ClusterDto, ConfiguracaoDto,
  CriarRegraAlertaDto, EntregaDto, IncidenteDto, IncidenteResumoDto,
  InstanciaDto, MetricaDto, RegraAlertaDto
} from './models';

@Injectable({ providedIn: 'root' })
export class LbdMonitorService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  // Clusters
  listarClusters(): Observable<ClusterDto[]> {
    return this.http.get<ClusterDto[]>(`${this.base}/Clusters`);
  }

  obterCluster(id: number): Observable<ClusterDto> {
    return this.http.get<ClusterDto>(`${this.base}/Clusters/${id}`);
  }

  // Instâncias
  listarInstancias(): Observable<InstanciaDto[]> {
    return this.http.get<InstanciaDto[]>(`${this.base}/Instancias`);
  }

  obterInstancia(id: number): Observable<InstanciaDto> {
    return this.http.get<InstanciaDto>(`${this.base}/Instancias/${id}`);
  }

  criarInstancia(dto: { nome: string; tipo: string; connectionString: string }): Observable<InstanciaDto> {
    return this.http.post<InstanciaDto>(`${this.base}/Instancias`, dto);
  }

  excluirInstancia(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/Instancias/${id}`);
  }

  obterGrafico24h(id: number): Observable<{ latencia: {momento:string;valor:number}[]; disponibilidade: {momento:string;valor:number}[] }> {
    return this.http.get<any>(`${this.base}/Instancias/${id}/grafico24h`);
  }

  // Backups
  listarBackups(): Observable<BackupDto[]> {
    return this.http.get<BackupDto[]>(`${this.base}/Backups`);
  }

  resumoBackups(): Observable<BackupResumoDto> {
    return this.http.get<BackupResumoDto>(`${this.base}/Backups/resumo`);
  }

  sincronizarBackups(): Observable<{ mensagem: string }> {
    return this.http.post<{ mensagem: string }>(`${this.base}/Backups/sincronizar`, {});
  }

  // Alertas
  listarAlertas(status?: string): Observable<AlertaDto[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<AlertaDto[]>(`${this.base}/Alertas`, { params });
  }

  resolverAlerta(id: number): Observable<AlertaDto> {
    return this.http.patch<AlertaDto>(`${this.base}/Alertas/${id}/resolver`, {});
  }

  listarRegras(): Observable<RegraAlertaDto[]> {
    return this.http.get<RegraAlertaDto[]>(`${this.base}/Alertas/regras`);
  }

  criarRegra(dto: CriarRegraAlertaDto): Observable<RegraAlertaDto> {
    return this.http.post<RegraAlertaDto>(`${this.base}/Alertas/regras`, dto);
  }

  excluirRegra(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/Alertas/regras/${id}`);
  }

  // Incidentes
  resumoIncidentes(): Observable<IncidenteResumoDto> {
    return this.http.get<IncidenteResumoDto>(`${this.base}/Incidentes/resumo`);
  }

  listarIncidentesAtivos(): Observable<IncidenteDto[]> {
    return this.http.get<IncidenteDto[]>(`${this.base}/Incidentes/ativos`);
  }

  listarIncidentesResolvidos(): Observable<IncidenteDto[]> {
    return this.http.get<IncidenteDto[]>(`${this.base}/Incidentes/resolvidos`);
  }

  obterIncidente(id: number): Observable<IncidenteDto> {
    return this.http.get<IncidenteDto>(`${this.base}/Incidentes/${id}`);
  }

  adicionarComentario(id: number, comentario: string, autor: string): Observable<void> {
    return this.http.post<void>(`${this.base}/Incidentes/${id}/comentarios`, { comentario, autor });
  }

  // Entregas
  listarEntregas(canal?: string, status?: string, de?: string, ate?: string): Observable<EntregaDto[]> {
    let params = new HttpParams();
    if (canal) params = params.set('canal', canal);
    if (status) params = params.set('status', status);
    if (de) params = params.set('de', de);
    if (ate) params = params.set('ate', ate);
    return this.http.get<EntregaDto[]>(`${this.base}/Entregas`, { params });
  }

  // Configurações
  listarConfiguracoes(): Observable<ConfiguracaoDto[]> {
    return this.http.get<ConfiguracaoDto[]>(`${this.base}/Configuracoes`);
  }

  salvarConfiguracao(chave: string, valor: string): Observable<ConfiguracaoDto> {
    return this.http.post<ConfiguracaoDto>(`${this.base}/Configuracoes`, { chave, valor });
  }

  obterRetencao(): Observable<{ dias: number }> {
    return this.http.get<{ dias: number }>(`${this.base}/Configuracoes/retencao`);
  }

  obterMetricas(clusterId: number, instanciaId: number, periodo = '24h'): Observable<MetricaDto[]> {
    return this.http.get<MetricaDto[]>(
      `${this.base}/Clusters/${clusterId}/instancias/${instanciaId}/metricas?periodo=${periodo}`
    );
  }
}
