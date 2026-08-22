import { PapelPessoa, StatusPessoa } from './pessoa.model';

/** Espelho público restrito de pessoas/{uid}, lido por parceiros/diretoria ao validar o QR code. */
export interface Credencial {
  nome: string;
  nomeExibicao?: string;
  fotoUrl: string;
  status: StatusPessoa;
  papel: PapelPessoa;
}
