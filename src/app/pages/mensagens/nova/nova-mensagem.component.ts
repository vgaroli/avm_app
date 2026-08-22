import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MensagensService } from '../../../core/services/mensagens.service';
import { BackButtonComponent } from '../../../shared/components/back-button.component';

@Component({
  selector: 'app-nova-mensagem',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, BackButtonComponent],
  templateUrl: './nova-mensagem.component.html',
  styleUrl: './nova-mensagem.component.scss',
})
export class NovaMensagemComponent {
  private readonly fb = inject(FormBuilder);
  private readonly mensagensService = inject(MensagensService);
  private readonly router = inject(Router);

  readonly enviando = signal(false);
  readonly erro = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    assunto: ['', Validators.required],
    texto: ['', Validators.required],
  });

  async enviar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.erro.set(null);
    try {
      await this.mensagensService.enviarMensagem(this.form.getRawValue());
      this.router.navigateByUrl('/mensagens');
    } catch {
      this.erro.set('Não foi possível enviar sua mensagem. Tente novamente.');
    } finally {
      this.enviando.set(false);
    }
  }
}
