import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Mensagem, STATUS_MENSAGEM_COR, STATUS_MENSAGEM_LABEL } from '../../../core/models/mensagem.model';
import { MensagensService } from '../../../core/services/mensagens.service';
import { BackButtonComponent } from '../../../shared/components/back-button.component';

@Component({
  selector: 'app-minhas-mensagens',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatCardModule, MatIconModule, BackButtonComponent],
  templateUrl: './minhas-mensagens.component.html',
  styleUrl: './minhas-mensagens.component.scss',
})
export class MinhasMensagensComponent {
  private readonly mensagensService = inject(MensagensService);

  readonly mensagens = toSignal(this.mensagensService.listarMinhasMensagens$(), { initialValue: [] as Mensagem[] });

  readonly statusLabel = STATUS_MENSAGEM_LABEL;
  readonly statusCor = STATUS_MENSAGEM_COR;

  formatarData(iso: string): string {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(
      new Date(iso),
    );
  }
}
