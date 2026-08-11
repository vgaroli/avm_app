import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { CpfMaskDirective } from '../../shared/directives/cpf-mask.directive';
import { cpfValido } from '../../core/utils/cpf.util';

@Component({
  selector: 'app-inscricao',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    CpfMaskDirective,
  ],
  templateUrl: './inscricao.component.html',
  styleUrl: './inscricao.component.scss',
})
export class InscricaoComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly ocultarSenha = signal(true);

  readonly form = this.fb.nonNullable.group({
    nomeCompleto: ['', [Validators.required, Validators.minLength(3)]],
    cpf: ['', [Validators.required, Validators.minLength(14)]],
    emailPessoal: ['', [Validators.required, Validators.email]],
    telefone: ['', [Validators.required]],
    endereco: ['', [Validators.required]],
    dataNascimento: ['', [Validators.required]],
    senha: ['', [Validators.required, Validators.minLength(6)]],
  });

  async inscrever(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const dados = this.form.getRawValue();
    if (!cpfValido(dados.cpf)) {
      this.erro.set('CPF inválido.');
      return;
    }

    this.carregando.set(true);
    this.erro.set(null);

    try {
      await this.authService.inscrever(dados);
      await this.router.navigateByUrl('/login');
    } catch (erro: unknown) {
      const codigo = (erro as { code?: string })?.code;
      this.erro.set(
        codigo === 'auth/email-already-in-use' ? 'Já existe uma inscrição com esse CPF.' : 'Não foi possível concluir a inscrição.',
      );
    } finally {
      this.carregando.set(false);
    }
  }
}
