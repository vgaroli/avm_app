import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../core/services/auth.service';
import { CardsService } from '../../core/services/cards.service';

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
  private readonly router = inject(Router);

  readonly pessoa = toSignal(this.authService.currentPessoa$, { initialValue: null });
  readonly usuarioLogado = toSignal(this.authService.currentUser$, { initialValue: null });
  readonly cards = toSignal(this.cardsService.cardsVisiveis$, { initialValue: [] });

  nextEvent = {
    title: 'Reunião mensal',
    date: '13 de maio, 19:00',
    location: 'Sede da AVM',
  };

  abrirCard(rota: string): void {
    this.router.navigateByUrl(rota);
  }
}
