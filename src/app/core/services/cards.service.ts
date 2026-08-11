import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, orderBy, query, where } from '@angular/fire/firestore';
import { Observable, combineLatest, map } from 'rxjs';
import { CardConfig, VisibilidadeCard } from '../models/card.model';
import { Pessoa } from '../models/pessoa.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class CardsService {
  private readonly firestore = inject(Firestore);
  private readonly authService = inject(AuthService);

  private readonly cards$: Observable<CardConfig[]> = collectionData(
    query(collection(this.firestore, 'cards'), where('ativo', '==', true), orderBy('ordem')),
    { idField: 'id' },
  ) as Observable<CardConfig[]>;

  readonly cardsVisiveis$: Observable<CardConfig[]> = combineLatest([this.cards$, this.authService.currentPessoa$]).pipe(
    map(([cards, pessoa]) => cards.filter((card) => this.podeVer(card.visibilidade, pessoa))),
  );

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
