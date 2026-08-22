import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { Evento } from '../../core/models/evento.model';
import { EventosService } from '../../core/services/eventos.service';
import { formatarDataEvento } from '../../core/utils/evento-data.util';
import { BackButtonComponent } from '../../shared/components/back-button.component';

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatIconModule, MatSelectModule, BackButtonComponent],
  templateUrl: './agenda.component.html',
  styleUrl: './agenda.component.scss',
})
export class AgendaComponent {
  private readonly eventosService = inject(EventosService);

  readonly opcoesMeses = [2, 3, 5, 6];
  readonly mesesSelecionados = signal(2);

  private readonly eventos = toSignal(this.eventosService.proximosEventos$, { initialValue: [] as Evento[] });

  readonly eventosFiltrados = computed(() => {
    const limite = new Date();
    limite.setMonth(limite.getMonth() + this.mesesSelecionados());
    return this.eventos().filter((evento) => new Date(evento.inicio) <= limite);
  });

  protected readonly formatarDataEvento = formatarDataEvento;

  localOuDescricao(evento: Evento): string {
    return evento.local || evento.descricao || '';
  }
}
