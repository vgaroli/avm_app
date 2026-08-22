export type StatusPessoa = 'pendente' | 'ativo' | 'inativo';
export type PapelPessoa = 'associado' | 'diretoria' | 'parceiro' | null;
export type FormaPagamento = 'avista' | 'parcelado';
export type TipoPessoa = 'fisica' | 'juridica';

export interface Pessoa {
  uid: string;
  tipoPessoa: TipoPessoa;
  /** CPF (pessoa física) ou CNPJ (pessoa jurídica), somente dígitos. */
  cpf: string;
  /** RG — vazio para pessoa jurídica. */
  rg: string;
  nomeCompleto: string;
  /** Nome alternativo, mais curto, opcional; usado no lugar de nomeCompleto em UI restrita (credencial, cards). */
  nomeExibicao?: string;
  email: string;
  telefone: string;
  endereco: string;
  cep: string;
  dataNascimento: string;
  ocupacao: string;
  formaPagamento: FormaPagamento;
  aceitaWhatsapp: boolean;
  aceitaLgpd: boolean;
  aceitaEstatuto: boolean;
  aceitaResponsabilidades: boolean;
  dataInscricao: string;
  status: StatusPessoa;
  papel: PapelPessoa;
  fotoUrl?: string;
  observacoesDiretoria?: string;
  /** true quando a senha foi definida pelo cadastro em massa e ainda precisa ser trocada pelo usuário. */
  senhaProvisoria?: boolean;
}

export const PAPEL_PESSOA_LABEL: Record<Exclude<PapelPessoa, null>, string> = {
  associado: 'Associado',
  diretoria: 'Diretoria',
  parceiro: 'Parceiro',
};

export interface InscricaoForm {
  tipoPessoa: TipoPessoa;
  nomeCompleto: string;
  cpf: string;
  rg: string;
  emailPessoal: string;
  telefone: string;
  endereco: string;
  cep: string;
  dataNascimento: string;
  ocupacao: string;
  formaPagamento: FormaPagamento;
  aceitaWhatsapp: boolean;
  aceitaLgpd: boolean;
  aceitaEstatuto: boolean;
  aceitaResponsabilidades: boolean;
  senha: string;
}
