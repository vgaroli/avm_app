import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, getDoc, query, where, writeBatch } from '@angular/fire/firestore';
import { Storage, getDownloadURL, ref, uploadBytes } from '@angular/fire/storage';
import { Observable } from 'rxjs';
import { PapelPessoa, Pessoa, StatusPessoa } from '../models/pessoa.model';

@Injectable({ providedIn: 'root' })
export class PessoasService {
  private readonly firestore = inject(Firestore);
  private readonly storage = inject(Storage);
  private readonly pessoasRef = collection(this.firestore, 'pessoas');

  listarPendentes(): Observable<Pessoa[]> {
    const consulta = query(this.pessoasRef, where('status', '==', 'pendente'));
    return collectionData(consulta) as Observable<Pessoa[]>;
  }

  listarAtivos(): Observable<Pessoa[]> {
    const consulta = query(this.pessoasRef, where('status', '==', 'ativo'));
    return collectionData(consulta) as Observable<Pessoa[]>;
  }

  listarDiretoria(): Observable<Pessoa[]> {
    const consulta = query(this.pessoasRef, where('status', '==', 'ativo'), where('papel', '==', 'diretoria'));
    return collectionData(consulta) as Observable<Pessoa[]>;
  }

  async aprovarInscricao(uid: string, papel: PapelPessoa): Promise<void> {
    await this.atualizarComSincroniaCredencial(uid, { status: 'ativo', papel });
  }

  async alterarPapel(uid: string, papel: PapelPessoa): Promise<void> {
    await this.atualizarComSincroniaCredencial(uid, { papel });
  }

  async inativar(uid: string): Promise<void> {
    await this.atualizarComSincroniaCredencial(uid, { status: 'inativo' });
  }

  // Escrita isolada em senhaProvisoria: a regra do Firestore só libera essa
  // transição para o próprio dono quando nenhum outro campo muda junto.
  async confirmarSenhaAlterada(uid: string): Promise<void> {
    await this.atualizarComSincroniaCredencial(uid, { senhaProvisoria: false });
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
        | 'cep'
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
    await this.atualizarComSincroniaCredencial(uid, dados);
  }

  // Auto-edição do próprio associado: deliberadamente sem 'observacoesDiretoria'
  // (nem 'status'/'papel'), que continuam exclusivos da tela da diretoria.
  async atualizarMeuPerfil(
    uid: string,
    dados: Partial<
      Pick<
        Pessoa,
        | 'nomeCompleto'
        | 'nomeExibicao'
        | 'email'
        | 'telefone'
        | 'endereco'
        | 'cep'
        | 'dataNascimento'
        | 'rg'
        | 'ocupacao'
        | 'formaPagamento'
        | 'aceitaWhatsapp'
        | 'fotoUrl'
      >
    >,
  ): Promise<void> {
    await this.atualizarComSincroniaCredencial(uid, dados);
  }

  async uploadFotoPerfil(uid: string, blob: Blob): Promise<string> {
    const fotoRef = ref(this.storage, `fotos-perfil/${uid}/foto.jpg`);
    await uploadBytes(fotoRef, blob, { contentType: 'image/jpeg' });
    return getDownloadURL(fotoRef);
  }

  // Não há Cloud Functions neste projeto: toda escrita em pessoas/{uid} que afete
  // nome, foto, status ou papel replica os campos públicos em credenciais/{uid}
  // no mesmo writeBatch, mantendo a credencial digital sempre consistente.
  private async atualizarComSincroniaCredencial(uid: string, dadosPessoa: Record<string, unknown>): Promise<void> {
    const pessoaRef = doc(this.firestore, 'pessoas', uid);
    const credencialRef = doc(this.firestore, 'credenciais', uid);
    const pessoaAtual = (await getDoc(pessoaRef)).data() as Pessoa | undefined;

    const nome = (dadosPessoa['nomeCompleto'] as string | undefined) ?? pessoaAtual?.nomeCompleto ?? '';
    const nomeExibicao =
      'nomeExibicao' in dadosPessoa
        ? ((dadosPessoa['nomeExibicao'] as string | undefined) ?? '')
        : (pessoaAtual?.nomeExibicao ?? '');
    const fotoUrl = (dadosPessoa['fotoUrl'] as string | undefined) ?? pessoaAtual?.fotoUrl ?? '';
    const status = (dadosPessoa['status'] as StatusPessoa | undefined) ?? pessoaAtual?.status ?? 'pendente';
    const papel = 'papel' in dadosPessoa ? (dadosPessoa['papel'] as PapelPessoa) : (pessoaAtual?.papel ?? null);

    const batch = writeBatch(this.firestore);
    batch.update(pessoaRef, dadosPessoa);
    batch.set(credencialRef, { nome, nomeExibicao, fotoUrl, status, papel }, { merge: true });
    await batch.commit();
  }
}
