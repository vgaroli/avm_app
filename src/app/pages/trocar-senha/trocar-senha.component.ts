import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { PessoasService } from '../../core/services/pessoas.service';

function senhasIguaisValidator(control: AbstractControl): ValidationErrors | null {
  const novaSenha = control.get('novaSenha')?.value;
  const confirmarSenha = control.get('confirmarSenha')?.value;
  return novaSenha === confirmarSenha ? null : { senhasDiferentes: true };
}

@Component({
  selector: 'app-trocar-senha',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './trocar-senha.component.html',
  styleUrl: './trocar-senha.component.scss',
})
export class TrocarSenhaComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly pessoasService = inject(PessoasService);
  private readonly router = inject(Router);

  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly ocultarSenha = signal(true);
  readonly ocultarConfirmarSenha = signal(true);

  readonly form = this.fb.nonNullable.group(
    {
      novaSenha: ['', [Validators.required, Validators.minLength(6)]],
      confirmarSenha: ['', [Validators.required]],
    },
    { validators: senhasIguaisValidator },
  );

  async confirmar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const usuario = await firstValueFrom(this.authService.currentUser$);
    if (!usuario) {
      await this.router.navigateByUrl('/login');
      return;
    }

    this.carregando.set(true);
    this.erro.set(null);

    try {
      const { novaSenha } = this.form.getRawValue();
      await this.authService.alterarSenha(novaSenha);
      await this.pessoasService.confirmarSenhaAlterada(usuario.uid);
      await this.router.navigateByUrl('/');
    } catch (erro: unknown) {
      const codigo = (erro as { code?: string })?.code;
      if (codigo === 'auth/requires-recent-login') {
        await this.authService.logout();
        await this.router.navigateByUrl('/login');
        return;
      }
      this.erro.set('Não foi possível alterar a senha. Tente novamente.');
    } finally {
      this.carregando.set(false);
    }
  }
}
