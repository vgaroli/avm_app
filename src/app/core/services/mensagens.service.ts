import { Injectable, inject } from '@angular/core';
import { Firestore, addDoc, arrayUnion, collection, collectionData, doc, docData, query, updateDoc, where } from '@angular/fire/firestore';
import { Observable, firstValueFrom, map, of, switchMap } from 'rxjs';
import { HistoricoEntry, Mensagem, NovaMensagemInput, StatusMensagem } from '../models/mensagem.model';
import { AuthService } from './auth.service';

export interface AtualizacaoMensagem {
  isTarefa?: boolean;
  status?: StatusMensagem;
  responsavelUid?: string | null;
  responsavelNome?: string | null;
  retorno?: string | null;
}

@Injectable({ providedIn: 'root' })
export class MensagensService {
  private readonly firestore = inject(Firestore);
  private readonly authService = inject(AuthService);
  private readonly mensagensRef = collection(this.firestore, 'mensagens');

  async enviarMensagem(dados: NovaMensagemInput): Promise<void> {
    const pessoa = await firstValueFrom(this.authService.currentPessoa$);
    if (!pessoa) {
      throw new Error('Usuário não autenticado.');
    }

    const agora = new Date().toISOString();
    const historicoInicial: HistoricoEntry = {
      data: agora,
      autorUid: pessoa.uid,
      autorNome: pessoa.nomeCompleto,
      acao: 'criada',
    };

    const mensagem: Omit<Mensagem, 'id'> = {
      remetenteUid: pessoa.uid,
      remetenteNome: pessoa.nomeCompleto,
      assunto: dados.assunto,
      texto: dados.texto,
      dataEnvio: agora,
      isTarefa: false,
      status: 'nova',
      responsavelUid: null,
      responsavelNome: null,
      retorno: null,
      dataRetorno: null,
      historico: [historicoInicial],
    };

    await addDoc(this.mensagensRef, mensagem);
  }

  // Ordenação em memória (não no Firestore) para não exigir índice composto
  // remetenteUid + dataEnvio — o volume de mensagens por associado é pequeno.
  listarMinhasMensagens$(): Observable<Mensagem[]> {
    return this.authService.currentPessoa$.pipe(
      switchMap((pessoa) => {
        if (!pessoa) {
          return of([]);
        }
        const consulta = query(this.mensagensRef, where('remetenteUid', '==', pessoa.uid));
        return (collectionData(consulta, { idField: 'id' }) as Observable<Mensagem[]>).pipe(
          map((mensagens) => [...mensagens].sort((a, b) => b.dataEnvio.localeCompare(a.dataEnvio))),
        );
      }),
    );
  }

  readonly listarTodasMensagens$: Observable<Mensagem[]> = (
    collectionData(this.mensagensRef, { idField: 'id' }) as Observable<Mensagem[]>
  ).pipe(map((mensagens) => [...mensagens].sort((a, b) => b.dataEnvio.localeCompare(a.dataEnvio))));

  obterMensagem$(id: string): Observable<Mensagem | undefined> {
    return docData(doc(this.firestore, 'mensagens', id), { idField: 'id' }) as Observable<Mensagem | undefined>;
  }

  async atualizarMensagem(id: string, dados: AtualizacaoMensagem, acao: string, comentario?: string): Promise<void> {
    const pessoa = await firstValueFrom(this.authService.currentPessoa$);
    if (!pessoa) {
      throw new Error('Usuário não autenticado.');
    }

    const historicoEntry: HistoricoEntry = {
      data: new Date().toISOString(),
      autorUid: pessoa.uid,
      autorNome: pessoa.nomeCompleto,
      acao,
      ...(comentario ? { comentario } : {}),
    };

    const camposAtualizados: Record<string, unknown> = { ...dados, historico: arrayUnion(historicoEntry) };
    if (dados.retorno !== undefined) {
      camposAtualizados['dataRetorno'] = new Date().toISOString();
    }

    await updateDoc(doc(this.firestore, 'mensagens', id), camposAtualizados);
  }
}
