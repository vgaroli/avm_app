import { GeoPoint, Timestamp } from '@angular/fire/firestore';

export type EstadoArvore = 'saudavel' | 'atencao' | 'risco';
export type StatusArvore = 'pendente' | 'validado';
export type TipoFotoArvore = 'inteira' | 'folha' | 'fruto' | 'casca' | 'flor';
export type SituacaoArvore = 'ativa' | 'removida';

export type TipoOcorrencia =
  | 'podada'
  | 'galhoQuebrado'
  | 'pragaDoenca'
  | 'conflitoFiacao'
  | 'danoCalcada'
  | 'removida'
  | 'outro';

export interface FotoArvore {
  url: string;
  tipo: TipoFotoArvore;
}

export interface SugestaoEspecie {
  nomeCientifico: string;
  nomesComuns: string[];
  confianca: number; // 0 a 1
}

export interface ModeracaoArvore {
  sugestoesPlantnet: SugestaoEspecie[] | null;
  moderadoPor: string | null;
  moderadoEm: Timestamp | null;
}

export interface Arvore {
  id: string;
  uid: string;
  /** Formato novo (multi-foto). Docs antigos não têm este campo — ver `fotoUrl`. */
  fotos?: FotoArvore[];
  /** Campo legado (uma única foto), mantido só para leitura de docs antigos; nunca escrito por código novo. */
  fotoUrl?: string;
  geoponto: GeoPoint;
  precisaoGpsMetros: number | null;
  especie: string | null;
  especieCientifica: string | null;
  diametroCm: number | null;
  estado: EstadoArvore;
  observacoes: string;
  criadoEm: Timestamp;
  status: StatusArvore;
  moderacao: ModeracaoArvore | null;
  /** Ausente em docs antigos (= 'ativa'); sempre ler via `obterSituacaoArvore`. */
  situacao?: SituacaoArvore;
  removidaEm?: Timestamp | null;
  enderecoReferencia?: string | null;
  ultimaVisitaEm?: Timestamp | null;
}

export interface VisitaArvore {
  id: string;
  uid: string;
  /** Cópia do nome no momento da visita, para exibir o histórico sem ler `pessoas` (coleção sensível). */
  autorNome: string;
  data: Timestamp;
  /** null quando a ocorrência é remoção. */
  estadoObservado: EstadoArvore | null;
  ocorrencias: TipoOcorrencia[];
  observacoes: string;
  /** URLs; 0 a 3 fotos, mínimo 1 quando 'removida'. */
  fotos: string[];
}

export interface NovaVisitaInput {
  estadoObservado: EstadoArvore | null;
  ocorrencias: TipoOcorrencia[];
  observacoes: string;
}

export interface NovaArvoreInput {
  especie: string | null;
  diametroCm: number | null;
  estado: EstadoArvore;
  observacoes: string;
  enderecoReferencia: string | null;
}

export interface ModeracaoArvoreInput {
  especie: string | null;
  especieCientifica: string | null;
  diametroCm: number | null;
  estado: EstadoArvore;
  observacoes: string;
  enderecoReferencia: string | null;
  fotos: FotoArvore[];
  sugestoesPlantnet: SugestaoEspecie[] | null;
}

export const ESTADO_ARVORE_LABEL: Record<EstadoArvore, string> = {
  saudavel: 'Saudável',
  atencao: 'Atenção',
  risco: 'Risco',
};

export const TIPO_FOTO_ARVORE_LABEL: Record<TipoFotoArvore, string> = {
  inteira: 'Árvore inteira',
  folha: 'Folha',
  fruto: 'Fruto',
  casca: 'Casca',
  flor: 'Flor',
};

export const TIPO_OCORRENCIA_LABEL: Record<TipoOcorrencia, string> = {
  podada: 'Podada',
  galhoQuebrado: 'Galho quebrado',
  pragaDoenca: 'Praga ou doença',
  conflitoFiacao: 'Conflito com fiação',
  danoCalcada: 'Dano à calçada',
  removida: 'Removida',
  outro: 'Outro',
};

export const SITUACAO_ARVORE_LABEL: Record<SituacaoArvore, string> = {
  ativa: 'Ativa',
  removida: 'Removida',
};
