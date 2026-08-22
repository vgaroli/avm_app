import { Component, ElementRef, Injector, inject, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../core/services/auth.service';
import { CardsService } from '../../core/services/cards.service';
import { EventosService } from '../../core/services/eventos.service';
import { formatarDataEvento } from '../../core/utils/evento-data.util';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatButtonModule, MatCardModule, MatMenuModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private readonly authService = inject(AuthService);
  private readonly cardsService = inject(CardsService);
  private readonly eventosService = inject(EventosService);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);

  private readonly conteudo = viewChild<ElementRef<HTMLElement>>('conteudo');

  readonly pessoa = toSignal(this.authService.currentPessoa$, { initialValue: null });
  readonly usuarioLogado = toSignal(this.authService.currentUser$, { initialValue: null });
  readonly cards = toSignal(this.cardsService.cardsVisiveis$, { initialValue: [] });
  readonly proximoEvento = toSignal(this.eventosService.proximoEvento$, { initialValue: null });
  protected readonly appVersion = environment.version;
  protected readonly formatarDataEvento = formatarDataEvento;

  abrirCard(rota: string): void {
    this.router.navigateByUrl(rota);
  }

  async sair(): Promise<void> {
    await this.authService.logout();
    this.router.navigateByUrl('/login');
  }

  irParaInicio(): void {
    this.conteudo()?.nativeElement.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // MatSnackBar carrega o overlay do CDK sob demanda, então só vale a pena
  // baixar quando o usuário realmente clica em "Avisos" (mesmo padrão de app.ts).
  async avisosEmBreve(): Promise<void> {
    const { MatSnackBar } = await import('@angular/material/snack-bar');
    const snackBar = this.injector.get(MatSnackBar);
    snackBar.open('Em breve', 'Ok', { duration: 3000 });
  }
}
