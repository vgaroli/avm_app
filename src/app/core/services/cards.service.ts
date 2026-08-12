import { Injectable, inject } from '@angular/core';
import { Firestore, addDoc, collection, collectionData, deleteDoc, doc, orderBy, query, updateDoc, where } from '@angular/fire/firestore';
import { Observable, combineLatest, map } from 'rxjs';
import { CardConfig, VisibilidadeCard } from '../models/card.model';
import { Pessoa } from '../models/pessoa.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class CardsService {
  private readonly firestore = inject(Firestore);
  private readonly authService = inject(AuthService);

  private readonly cardsRef = collection(this.firestore, 'cards');

  private readonly cards$: Observable<CardConfig[]> = collectionData(
    query(this.cardsRef, where('ativo', '==', true), orderBy('ordem')),
    { idField: 'id' },
  ) as Observable<CardConfig[]>;

  readonly cardsVisiveis$: Observable<CardConfig[]> = combineLatest([this.cards$, this.authService.currentPessoa$]).pipe(
    map(([cards, pessoa]) => cards.filter((card) => this.podeVer(card.visibilidade, pessoa))),
  );

  readonly todosCards$: Observable<CardConfig[]> = collectionData(query(this.cardsRef, orderBy('ordem')), {
    idField: 'id',
  }) as Observable<CardConfig[]>;

  async criar(card: Omit<CardConfig, 'id'>): Promise<void> {
    await addDoc(this.cardsRef, card);
  }

  async atualizar(id: string, dados: Partial<Omit<CardConfig, 'id'>>): Promise<void> {
    await updateDoc(doc(this.firestore, 'cards', id), dados);
  }

  async remover(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'cards', id));
  }

  private podeVer(visibilidade: VisibilidadeCard[], pessoa: Pessoa | null): boolean {
    const associadoAtivo = !!pessoa && pessoa.status === 'ativo' && (pessoa.papel === 'associado' || pessoa.papel === 'diretoria');
    const diretoriaAtiva = !!pessoa && pessoa.status === 'ativo' && pessoa.papel === 'diretoria';

    return visibilidade.some((nivel) => {
      if (nivel === 'publico') return true;
      if (nivel === 'associado') return associadoAtivo;
      if (nivel === 'diretoria') return diretoriaAtiva;
      return false;
    });
  }
}
