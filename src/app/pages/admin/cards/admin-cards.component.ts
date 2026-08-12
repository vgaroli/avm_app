import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CardConfig, VisibilidadeCard } from '../../../core/models/card.model';
import { CardsService } from '../../../core/services/cards.service';
import { BackButtonComponent } from '../../../shared/components/back-button.component';

const CORES_DISPONIVEIS = ['card-primary', 'card-accent', 'card-info', 'card-warning', 'card-success', 'card-danger', 'card-secondary'];
const VISIBILIDADES_DISPONIVEIS: VisibilidadeCard[] = ['publico', 'associado', 'diretoria'];

@Component({
  selector: 'app-admin-cards',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    BackButtonComponent,
  ],
  templateUrl: './admin-cards.component.html',
  styleUrl: './admin-cards.component.scss',
})
export class AdminCardsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly cardsService = inject(CardsService);

  readonly cores = CORES_DISPONIVEIS;
  readonly visibilidades = VISIBILIDADES_DISPONIVEIS;

  readonly cards = toSignal(this.cardsService.todosCards$, { initialValue: [] as CardConfig[] });
  readonly processando = signal<string | null>(null);
  readonly editandoId = signal<string | null>(null);
  readonly mostrarFormNovo = signal(false);

  readonly novoForm = this.criarForm();
  readonly editForm = this.criarForm();

  private criarForm() {
    return this.fb.nonNullable.group({
      ordem: [0, [Validators.required, Validators.min(0)]],
      icon: ['', Validators.required],
      title: ['', Validators.required],
      info: ['', Validators.required],
      colorClass: ['card-primary', Validators.required],
      rota: ['', Validators.required],
      visibilidade: this.fb.nonNullable.control<VisibilidadeCard[]>(['publico'], Validators.required),
      ativo: [true],
    });
  }

  abrirNovo(): void {
    this.novoForm.reset({ ordem: this.cards().length, icon: '', title: '', info: '', colorClass: 'card-primary', rota: '', visibilidade: ['publico'], ativo: true });
    this.mostrarFormNovo.set(true);
  }

  cancelarNovo(): void {
    this.mostrarFormNovo.set(false);
  }

  async salvarNovo(): Promise<void> {
    if (this.novoForm.invalid) {
      this.novoForm.markAllAsTouched();
      return;
    }

    this.processando.set('novo');
    try {
      await this.cardsService.criar(this.novoForm.getRawValue());
      this.mostrarFormNovo.set(false);
    } finally {
      this.processando.set(null);
    }
  }

  iniciarEdicao(card: CardConfig): void {
    this.editandoId.set(card.id);
    // patchValue (não setValue) porque documentos criados/editados manualmente no Console
    // podem ter campos ausentes ou com nome digitado errado; setValue lança exceção nesse
    // caso e deixa o formulário com valores obsoletos, sem preencher nada.
    this.editForm.patchValue({
      ordem: card.ordem ?? 0,
      icon: card.icon ?? '',
      title: card.title ?? '',
      info: card.info ?? '',
      colorClass: card.colorClass ?? 'card-primary',
      rota: card.rota ?? '',
      visibilidade: card.visibilidade ?? ['publico'],
      ativo: card.ativo ?? true,
    });
  }

  cancelarEdicao(): void {
    this.editandoId.set(null);
  }

  async salvarEdicao(card: CardConfig): Promise<void> {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.processando.set(card.id);
    try {
      await this.cardsService.atualizar(card.id, this.editForm.getRawValue());
      this.editandoId.set(null);
    } finally {
      this.processando.set(null);
    }
  }

  async alternarAtivo(card: CardConfig): Promise<void> {
    this.processando.set(card.id);
    try {
      await this.cardsService.atualizar(card.id, { ativo: !card.ativo });
    } finally {
      this.processando.set(null);
    }
  }

  async remover(card: CardConfig): Promise<void> {
    this.processando.set(card.id);
    try {
      await this.cardsService.remover(card.id);
    } finally {
      this.processando.set(null);
    }
  }
}
