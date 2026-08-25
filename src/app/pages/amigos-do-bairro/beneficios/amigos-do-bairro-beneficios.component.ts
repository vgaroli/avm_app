import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { EstabelecimentoPublico } from '../../../core/models/estabelecimento.model';
import { EstabelecimentosService } from '../../../core/services/estabelecimentos.service';

@Component({
  selector: 'app-amigos-do-bairro-beneficios',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatIconModule],
  templateUrl: './amigos-do-bairro-beneficios.component.html',
  styleUrl: './amigos-do-bairro-beneficios.component.scss',
})
export class AmigosDoBairroBeneficiosComponent {
  private readonly estabelecimentosService = inject(EstabelecimentosService);
  private readonly router = inject(Router);

  readonly estabelecimentos = toSignal(
    this.estabelecimentosService
      .listarPublicosOrdenados$()
      .pipe(map((lista) => lista.filter((estabelecimento) => !!estabelecimento.beneficioAssociado))),
    { initialValue: [] as EstabelecimentoPublico[] },
  );

  abrirSelo(estabelecimento: EstabelecimentoPublico): void {
    this.router.navigateByUrl(`/amigo/${estabelecimento.tokenPublico}`);
  }
}
