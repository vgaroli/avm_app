export type StatusPessoa = 'pendente' | 'ativo' | 'inativo';
export type PapelPessoa = 'associado' | 'diretoria' | null;

export interface Pessoa {
  uid: string;
  cpf: string;
  nomeCompleto: string;
  email: string;
  telefone: string;
  endereco: string;
  dataNascimento: string;
  dataInscricao: string;
  status: StatusPessoa;
  papel: PapelPessoa;
  fotoUrl?: string;
  observacoesDiretoria?: string;
}

export interface InscricaoForm {
  nomeCompleto: string;
  cpf: string;
  emailPessoal: string;
  telefone: string;
  endereco: string;
  dataNascimento: string;
  senha: string;
}
