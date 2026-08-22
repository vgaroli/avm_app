import { GeoPoint, Timestamp } from '@angular/fire/firestore';

export type EstadoArvore = 'saudavel' | 'atencao' | 'risco';
export type StatusArvore = 'pendente' | 'validado';

export interface Arvore {
  id: string;
  uid: string;
  fotoUrl: string;
  geoponto: GeoPoint;
  especie: string | null;
  diametroCm: number | null;
  estado: EstadoArvore;
  observacoes: string;
  criadoEm: Timestamp;
  status: StatusArvore;
}

export interface NovaArvoreInput {
  especie: string | null;
  diametroCm: number | null;
  estado: EstadoArvore;
  observacoes: string;
}

export const ESTADO_ARVORE_LABEL: Record<EstadoArvore, string> = {
  saudavel: 'Saudável',
  atencao: 'Atenção',
  risco: 'Risco',
};
