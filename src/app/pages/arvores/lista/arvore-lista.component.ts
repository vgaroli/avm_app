import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { firstValueFrom, map } from 'rxjs';
import { ArvoresService } from '../../../core/services/arvores.service';
import { AuthService } from '../../../core/services/auth.service';
import { ESTADO_ARVORE_LABEL } from '../../../core/models/arvore.model';
import { obterFotoPrincipal, obterSituacaoArvore } from '../../../core/utils/arvore-foto.util';
import { BackButtonComponent } from '../../../shared/components/back-button.component';
import { MapaArvoresComponent } from '../../../shared/components/mapa-arvores/mapa-arvores.component';

type ModoVisualizacao = 'grid' | 'mapa';

@Component({
  selector: 'app-arvore-lista',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    BackButtonComponent,
    MapaArvoresComponent,
  ],
  templateUrl: './arvore-lista.component.html',
  styleUrl: './arvore-lista.component.scss',
})
export class ArvoreListaComponent {
  private readonly arvoresService = inject(ArvoresService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  protected readonly ESTADO_ARVORE_LABEL = ESTADO_ARVORE_LABEL;
  protected readonly obterFotoPrincipal = obterFotoPrincipal;
  protected readonly obterSituacaoArvore = obterSituacaoArvore;

  private readonly arvores = toSignal(this.arvoresService.listarTodas$);

  readonly isDiretoria = toSignal(
    this.authService.currentPessoa$.pipe(map((pessoa) => pessoa?.status === 'ativo' && pessoa.papel === 'diretoria')),
    { initialValue: false },
  );

  readonly mostrarRemovidas = signal(false);

  readonly arvoresVisiveis = computed(() => {
    const arvores = this.arvores();
    if (!arvores) {
      return undefined;
    }
    return this.mostrarRemovidas() ? arvores : arvores.filter((arvore) => obterSituacaoArvore(arvore) !== 'removida');
  });

  readonly arvoreDestacadaId = this.route.snapshot.queryParamMap.get('destacar') ?? undefined;
  readonly modo = signal<ModoVisualizacao>(
    this.route.snapshot.data['modoMapa'] || this.arvoreDestacadaId ? 'mapa' : 'grid',
  );

  constructor() {
    // Se a árvore destacada (ex.: "Ver no mapa") estiver removida, ela ficaria escondida pelo filtro padrão.
    const destacadaId = this.arvoreDestacadaId;
    if (destacadaId) {
      void firstValueFrom(this.arvoresService.listarTodas$).then((arvores) => {
        const destacada = arvores.find((arvore) => arvore.id === destacadaId);
        if (destacada && obterSituacaoArvore(destacada) === 'removida') {
          this.mostrarRemovidas.set(true);
        }
      });
    }
  }

  definirModo(modo: ModoVisualizacao): void {
    this.modo.set(modo);
  }
}
