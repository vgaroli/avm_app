import { Injectable, inject } from '@angular/core';
import { Auth, authState, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User } from '@angular/fire/auth';
import { Firestore, doc, docData, setDoc } from '@angular/fire/firestore';
import { Observable, map, of, shareReplay, switchMap } from 'rxjs';
import { InscricaoForm, Pessoa } from '../models/pessoa.model';
import { apenasDigitos, emailDoCpf } from '../utils/cpf.util';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly firestore = inject(Firestore);

  readonly currentUser$: Observable<User | null> = authState(this.auth);

  readonly currentPessoa$: Observable<Pessoa | null> = this.currentUser$.pipe(
    switchMap((user) => {
      if (!user) {
        return of(null);
      }
      const pessoaRef = doc(this.firestore, 'pessoas', user.uid);
      return (docData(pessoaRef) as Observable<Pessoa | undefined>).pipe(map((pessoa) => pessoa ?? null));
    }),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  async login(cpf: string, senha: string): Promise<void> {
    const email = emailDoCpf(cpf);
    await signInWithEmailAndPassword(this.auth, email, senha);
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
  }

  async inscrever(dados: InscricaoForm): Promise<void> {
    const email = emailDoCpf(dados.cpf);
    const credencial = await createUserWithEmailAndPassword(this.auth, email, dados.senha);

    const pessoa: Pessoa = {
      uid: credencial.user.uid,
      cpf: apenasDigitos(dados.cpf),
      nomeCompleto: dados.nomeCompleto,
      email: dados.emailPessoal,
      telefone: dados.telefone,
      endereco: dados.endereco,
      dataNascimento: dados.dataNascimento,
      dataInscricao: new Date().toISOString(),
      status: 'pendente',
      papel: null,
    };

    const pessoaRef = doc(this.firestore, 'pessoas', credencial.user.uid);
    await setDoc(pessoaRef, pessoa);
  }
}
