import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  GeoPoint,
  arrayUnion,
  collection,
  collectionData,
  doc,
  docData,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from '@angular/fire/firestore';
import { Observable, firstValueFrom, map } from 'rxjs';
import { HistoricoEntry } from '../models/mensagem.model';
import { Estabelecimento, EstabelecimentoPublico, NovoEstabelecimentoInput } from '../models/estabelecimento.model';
import { gerarTokenPublico } from '../utils/token-publico.util';
import { AuthService } from './auth.service';

const VALIDADE_SELO_MESES = 12;

@Injectable({ providedIn: 'root' })
export class EstabelecimentosService {
  private readonly firestore = inject(Firestore);
  private readonly authService = inject(AuthService);
  private readonly estabelecimentosRef = collection(this.firestore, 'estabelecimentos');
  private readonly estabelecimentosPublicosRef = collection(this.firestore, 'estabelecimentosPublicos');

  readonly listarTodos$: Observable<Estabelecimento[]> = collectionData(
    query(this.estabelecimentosRef, orderBy('criadoEm', 'desc')),
    { idField: 'id' },
  ) as Observable<Estabelecimento[]>;

  readonly listarPublicos$: Observable<EstabelecimentoPublico[]> = collectionData(this.estabelecimentosPublicosRef, {
    idField: 'id',
  }) as Observable<EstabelecimentoPublico[]>;

  obterEstabelecimento$(id: string): Observable<Estabelecimento | undefined> {
    return docData(doc(this.firestore, 'estabelecimentos', id), { idField: 'id' }) as Observable<
      Estabelecimento | undefined
    >;
  }

  async buscarPorToken(token: string): Promise<EstabelecimentoPublico | undefined> {
    const consulta = query(this.estabelecimentosPublicosRef, where('tokenPublico', '==', token), limit(1));
    const resultados = await firstValueFrom(
      collectionData(consulta, { idField: 'id' }) as Observable<EstabelecimentoPublico[]>,
    );
    return resultados[0];
  }

  async registrarEstabelecimento(
    dados: NovoEstabelecimentoInput,
    lat: number,
    lng: number,
    precisaoGpsMetros: number | null,
  ): Promise<void> {
    const pessoa = await firstValueFrom(this.authService.currentPessoa$);
    if (!pessoa) {
      throw new Error('Usuário não autenticado.');
    }

    const historicoInicial: HistoricoEntry = {
      data: new Date().toISOString(),
      autorUid: pessoa.uid,
      autorNome: pessoa.nomeCompleto,
      acao: 'criado',
    };

    const estabelecimento: Omit<Estabelecimento, 'id'> = {
      nome: dados.nome,
      cnpj: dados.cnpj,
      responsavel: dados.responsavel,
      endereco: dados.endereco,
      categoria: dados.categoria,
      geoponto: new GeoPoint(lat, lng),
      precisaoGpsMetros,
      fotoUrl: null,
      beneficioAssociado: dados.beneficioAssociado,
      status: 'pendente',
      historico: [historicoInicial],
      tokenPublico: null,
      seloEmitidoEm: null,
      seloValidoAte: null,
      criteriosReconhecidos: [],
      criadoEm: new Date().toISOString(),
    };

    await setDoc(doc(this.estabelecimentosRef), estabelecimento);
  }

  /** Aprova o cadastro: grava selo + critérios em `estabelecimentos` e espelha em `estabelecimentosPublicos` na mesma operação. */
  async aprovar(estabelecimento: Estabelecimento, criteriosReconhecidos: string[]): Promise<void> {
    const pessoa = await firstValueFrom(this.authService.currentPessoa$);
    if (!pessoa) {
      throw new Error('Usuário não autenticado.');
    }

    const agora = new Date();
    const seloEmitidoEm = agora.toISOString();
    const validade = new Date(agora);
    validade.setMonth(validade.getMonth() + VALIDADE_SELO_MESES);
    const seloValidoAte = validade.toISOString();
    const tokenPublico = gerarTokenPublico();

    const historicoEntry: HistoricoEntry = {
      data: seloEmitidoEm,
      autorUid: pessoa.uid,
      autorNome: pessoa.nomeCompleto,
      acao: 'aprovado',
    };

    const batch = writeBatch(this.firestore);
    batch.update(doc(this.firestore, 'estabelecimentos', estabelecimento.id), {
      status: 'aprovado',
      historico: arrayUnion(historicoEntry),
      tokenPublico,
      seloEmitidoEm,
      seloValidoAte,
      criteriosReconhecidos,
    });

    const publico: EstabelecimentoPublico = {
      id: estabelecimento.id,
      nome: estabelecimento.nome,
      categoria: estabelecimento.categoria,
      endereco: estabelecimento.endereco,
      geoponto: estabelecimento.geoponto,
      fotoUrl: estabelecimento.fotoUrl,
      seloValidoAte,
      beneficioAssociado: estabelecimento.beneficioAssociado,
      tokenPublico,
      criteriosReconhecidos,
    };
    batch.set(doc(this.firestore, 'estabelecimentosPublicos', estabelecimento.id), publico);

    await batch.commit();
  }

  async reprovar(id: string, comentario?: string): Promise<void> {
    const pessoa = await firstValueFrom(this.authService.currentPessoa$);
    if (!pessoa) {
      throw new Error('Usuário não autenticado.');
    }

    const historicoEntry: HistoricoEntry = {
      data: new Date().toISOString(),
      autorUid: pessoa.uid,
      autorNome: pessoa.nomeCompleto,
      acao: 'reprovado',
      ...(comentario ? { comentario } : {}),
    };

    await updateDoc(doc(this.firestore, 'estabelecimentos', id), {
      status: 'reprovado',
      historico: arrayUnion(historicoEntry),
    });
  }

  /** Revogação simples: troca o token nas duas coleções sem recriar documentos. */
  async revogarToken(estabelecimento: Estabelecimento): Promise<void> {
    const pessoa = await firstValueFrom(this.authService.currentPessoa$);
    if (!pessoa) {
      throw new Error('Usuário não autenticado.');
    }

    const tokenPublico = gerarTokenPublico();
    const historicoEntry: HistoricoEntry = {
      data: new Date().toISOString(),
      autorUid: pessoa.uid,
      autorNome: pessoa.nomeCompleto,
      acao: 'token_revogado',
    };

    const batch = writeBatch(this.firestore);
    batch.update(doc(this.firestore, 'estabelecimentos', estabelecimento.id), {
      tokenPublico,
      historico: arrayUnion(historicoEntry),
    });
    batch.update(doc(this.firestore, 'estabelecimentosPublicos', estabelecimento.id), { tokenPublico });
    await batch.commit();
  }

  /** Ordenação alfabética em memória — mesmo padrão de MensagensService, evita índice composto desnecessário. */
  listarPublicosOrdenados$(): Observable<EstabelecimentoPublico[]> {
    return this.listarPublicos$.pipe(map((lista) => [...lista].sort((a, b) => a.nome.localeCompare(b.nome))));
  }
}
