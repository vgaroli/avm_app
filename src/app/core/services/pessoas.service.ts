import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, query, updateDoc, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { PapelPessoa, Pessoa } from '../models/pessoa.model';

@Injectable({ providedIn: 'root' })
export class PessoasService {
  private readonly firestore = inject(Firestore);
  private readonly pessoasRef = collection(this.firestore, 'pessoas');

  listarPendentes(): Observable<Pessoa[]> {
    const consulta = query(this.pessoasRef, where('status', '==', 'pendente'));
    return collectionData(consulta) as Observable<Pessoa[]>;
  }

  listarAtivos(): Observable<Pessoa[]> {
    const consulta = query(this.pessoasRef, where('status', '==', 'ativo'));
    return collectionData(consulta) as Observable<Pessoa[]>;
  }

  async aprovarInscricao(uid: string, papel: PapelPessoa): Promise<void> {
    const pessoaRef = doc(this.firestore, 'pessoas', uid);
    await updateDoc(pessoaRef, { status: 'ativo', papel });
  }

  async alterarPapel(uid: string, papel: PapelPessoa): Promise<void> {
    const pessoaRef = doc(this.firestore, 'pessoas', uid);
    await updateDoc(pessoaRef, { papel });
  }

  async inativar(uid: string): Promise<void> {
    const pessoaRef = doc(this.firestore, 'pessoas', uid);
    await updateDoc(pessoaRef, { status: 'inativo' });
  }

  async atualizarDados(
    uid: string,
    dados: Partial<
      Pick<
        Pessoa,
        | 'nomeCompleto'
        | 'email'
        | 'telefone'
        | 'endereco'
        | 'dataNascimento'
        | 'rg'
        | 'ocupacao'
        | 'formaPagamento'
        | 'aceitaWhatsapp'
        | 'fotoUrl'
        | 'observacoesDiretoria'
      >
    >,
  ): Promise<void> {
    const pessoaRef = doc(this.firestore, 'pessoas', uid);
    await updateDoc(pessoaRef, dados);
  }
}
