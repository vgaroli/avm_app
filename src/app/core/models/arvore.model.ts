import { GeoPoint, Timestamp } from '@angular/fire/firestore';

export type EstadoArvore = 'saudavel' | 'atencao' | 'risco';
export type StatusArvore = 'pendente' | 'validado';
export type TipoFotoArvore = 'inteira' | 'folha' | 'fruto' | 'casca' | 'flor';

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
}

export interface NovaArvoreInput {
  especie: string | null;
  diametroCm: number | null;
  estado: EstadoArvore;
  observacoes: string;
}

export interface ModeracaoArvoreInput {
  especie: string | null;
  especieCientifica: string | null;
  diametroCm: number | null;
  estado: EstadoArvore;
  observacoes: string;
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
