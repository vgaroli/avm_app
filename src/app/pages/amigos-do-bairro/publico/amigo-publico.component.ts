import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { EstabelecimentoPublico } from '../../../core/models/estabelecimento.model';
import { EstabelecimentosService } from '../../../core/services/estabelecimentos.service';

@Component({
  selector: 'app-amigo-publico',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatIconModule],
  templateUrl: './amigo-publico.component.html',
  styleUrl: './amigo-publico.component.scss',
})
export class AmigoPublicoComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly estabelecimentosService = inject(EstabelecimentosService);

  readonly carregando = signal(true);
  readonly estabelecimento = signal<EstabelecimentoPublico | null>(null);

  async ngOnInit(): Promise<void> {
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) {
      this.carregando.set(false);
      return;
    }

    try {
      const encontrado = await this.estabelecimentosService.buscarPorToken(token);
      this.estabelecimento.set(encontrado ?? null);
    } catch (erro) {
      console.error('[AmigoPublico] Falha ao buscar o selo', erro);
      this.estabelecimento.set(null);
    } finally {
      this.carregando.set(false);
    }
  }

  formatarData(iso: string): string {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));
  }
}
