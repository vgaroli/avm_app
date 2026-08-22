export type StatusMensagem = 'nova' | 'em_analise' | 'em_andamento' | 'respondida' | 'concluida';

export interface HistoricoEntry {
  data: string;
  autorUid: string;
  autorNome: string;
  acao: string;
  comentario?: string;
}

export interface Mensagem {
  id: string;
  remetenteUid: string;
  remetenteNome: string;
  assunto: string;
  texto: string;
  dataEnvio: string;
  isTarefa: boolean;
  status: StatusMensagem;
  responsavelUid: string | null;
  responsavelNome: string | null;
  retorno: string | null;
  dataRetorno: string | null;
  historico: HistoricoEntry[];
}

export interface NovaMensagemInput {
  assunto: string;
  texto: string;
}

export const STATUS_MENSAGEM_LABEL: Record<StatusMensagem, string> = {
  nova: 'Nova',
  em_analise: 'Em análise',
  em_andamento: 'Em andamento',
  respondida: 'Respondida',
  concluida: 'Concluída',
};

export const STATUS_MENSAGEM_COR: Record<StatusMensagem, string> = {
  nova: 'card-info',
  em_analise: 'card-warning',
  em_andamento: 'card-accent',
  respondida: 'card-primary',
  concluida: 'card-success',
};
