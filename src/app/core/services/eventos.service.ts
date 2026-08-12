import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, orderBy, query, where } from '@angular/fire/firestore';
import { Observable, combineLatest, map, switchMap } from 'rxjs';
import { Evento } from '../models/evento.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class EventosService {
  private readonly firestore = inject(Firestore);
  private readonly authService = inject(AuthService);
  private readonly eventosRef = collection(this.firestore, 'eventos');

  private readonly eventosPublicos$: Observable<Evento[]> = collectionData(
    query(this.eventosRef, where('visibilidade', '==', 'publico'), orderBy('inicio')),
    { idField: 'id' },
  ) as Observable<Evento[]>;

  private readonly eventosDiretoria$: Observable<Evento[]> = collectionData(
    query(this.eventosRef, where('visibilidade', '==', 'diretoria'), orderBy('inicio')),
    { idField: 'id' },
  ) as Observable<Evento[]>;

  readonly proximosEventos$: Observable<Evento[]> = this.authService.currentPessoa$.pipe(
    switchMap((pessoa) => {
      const ehDiretoria = !!pessoa && pessoa.status === 'ativo' && pessoa.papel === 'diretoria';
      if (!ehDiretoria) {
        return this.eventosPublicos$;
      }
      return combineLatest([this.eventosPublicos$, this.eventosDiretoria$]).pipe(
        map(([publicos, diretoria]) => [...publicos, ...diretoria].sort((a, b) => a.inicio.localeCompare(b.inicio))),
      );
    }),
  );

  readonly proximoEvento$: Observable<Evento | null> = this.proximosEventos$.pipe(map((eventos) => eventos[0] ?? null));
}
