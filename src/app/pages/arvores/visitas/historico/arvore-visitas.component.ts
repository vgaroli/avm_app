import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { map } from 'rxjs';
import { ArvoresService } from '../../../../core/services/arvores.service';
import {
  ESTADO_ARVORE_LABEL,
  SITUACAO_ARVORE_LABEL,
  TIPO_OCORRENCIA_LABEL,
} from '../../../../core/models/arvore.model';
import { obterFotoPrincipal, obterSituacaoArvore } from '../../../../core/utils/arvore-foto.util';
import { BackButtonComponent } from '../../../../shared/components/back-button.component';

@Component({
  selector: 'app-arvore-visitas',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatCardModule, MatIconModule, BackButtonComponent],
  templateUrl: './arvore-visitas.component.html',
  styleUrl: './arvore-visitas.component.scss',
})
export class ArvoreVisitasComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly arvoresService = inject(ArvoresService);

  readonly id = this.route.snapshot.paramMap.get('id')!;

  protected readonly ESTADO_ARVORE_LABEL = ESTADO_ARVORE_LABEL;
  protected readonly SITUACAO_ARVORE_LABEL = SITUACAO_ARVORE_LABEL;
  protected readonly TIPO_OCORRENCIA_LABEL = TIPO_OCORRENCIA_LABEL;

  /** undefined = carregando; null = não encontrada. */
  readonly arvore = toSignal(this.arvoresService.obterArvore$(this.id).pipe(map((arvore) => arvore ?? null)));
  readonly visitas = toSignal(this.arvoresService.listarVisitas$(this.id));

  readonly fotoPrincipal = computed(() => {
    const arvore = this.arvore();
    return arvore ? obterFotoPrincipal(arvore) : null;
  });
  readonly situacao = computed(() => {
    const arvore = this.arvore();
    return arvore ? obterSituacaoArvore(arvore) : 'ativa';
  });
}
