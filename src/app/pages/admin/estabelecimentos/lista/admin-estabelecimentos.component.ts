import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import {
  Estabelecimento,
  STATUS_ESTABELECIMENTO_COR,
  STATUS_ESTABELECIMENTO_LABEL,
  StatusEstabelecimento,
} from '../../../../core/models/estabelecimento.model';
import { EstabelecimentosService } from '../../../../core/services/estabelecimentos.service';
import { BackButtonComponent } from '../../../../shared/components/back-button.component';

const STATUS_DISPONIVEIS: StatusEstabelecimento[] = ['pendente', 'aprovado', 'reprovado'];

@Component({
  selector: 'app-admin-estabelecimentos',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    BackButtonComponent,
  ],
  templateUrl: './admin-estabelecimentos.component.html',
  styleUrl: './admin-estabelecimentos.component.scss',
})
export class AdminEstabelecimentosComponent {
  private readonly estabelecimentosService = inject(EstabelecimentosService);
  private readonly router = inject(Router);

  readonly statusDisponiveis = STATUS_DISPONIVEIS;
  readonly statusLabel = STATUS_ESTABELECIMENTO_LABEL;
  readonly statusCor = STATUS_ESTABELECIMENTO_COR;

  readonly estabelecimentos = toSignal(this.estabelecimentosService.listarTodos$, {
    initialValue: [] as Estabelecimento[],
  });
  readonly filtroStatus = signal<StatusEstabelecimento | 'todos'>('todos');

  readonly estabelecimentosFiltrados = computed(() => {
    const status = this.filtroStatus();
    return this.estabelecimentos().filter((estabelecimento) => status === 'todos' || estabelecimento.status === status);
  });

  abrirNovo(): void {
    this.router.navigateByUrl('/admin/estabelecimentos/novo');
  }

  abrirDetalhe(estabelecimento: Estabelecimento): void {
    this.router.navigateByUrl(`/admin/estabelecimentos/${estabelecimento.id}`);
  }

  formatarData(iso: string): string {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));
  }
}
