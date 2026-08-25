import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { EstabelecimentoPublico } from '../../../core/models/estabelecimento.model';
import { EstabelecimentosService } from '../../../core/services/estabelecimentos.service';
import { distanciaMetros, formatarDistancia } from '../../../core/utils/distancia.util';

@Component({
  selector: 'app-amigos-do-bairro-lista',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './amigos-do-bairro-lista.component.html',
  styleUrl: './amigos-do-bairro-lista.component.scss',
})
export class AmigosDoBairroListaComponent {
  private readonly estabelecimentosService = inject(EstabelecimentosService);
  private readonly router = inject(Router);

  readonly estabelecimentos = toSignal(this.estabelecimentosService.listarPublicosOrdenados$(), {
    initialValue: [] as EstabelecimentoPublico[],
  });

  readonly busca = signal('');
  readonly posicaoUsuario = signal<{ lat: number; lng: number } | null>(null);

  constructor() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (posicao) => this.posicaoUsuario.set({ lat: posicao.coords.latitude, lng: posicao.coords.longitude }),
        () => this.posicaoUsuario.set(null),
      );
    }
  }

  readonly estabelecimentosExibidos = computed(() => {
    const termo = this.busca().trim().toLowerCase();
    const filtrados = this.estabelecimentos().filter(
      (estabelecimento) =>
        !termo || estabelecimento.nome.toLowerCase().includes(termo) || estabelecimento.categoria.toLowerCase().includes(termo),
    );

    const posicao = this.posicaoUsuario();
    if (!posicao) {
      return filtrados;
    }

    return [...filtrados].sort(
      (a, b) =>
        distanciaMetros(posicao.lat, posicao.lng, a.geoponto.latitude, a.geoponto.longitude) -
        distanciaMetros(posicao.lat, posicao.lng, b.geoponto.latitude, b.geoponto.longitude),
    );
  });

  distanciaDe(estabelecimento: EstabelecimentoPublico): string | null {
    const posicao = this.posicaoUsuario();
    if (!posicao) {
      return null;
    }
    const metros = distanciaMetros(
      posicao.lat,
      posicao.lng,
      estabelecimento.geoponto.latitude,
      estabelecimento.geoponto.longitude,
    );
    return formatarDistancia(metros);
  }

  abrirSelo(estabelecimento: EstabelecimentoPublico): void {
    this.router.navigateByUrl(`/amigo/${estabelecimento.tokenPublico}`);
  }
}
