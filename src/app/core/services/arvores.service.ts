import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  GeoPoint,
  Timestamp,
  collection,
  collectionData,
  deleteDoc,
  doc,
  docData,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { Storage, deleteObject, getDownloadURL, ref, uploadBytes } from '@angular/fire/storage';
import { Observable, firstValueFrom } from 'rxjs';
import { Arvore, FotoArvore, ModeracaoArvoreInput, NovaArvoreInput, SugestaoEspecie, TipoFotoArvore } from '../models/arvore.model';
import { obterFotosArvore } from '../utils/arvore-foto.util';
import { AuthService } from './auth.service';

export interface AtualizacaoArvore {
  especie: string | null;
  diametroCm: number | null;
  estado: Arvore['estado'];
  observacoes: string;
}

export interface FotoParaEnviar {
  arquivo: File; // já comprimido pelo chamador
  tipo: TipoFotoArvore;
}

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

  async excluirArvore(arvore: Arvore): Promise<void> {
    const fotos = obterFotosArvore(arvore);
    await Promise.all(
      fotos.map((foto) =>
        deleteObject(ref(this.storage, foto.url)).catch((erro) =>
          console.warn('[ArvoresService] Falha ao excluir foto do Storage (ignorada)', foto.url, erro),
        ),
      ),
    );
    await deleteDoc(doc(this.firestore, 'arvores', arvore.id));
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
      criadoEm: Timestamp.now(),
      status: 'pendente',
      moderacao: null,
    };

    await setDoc(docRef, arvore);
  }
}
