import { Component, ViewEncapsulation, computed, effect, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LeafletModule } from '@bluehalo/ngx-leaflet';
import * as L from 'leaflet';
import { Arvore, ESTADO_ARVORE_LABEL } from '../../../core/models/arvore.model';

const ZOOM_PADRAO = 15;
const ZOOM_DESTAQUE = 17;
const CENTRO_PADRAO = L.latLng(-23.5893, -46.6339);

@Component({
  selector: 'app-mapa-arvores',
  standalone: true,
  imports: [LeafletModule],
  templateUrl: './mapa-arvores.component.html',
  styleUrl: './mapa-arvores.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class MapaArvoresComponent {
  readonly arvores = input<Arvore[]>([]);
  readonly arvoreDestacadaId = input<string>();

  private readonly camadaBase = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  });

  private readonly mapa = signal<L.Map | null>(null);
  private marcadoresPorId = new Map<string, L.Marker>();

  readonly arvoresComLocalizacao = computed(() => this.arvores().filter((arvore) => !!arvore.geoponto));

  readonly camadasMarcadores = signal<L.Layer[]>([]);

  readonly camadas = computed<L.Layer[]>(() => [this.camadaBase, ...this.camadasMarcadores()]);

  readonly centroMapa = computed<L.LatLng>(() => {
    const destacada = this.arvoresComLocalizacao().find((arvore) => arvore.id === this.arvoreDestacadaId());
    if (destacada) {
      return L.latLng(destacada.geoponto.latitude, destacada.geoponto.longitude);
    }
    const primeira = this.arvoresComLocalizacao()[0];
    return primeira ? L.latLng(primeira.geoponto.latitude, primeira.geoponto.longitude) : CENTRO_PADRAO;
  });

  readonly zoomMapa = computed(() => (this.arvoreDestacadaId() ? ZOOM_DESTAQUE : ZOOM_PADRAO));

  constructor(private readonly router: Router) {
    effect(() => {
      const marcadoresPorId = new Map<string, L.Marker>();
      const camadas = this.arvoresComLocalizacao().map((arvore) => {
        const marcador = this.criarMarcador(arvore);
        marcadoresPorId.set(arvore.id, marcador);
        return marcador;
      });
      this.marcadoresPorId = marcadoresPorId;
      this.camadasMarcadores.set(camadas);
    });

    effect(() => {
      const id = this.arvoreDestacadaId();
      const mapaPronto = this.mapa();
      this.camadasMarcadores();
      if (!id || !mapaPronto) {
        return;
      }
      const marcador = this.marcadoresPorId.get(id);
      if (marcador) {
        setTimeout(() => marcador.openPopup());
      }
    });
  }

  aoMapaPronto(mapa: L.Map): void {
    this.mapa.set(mapa);
  }

  private criarMarcador(arvore: Arvore): L.Marker {
    const posicao = L.latLng(arvore.geoponto.latitude, arvore.geoponto.longitude);
    const icone = L.divIcon({
      className: 'marcador-arvore',
      html: `<span class="pino pino-${arvore.estado}"></span>`,
      iconSize: [26, 36],
      iconAnchor: [13, 36],
      popupAnchor: [0, -32],
    });

    const marcador = L.marker(posicao, { icon: icone });
    marcador.bindPopup(this.criarConteudoPopup(arvore));
    return marcador;
  }

  private criarConteudoPopup(arvore: Arvore): HTMLElement {
    const container = document.createElement('div');
    container.className = 'popup-arvore';

    const img = document.createElement('img');
    img.src = arvore.fotoUrl;
    img.alt = arvore.especie ?? 'Árvore sem espécie identificada';
    container.appendChild(img);

    const especie = document.createElement('strong');
    especie.textContent = arvore.especie ?? 'Não identificada';
    container.appendChild(especie);

    const badge = document.createElement('span');
    badge.className = `badge badge-${arvore.estado}`;
    badge.textContent = ESTADO_ARVORE_LABEL[arvore.estado];
    container.appendChild(badge);

    const link = document.createElement('a');
    link.className = 'link-editar';
    link.textContent = 'Editar';
    link.href = `/arvores/${arvore.id}/editar`;
    link.addEventListener('click', (evento) => {
      evento.preventDefault();
      this.router.navigate(['/arvores', arvore.id, 'editar']);
    });
    container.appendChild(link);

    return container;
  }
}
