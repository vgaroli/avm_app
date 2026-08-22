import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { Mensagem, STATUS_MENSAGEM_COR, STATUS_MENSAGEM_LABEL, StatusMensagem } from '../../../core/models/mensagem.model';
import { Pessoa } from '../../../core/models/pessoa.model';
import { MensagensService } from '../../../core/services/mensagens.service';
import { PessoasService } from '../../../core/services/pessoas.service';
import { BackButtonComponent } from '../../../shared/components/back-button.component';

const STATUS_DISPONIVEIS: StatusMensagem[] = ['nova', 'em_analise', 'em_andamento', 'respondida', 'concluida'];

@Component({
  selector: 'app-admin-mensagens',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatSelectModule, BackButtonComponent],
  templateUrl: './admin-mensagens.component.html',
  styleUrl: './admin-mensagens.component.scss',
})
export class AdminMensagensComponent {
  private readonly mensagensService = inject(MensagensService);
  private readonly pessoasService = inject(PessoasService);
  private readonly router = inject(Router);

  readonly statusDisponiveis = STATUS_DISPONIVEIS;
  readonly statusLabel = STATUS_MENSAGEM_LABEL;
  readonly statusCor = STATUS_MENSAGEM_COR;

  readonly mensagens = toSignal(this.mensagensService.listarTodasMensagens$, { initialValue: [] as Mensagem[] });
  readonly diretoria = toSignal(this.pessoasService.listarDiretoria(), { initialValue: [] as Pessoa[] });

  readonly filtroStatus = signal<StatusMensagem | 'todos'>('todos');
  readonly filtroResponsavel = signal<string | 'todos'>('todos');

  readonly mensagensFiltradas = computed(() => {
    const status = this.filtroStatus();
    const responsavel = this.filtroResponsavel();
    return this.mensagens().filter((mensagem) => {
      const passaStatus = status === 'todos' || mensagem.status === status;
      const passaResponsavel = responsavel === 'todos' || mensagem.responsavelUid === responsavel;
      return passaStatus && passaResponsavel;
    });
  });

  abrirDetalhe(mensagem: Mensagem): void {
    this.router.navigateByUrl(`/admin/mensagens/${mensagem.id}`);
  }

  formatarData(iso: string): string {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(
      new Date(iso),
    );
  }
}
