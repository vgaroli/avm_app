import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ArvoresService } from '../../../core/services/arvores.service';
import { ESTADO_ARVORE_LABEL } from '../../../core/models/arvore.model';
import { BackButtonComponent } from '../../../shared/components/back-button.component';
import { MapaArvoresComponent } from '../../../shared/components/mapa-arvores/mapa-arvores.component';

type ModoVisualizacao = 'grid' | 'mapa';

@Component({
  selector: 'app-arvore-lista',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, BackButtonComponent, MapaArvoresComponent],
  templateUrl: './arvore-lista.component.html',
  styleUrl: './arvore-lista.component.scss',
})
export class ArvoreListaComponent {
  private readonly arvoresService = inject(ArvoresService);
  private readonly route = inject(ActivatedRoute);

  protected readonly ESTADO_ARVORE_LABEL = ESTADO_ARVORE_LABEL;
  readonly arvores$ = this.arvoresService.listarTodas$;

  readonly arvoreDestacadaId = this.route.snapshot.queryParamMap.get('destacar') ?? undefined;
  readonly modo = signal<ModoVisualizacao>(
    this.route.snapshot.data['modoMapa'] || this.arvoreDestacadaId ? 'mapa' : 'grid',
  );

  definirModo(modo: ModoVisualizacao): void {
    this.modo.set(modo);
  }
}
