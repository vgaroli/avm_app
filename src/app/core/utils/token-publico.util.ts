/** Token opaco, url-safe, para a rota pública `/amigo/:token` — não é o id do documento (ver estabelecimento.model.ts). */
export function gerarTokenPublico(): string {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  let binario = '';
  bytes.forEach((byte) => (binario += String.fromCharCode(byte)));
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
