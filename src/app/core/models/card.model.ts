export type VisibilidadeCard = 'publico' | 'associado' | 'diretoria';

export interface CardConfig {
  id: string;
  ordem: number;
  icon: string;
  title: string;
  info: string;
  colorClass: string;
  rota: string;
  visibilidade: VisibilidadeCard[];
  ativo: boolean;
}
