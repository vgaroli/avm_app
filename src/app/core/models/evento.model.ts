export type VisibilidadeEvento = 'publico' | 'diretoria';

export interface Evento {
  id: string;
  googleEventId: string;
  calendarId: string;
  visibilidade: VisibilidadeEvento;
  titulo: string;
  descricao: string;
  local: string;
  inicio: string;
  fim: string;
  diaTodo: boolean;
  atualizadoEm: string;
}
