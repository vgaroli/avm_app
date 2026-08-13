import { TipoPessoa } from '../models/pessoa.model';

export function apenasDigitos(valor: string): string {
  return (valor || '').replace(/\D/g, '');
}

export function formatarCpf(valor: string): string {
  const digitos = apenasDigitos(valor).slice(0, 11);
  return digitos
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function formatarCep(valor: string): string {
  const digitos = apenasDigitos(valor).slice(0, 8);
  return digitos.replace(/(\d{5})(\d{1,3})$/, '$1-$2');
}

export function formatarCnpj(valor: string): string {
  const digitos = apenasDigitos(valor).slice(0, 14);
  return digitos
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

export function formatarDocumento(valor: string, tipo: TipoPessoa): string {
  return tipo === 'juridica' ? formatarCnpj(valor) : formatarCpf(valor);
}

export function emailDoCpf(cpf: string): string {
  return `${apenasDigitos(cpf)}@avm.com.br`;
}

export function cpfValido(cpf: string): boolean {
  const digitos = apenasDigitos(cpf);
  if (digitos.length !== 11 || /^(\d)\1{10}$/.test(digitos)) {
    return false;
  }

  const calcularDigito = (base: string): number => {
    let soma = 0;
    let peso = base.length + 1;
    for (const char of base) {
      soma += Number(char) * peso;
      peso--;
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const digito1 = calcularDigito(digitos.slice(0, 9));
  const digito2 = calcularDigito(digitos.slice(0, 9) + digito1);

  return digitos === digitos.slice(0, 9) + String(digito1) + String(digito2);
}

export function cnpjValido(cnpj: string): boolean {
  const digitos = apenasDigitos(cnpj);
  if (digitos.length !== 14 || /^(\d)\1{13}$/.test(digitos)) {
    return false;
  }

  const calcularDigito = (base: string): number => {
    const pesos = base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const soma = base.split('').reduce((acc, char, i) => acc + Number(char) * pesos[i], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const digito1 = calcularDigito(digitos.slice(0, 12));
  const digito2 = calcularDigito(digitos.slice(0, 12) + digito1);

  return digitos === digitos.slice(0, 12) + String(digito1) + String(digito2);
}

export function documentoValido(valor: string, tipo: TipoPessoa): boolean {
  return tipo === 'juridica' ? cnpjValido(valor) : cpfValido(valor);
}
