import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  GeoPoint,
  Timestamp,
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  docData,
  orderBy,
  query,
  updateDoc,
} from '@angular/fire/firestore';
import { Storage, deleteObject, getDownloadURL, ref, uploadBytes } from '@angular/fire/storage';
import { Observable, firstValueFrom } from 'rxjs';
import { Arvore, NovaArvoreInput } from '../models/arvore.model';
import { AuthService } from './auth.service';

export interface AtualizacaoArvore {
  especie: string | null;
  diametroCm: number | null;
  estado: Arvore['estado'];
  observacoes: string;
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

  async excluirArvore(arvore: Arvore): Promise<void> {
    await deleteObject(ref(this.storage, arvore.fotoUrl));
    await deleteDoc(doc(this.firestore, 'arvores', arvore.id));
  }

  async registrarArvore(dados: NovaArvoreInput, foto: File, lat: number, lng: number): Promise<void> {
    const pessoa = await firstValueFrom(this.authService.currentPessoa$);
    if (!pessoa) {
      throw new Error('Usuário não autenticado.');
    }

    const caminhoFoto = `arvores/${pessoa.uid}/${Date.now()}.jpg`;
    const fotoRef = ref(this.storage, caminhoFoto);
    await uploadBytes(fotoRef, foto);
    const fotoUrl = await getDownloadURL(fotoRef);

    const arvore: Omit<Arvore, 'id'> = {
      uid: pessoa.uid,
      fotoUrl,
      geoponto: new GeoPoint(lat, lng),
      especie: dados.especie,
      diametroCm: dados.diametroCm,
      estado: dados.estado,
      observacoes: dados.observacoes,
      criadoEm: Timestamp.now(),
      status: 'pendente',
    };

    await addDoc(this.arvoresRef, arvore);
  }
}
