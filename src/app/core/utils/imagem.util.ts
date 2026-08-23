export interface OpcoesCompressaoImagem {
  maxDimensao?: number; // default 1600
  qualidade?: number; // default 0.8
}

/**
 * Redimensiona e recomprime uma imagem via canvas antes do upload, para reduzir
 * custo de armazenamento e melhorar confiabilidade em rede celular fraca.
 * Em caso de falha (formato não suportado pelo navegador, ex: HEIC em alguns
 * casos), retorna o arquivo original sem lançar erro.
 */
export async function comprimirImagem(arquivo: File, opcoes: OpcoesCompressaoImagem = {}): Promise<File> {
  const maxDimensao = opcoes.maxDimensao ?? 1600;
  const qualidade = opcoes.qualidade ?? 0.8;

  const bitmap = await createImageBitmap(arquivo);
  try {
    const escala = Math.min(1, maxDimensao / Math.max(bitmap.width, bitmap.height));
    const largura = Math.round(bitmap.width * escala);
    const altura = Math.round(bitmap.height * escala);

    const canvas = document.createElement('canvas');
    canvas.width = largura;
    canvas.height = altura;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return arquivo;
    }
    ctx.drawImage(bitmap, 0, 0, largura, altura);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', qualidade));
    if (!blob) {
      return arquivo;
    }
    return new File([blob], renomearParaJpg(arquivo.name), { type: 'image/jpeg' });
  } finally {
    bitmap.close();
  }
}

function renomearParaJpg(nomeOriginal: string): string {
  const semExtensao = nomeOriginal.replace(/\.[^.]+$/, '');
  return `${semExtensao || 'foto'}.jpg`;
}
