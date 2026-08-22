import { Injectable, inject } from '@angular/core';
import { Firestore, doc, docData, setDoc } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { Credencial } from '../models/credencial.model';

@Injectable({ providedIn: 'root' })
export class CredenciaisService {
  private readonly firestore = inject(Firestore);

  // fotoUrl fica vazia até a funcionalidade de upload de foto no perfil existir;
  // os componentes exibem um avatar com as iniciais do nome nesse caso.
  buscarPorId(uid: string): Observable<Credencial | null> {
    const credencialRef = doc(this.firestore, 'credenciais', uid);
    return (docData(credencialRef) as Observable<Credencial | undefined>).pipe(map((credencial) => credencial ?? null));
  }

  async sincronizar(uid: string, dados: Partial<Credencial>): Promise<void> {
    const credencialRef = doc(this.firestore, 'credenciais', uid);
    await setDoc(credencialRef, dados, { merge: true });
  }
}
