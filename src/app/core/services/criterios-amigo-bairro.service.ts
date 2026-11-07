import { Injectable, inject } from '@angular/core';
import { Firestore, addDoc, collection, collectionData, deleteDoc, doc, query, updateDoc, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { CriterioAmigoBairro, NovoCriterioAmigoBairroInput } from '../models/criterio-amigo-bairro.model';

@Injectable({ providedIn: 'root' })
export class CriteriosAmigoBairroService {
  private readonly firestore = inject(Firestore);
  private readonly criteriosRef = collection(this.firestore, 'criteriosAmigoBairro');

  readonly criteriosAtivos$: Observable<CriterioAmigoBairro[]> = collectionData(
    query(this.criteriosRef, where('ativo', '==', true)),
    { idField: 'id' },
  ) as Observable<CriterioAmigoBairro[]>;

  readonly todosCriterios$: Observable<CriterioAmigoBairro[]> = collectionData(this.criteriosRef, {
    idField: 'id',
  }) as Observable<CriterioAmigoBairro[]>;

  async criar(dados: NovoCriterioAmigoBairroInput): Promise<void> {
    const criterio: Omit<CriterioAmigoBairro, 'id'> = { ...dados, ativo: true };
    await addDoc(this.criteriosRef, criterio);
  }

  async atualizar(id: string, dados: Partial<Omit<CriterioAmigoBairro, 'id'>>): Promise<void> {
    await updateDoc(doc(this.firestore, 'criteriosAmigoBairro', id), dados);
  }

  async remover(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'criteriosAmigoBairro', id));
  }
}
