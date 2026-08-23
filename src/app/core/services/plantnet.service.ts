import { Injectable, inject } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { FotoArvore, SugestaoEspecie } from '../models/arvore.model';

@Injectable({ providedIn: 'root' })
export class PlantnetService {
  private readonly functions = inject(Functions);

  async identificarEspecie(fotos: FotoArvore[]): Promise<SugestaoEspecie[]> {
    const chamada = httpsCallable<{ fotos: FotoArvore[] }, SugestaoEspecie[]>(this.functions, 'identificarEspecie');
    const resultado = await chamada({ fotos: fotos.map((foto) => ({ url: foto.url, tipo: foto.tipo })) });
    return resultado.data;
  }
}
