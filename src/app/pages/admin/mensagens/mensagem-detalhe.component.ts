import { Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { STATUS_MENSAGEM_COR, STATUS_MENSAGEM_LABEL, StatusMensagem } from '../../../core/models/mensagem.model';
import { Pessoa } from '../../../core/models/pessoa.model';
import { MensagensService } from '../../../core/services/mensagens.service';
import { PessoasService } from '../../../core/services/pessoas.service';
import { BackButtonComponent } from '../../../shared/components/back-button.component';

const STATUS_DISPONIVEIS: StatusMensagem[] = ['nova', 'em_analise', 'em_andamento', 'respondida', 'concluida'];

@Component({
  selector: 'app-mensagem-detalhe',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    BackButtonComponent,
  ],
  templateUrl: './mensagem-detalhe.component.html',
  styleUrl: './mensagem-detalhe.component.scss',
})
export class MensagemDetalheComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly mensagensService = inject(MensagensService);
  private readonly pessoasService = inject(PessoasService);
  private readonly fb = inject(FormBuilder);

  private readonly id = this.route.snapshot.paramMap.get('id')!;

  readonly statusDisponiveis = STATUS_DISPONIVEIS;
  readonly statusLabel = STATUS_MENSAGEM_LABEL;
  readonly statusCor = STATUS_MENSAGEM_COR;

  readonly mensagem = toSignal(this.mensagensService.obterMensagem$(this.id), { initialValue: undefined });
  readonly diretoria = toSignal(this.pessoasService.listarDiretoria(), { initialValue: [] as Pessoa[] });

  readonly processando = signal(false);
  readonly retornoForm = this.fb.nonNullable.group({ retorno: [''] });
  private retornoInicializado = false;

  constructor() {
    effect(() => {
      const mensagem = this.mensagem();
      if (mensagem && !this.retornoInicializado) {
        this.retornoForm.patchValue({ retorno: mensagem.retorno ?? '' });
        this.retornoInicializado = true;
      }
    });
  }

  async converterEmTarefa(): Promise<void> {
    this.processando.set(true);
    try {
      await this.mensagensService.atualizarMensagem(this.id, { isTarefa: true }, 'convertida_em_tarefa');
    } finally {
      this.processando.set(false);
    }
  }

  async alterarStatus(status: StatusMensagem): Promise<void> {
    this.processando.set(true);
    try {
      await this.mensagensService.atualizarMensagem(this.id, { status }, 'status_alterado', `Novo status: ${this.statusLabel[status]}`);
    } finally {
      this.processando.set(false);
    }
  }

  async alterarResponsavel(uid: string): Promise<void> {
    const pessoa = this.diretoria().find((p) => p.uid === uid) ?? null;
    this.processando.set(true);
    try {
      await this.mensagensService.atualizarMensagem(
        this.id,
        { responsavelUid: pessoa?.uid ?? null, responsavelNome: pessoa?.nomeCompleto ?? null },
        'responsavel_alterado',
        pessoa ? `Responsável: ${pessoa.nomeCompleto}` : 'Responsável removido',
      );
    } finally {
      this.processando.set(false);
    }
  }

  async salvarRetorno(): Promise<void> {
    const retorno = this.retornoForm.getRawValue().retorno.trim();
    if (!retorno) {
      return;
    }

    this.processando.set(true);
    try {
      await this.mensagensService.atualizarMensagem(this.id, { retorno }, 'retorno_adicionado');
    } finally {
      this.processando.set(false);
    }
  }

  formatarData(iso: string): string {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(
      new Date(iso),
    );
  }
}
