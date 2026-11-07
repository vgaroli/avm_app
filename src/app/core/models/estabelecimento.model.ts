import { GeoPoint } from '@angular/fire/firestore';
import { HistoricoEntry } from './mensagem.model';

export type StatusEstabelecimento = 'pendente' | 'aprovado' | 'reprovado';

export interface Estabelecimento {
  id: string;
  nome: string;
  cnpj: string;
  responsavel: string;
  endereco: string;
  categoria: string;
  geoponto: GeoPoint;
  precisaoGpsMetros: number | null;
  fotoUrl: string | null;
  beneficioAssociado: string | null;
  status: StatusEstabelecimento;
  historico: HistoricoEntry[];
  tokenPublico: string | null;
  seloEmitidoEm: string | null;
  seloValidoAte: string | null;
  criteriosReconhecidos: string[];
  criadoEm: string;
}

export interface NovoEstabelecimentoInput {
  nome: string;
  cnpj: string;
  responsavel: string;
  endereco: string;
  categoria: string;
  beneficioAssociado: string | null;
}

/** Espelho público de `estabelecimentos/{id}` (mesmo id), sem CNPJ/responsável/histórico. */
export interface EstabelecimentoPublico {
  id: string;
  nome: string;
  categoria: string;
  endereco: string;
  geoponto: GeoPoint;
  fotoUrl: string | null;
  seloValidoAte: string;
  beneficioAssociado: string | null;
  tokenPublico: string;
  criteriosReconhecidos: string[];
}

export const STATUS_ESTABELECIMENTO_LABEL: Record<StatusEstabelecimento, string> = {
  pendente: 'Pendente',
  aprovado: 'Aprovado',
  reprovado: 'Reprovado',
};

export const STATUS_ESTABELECIMENTO_COR: Record<StatusEstabelecimento, string> = {
  pendente: 'card-warning',
  aprovado: 'card-success',
  reprovado: 'card-danger',
};
