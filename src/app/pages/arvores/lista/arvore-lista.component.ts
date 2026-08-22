import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ArvoresService } from '../../../core/services/arvores.service';
import { ESTADO_ARVORE_LABEL } from '../../../core/models/arvore.model';
import { BackButtonComponent } from '../../../shared/components/back-button.component';

@Component({
  selector: 'app-arvore-lista',
  standalone: true,
  imports: [CommonModule, RouterLink, BackButtonComponent],
  templateUrl: './arvore-lista.component.html',
  styleUrl: './arvore-lista.component.scss',
})
export class ArvoreListaComponent {
  private readonly arvoresService = inject(ArvoresService);

  protected readonly ESTADO_ARVORE_LABEL = ESTADO_ARVORE_LABEL;
  readonly arvores$ = this.arvoresService.listarTodas$;
}
