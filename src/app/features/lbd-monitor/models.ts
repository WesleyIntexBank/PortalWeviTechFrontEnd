export interface InstanciaDto {
  id: number;
  nome: string;
  tipo: string;
  status: string;
  latencia: number;
  uptime: number;
  score: number;
  conexoesAtivas: number;
  isPrimary: boolean;
  clusterId?: number;
  clusterNome?: string;
  ultimoBackupEm?: string;
  ultimaVerificacao: string;
}

export interface ClusterDto {
  id: number;
  nome: string;
  tipo: string;
  grupoAG?: string;
  status: string;
  score: number;
  totalMembros: number;
  membrosOnline: number;
  membros: InstanciaDto[];
}

export interface BackupDto {
  id: number;
  instanciaNome: string;
  banco: string;
  tipo: string;
  dataBackup: string;
  tamanhoMB: number;
  integridade: string;
  desatualizado: boolean;
}

export interface BackupResumoDto {
  dentro24h: number;
  desatualizados: number;
}

export interface AlertaDto {
  id: number;
  mensagem: string;
  severidade: string;
  statusAlerta: string;
  instanciaId?: number;
  instanciaNome?: string;
  criadoEm: string;
  resolvidoEm?: string;
}

export interface RegraAlertaDto {
  id: number;
  nome: string;
  tipo: string;
  valorLimite: number;
  operador: string;
  acao: string;
  severidade: string;
  ativo: boolean;
  criadoEm: string;
}

export interface CriarRegraAlertaDto {
  nome: string;
  tipo: string;
  valorLimite: number;
  operador: string;
  acao: string;
  severidade: string;
}

export interface IncidenteResumoDto {
  ativos: number;
  resolvidos: number;
  totalRegistrado: number;
}

export interface TimelineDto {
  id: number;
  mensagem: string;
  tipo: string;
  autor?: string;
  criadoEm: string;
}

export interface IncidenteDto {
  id: number;
  instanciaId: number;
  instanciaNome: string;
  titulo: string;
  status: string;
  iniciadoEm: string;
  resolvidoEm?: string;
  timeline: TimelineDto[];
}

export interface EntregaDto {
  id: number;
  canal: string;
  mensagem: string;
  status: string;
  destino?: string;
  tentativas: number;
  alertaId?: number;
  enviadoEm: string;
}

export interface ConfiguracaoDto {
  id: number;
  chave: string;
  valor: string;
  atualizadoEm: string;
}

export interface MetricaDto {
  id: number;
  instanciaId: number;
  cpuPorcentagem: number;
  memoriaGB: number;
  memoriaLimiteGB: number;
  sessoesAtivas: number;
  latenciaMs: number;
  servicoAgentAtivo: boolean;
  coletadoEm: string;
}
