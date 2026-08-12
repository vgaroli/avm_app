import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../core/services/auth.service';
import { CardsService } from '../../core/services/cards.service';
import { EventosService } from '../../core/services/eventos.service';
import { Evento } from '../../core/models/evento.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatButtonModule, MatCardModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private readonly authService = inject(AuthService);
  private readonly cardsService = inject(CardsService);
  private readonly eventosService = inject(EventosService);
  private readonly router = inject(Router);

  readonly pessoa = toSignal(this.authService.currentPessoa$, { initialValue: null });
  readonly usuarioLogado = toSignal(this.authService.currentUser$, { initialValue: null });
  readonly cards = toSignal(this.cardsService.cardsVisiveis$, { initialValue: [] });
  readonly proximoEvento = toSignal(this.eventosService.proximoEvento$, { initialValue: null });

  abrirCard(rota: string): void {
    this.router.navigateByUrl(rota);
  }

  formatarDataEvento(evento: Evento): string {
    const data = new Date(evento.inicio);
    const opcoes: Intl.DateTimeFormatOptions = evento.diaTodo
      ? { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }
      : { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Intl.DateTimeFormat('pt-BR', opcoes).format(data);
  }
}
