export interface CriterioAmigoBairro {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  obrigatorio: boolean;
  pontos: number;
  ativo: boolean;
}

export interface NovoCriterioAmigoBairroInput {
  titulo: string;
  descricao: string;
  categoria: string;
  obrigatorio: boolean;
  pontos: number;
}
