import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  GeoPoint,
  Timestamp,
  collection,
  collectionData,
  doc,
  docData,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  writeBatch,
} from '@angular/fire/firestore';
import { Storage, deleteObject, getDownloadURL, ref, uploadBytes } from '@angular/fire/storage';
import { Observable, firstValueFrom } from 'rxjs';
import {
  Arvore,
  FotoArvore,
  ModeracaoArvoreInput,
  NovaArvoreInput,
  NovaVisitaInput,
  SugestaoEspecie,
  TipoFotoArvore,
  VisitaArvore,
} from '../models/arvore.model';
import { obterFotosArvore } from '../utils/arvore-foto.util';
import { AuthService } from './auth.service';

export interface AtualizacaoArvore {
  especie: string | null;
  diametroCm: number | null;
  estado: Arvore['estado'];
  observacoes: string;
  enderecoReferencia: string | null;
}

export interface FotoParaEnviar {
  arquivo: File; // já comprimido pelo chamador
  tipo: TipoFotoArvore;
}

export const MAXIMO_FOTOS_VISITA = 3;

@Injectable({ providedIn: 'root' })
export class ArvoresService {
  private readonly firestore = inject(Firestore);
  private readonly storage = inject(Storage);
  private readonly authService = inject(AuthService);
  private readonly arvoresRef = collection(this.firestore, 'arvores');

  readonly listarTodas$: Observable<Arvore[]> = collectionData(query(this.arvoresRef, orderBy('criadoEm', 'desc')), {
    idField: 'id',
  }) as Observable<Arvore[]>;

  obterArvore$(id: string): Observable<Arvore | undefined> {
    return docData(doc(this.firestore, 'arvores', id), { idField: 'id' }) as Observable<Arvore | undefined>;
  }

  async atualizarArvore(id: string, dados: AtualizacaoArvore): Promise<void> {
    await updateDoc(doc(this.firestore, 'arvores', id), { ...dados });
  }

  /** Usado pela tela de moderação: grava espécie confirmada, fotos reclassificadas e marca status/moderadoPor/moderadoEm. */
  async validarArvore(id: string, dados: ModeracaoArvoreInput): Promise<void> {
    const pessoa = await firstValueFrom(this.authService.currentPessoa$);
    if (!pessoa) {
      throw new Error('Usuário não autenticado.');
    }
    await updateDoc(doc(this.firestore, 'arvores', id), {
      especie: dados.especie,
      especieCientifica: dados.especieCientifica,
      diametroCm: dados.diametroCm,
      estado: dados.estado,
      observacoes: dados.observacoes,
      enderecoReferencia: dados.enderecoReferencia,
      fotos: dados.fotos,
      status: 'validado',
      moderacao: {
        sugestoesPlantnet: dados.sugestoesPlantnet,
        moderadoPor: pessoa.uid,
        moderadoEm: Timestamp.now(),
      },
    });
  }

  /** Persiste apenas as sugestões do Pl@ntNet, sem alterar status/validação (evita reconsulta ao reabrir a tela). */
  async salvarSugestoesPlantnet(id: string, sugestoes: SugestaoEspecie[]): Promise<void> {
    await updateDoc(doc(this.firestore, 'arvores', id), {
      'moderacao.sugestoesPlantnet': sugestoes,
    });
  }

  /**
   * Exclusão definitiva (cadastro feito por engano). O Firestore não apaga subcoleções em cascata,
   * então as visitas (e suas fotos) são apagadas explicitamente antes do documento da árvore.
   */
  async excluirArvore(arvore: Arvore): Promise<void> {
    const visitasSnap = await getDocs(this.visitasRef(arvore.id));
    const urlsFotos = [
      ...obterFotosArvore(arvore).map((foto) => foto.url),
      ...visitasSnap.docs.flatMap((visita) => (visita.data() as VisitaArvore).fotos ?? []),
    ];

    await Promise.all(
      urlsFotos.map((url) =>
        deleteObject(ref(this.storage, url)).catch((erro) =>
          console.warn('[ArvoresService] Falha ao excluir foto do Storage (ignorada)', url, erro),
        ),
      ),
    );

    // Limite de 500 operações por batch: sobra folga para centenas de visitas por árvore.
    const batch = writeBatch(this.firestore);
    visitasSnap.docs.forEach((visita) => batch.delete(visita.ref));
    batch.delete(doc(this.firestore, 'arvores', arvore.id));
    await batch.commit();
  }

  /** Mínimo 2 fotos, no máximo 5 (uma por TipoFotoArvore); cada `arquivo` já deve vir comprimido pelo chamador. */
  async registrarArvore(
    dados: NovaArvoreInput,
    fotos: FotoParaEnviar[],
    lat: number,
    lng: number,
    precisaoGpsMetros: number | null,
  ): Promise<void> {
    const pessoa = await firstValueFrom(this.authService.currentPessoa$);
    if (!pessoa) {
      throw new Error('Usuário não autenticado.');
    }
    if (fotos.length < 2) {
      throw new Error('São necessárias ao menos 2 fotos.');
    }

    const docRef = doc(this.arvoresRef);
    const docId = docRef.id;

    const fotosEnviadas: FotoArvore[] = await Promise.all(
      fotos.map(async ({ arquivo, tipo }) => {
        const caminhoFoto = `arvores/${pessoa.uid}/${docId}/${tipo}.jpg`;
        const fotoRef = ref(this.storage, caminhoFoto);
        await uploadBytes(fotoRef, arquivo, { contentType: 'image/jpeg' });
        const url = await getDownloadURL(fotoRef);
        return { url, tipo };
      }),
    );

    const arvore: Omit<Arvore, 'id'> = {
      uid: pessoa.uid,
      fotos: fotosEnviadas,
      geoponto: new GeoPoint(lat, lng),
      precisaoGpsMetros,
      especie: dados.especie,
      especieCientifica: null,
      diametroCm: dados.diametroCm,
      estado: dados.estado,
      observacoes: dados.observacoes,
      enderecoReferencia: dados.enderecoReferencia,
      criadoEm: Timestamp.now(),
      status: 'pendente',
      moderacao: null,
      situacao: 'ativa',
      removidaEm: null,
      ultimaVisitaEm: null,
    };

    await setDoc(docRef, arvore);
  }

  listarVisitas$(arvoreId: string): Observable<VisitaArvore[]> {
    return collectionData(query(this.visitasRef(arvoreId), orderBy('data', 'desc')), {
      idField: 'id',
    }) as Observable<VisitaArvore[]>;
  }

  /**
   * Registra uma visita de monitoramento e reflete na árvore (estado atual ou remoção) num único batch.
   * Visitas não passam por moderação e são imutáveis depois de gravadas. `fotos` já devem vir comprimidas.
   */
  async registrarVisita(arvoreId: string, dados: NovaVisitaInput, fotos: File[]): Promise<void> {
    const pessoa = await firstValueFrom(this.authService.currentPessoa$);
    if (!pessoa) {
      throw new Error('Usuário não autenticado.');
    }

    const removida = dados.ocorrencias.includes('removida');
    if (fotos.length > MAXIMO_FOTOS_VISITA) {
      throw new Error(`No máximo ${MAXIMO_FOTOS_VISITA} fotos por visita.`);
    }
    if (removida && fotos.length < 1) {
      throw new Error('Registre ao menos uma foto do local para marcar a árvore como removida.');
    }
    const estadoObservado = removida ? null : dados.estadoObservado;
    if (!removida && !estadoObservado) {
      throw new Error('Informe o estado observado da árvore.');
    }

    const visitaRef = doc(this.visitasRef(arvoreId));
    const visitaId = visitaRef.id;

    const urlsFotos = await Promise.all(
      fotos.map(async (arquivo, indice) => {
        const fotoRef = ref(this.storage, `arvores-visitas/${arvoreId}/${visitaId}/${indice + 1}.jpg`);
        await uploadBytes(fotoRef, arquivo, { contentType: 'image/jpeg' });
        return getDownloadURL(fotoRef);
      }),
    );

    const agora = Timestamp.now();
    const visita: Omit<VisitaArvore, 'id'> = {
      uid: pessoa.uid,
      autorNome: pessoa.nomeExibicao?.trim() || pessoa.nomeCompleto,
      data: agora,
      estadoObservado,
      ocorrencias: dados.ocorrencias,
      observacoes: dados.observacoes,
      fotos: urlsFotos,
    };

    // Só os campos que as regras liberam para quem tem apenas podeRegistrarArvores.
    const atualizacaoArvore: Partial<Arvore> = removida
      ? { ultimaVisitaEm: agora, situacao: 'removida', removidaEm: agora }
      : { ultimaVisitaEm: agora, estado: estadoObservado! };

    const batch = writeBatch(this.firestore);
    batch.set(visitaRef, visita);
    batch.update(doc(this.firestore, 'arvores', arvoreId), atualizacaoArvore);
    await batch.commit();
  }

  private visitasRef(arvoreId: string) {
    return collection(this.firestore, 'arvores', arvoreId, 'visitas');
  }
}
