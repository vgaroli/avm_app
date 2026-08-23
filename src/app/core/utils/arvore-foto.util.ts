import { Arvore, FotoArvore } from '../models/arvore.model';

/** Lista de fotos, normalizando docs legados (fotoUrl único) para o novo formato. */
export function obterFotosArvore(arvore: Arvore): FotoArvore[] {
  if (arvore.fotos?.length) {
    return arvore.fotos;
  }
  return arvore.fotoUrl ? [{ url: arvore.fotoUrl, tipo: 'inteira' }] : [];
}

/** Foto de capa (grid/mapa/popup): a primeira do tipo 'inteira', senão a primeira disponível. */
export function obterFotoPrincipal(arvore: Arvore): string | null {
  const fotos = obterFotosArvore(arvore);
  return fotos.find((foto) => foto.tipo === 'inteira')?.url ?? fotos[0]?.url ?? null;
}
