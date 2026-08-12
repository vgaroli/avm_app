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
import { BackButtonComponent } from '../../shared/components/back-button.component';
import { apenasDigitos } from '../../core/utils/cpf.util';

@Component({
  selector: 'app-login',
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
    BackButtonComponent,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly ocultarSenha = signal(true);

  readonly form = this.fb.nonNullable.group({
    cpf: ['', [Validators.required, Validators.minLength(14)]],
    senha: ['', [Validators.required, Validators.minLength(6)]],
  });

  async entrar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { cpf, senha } = this.form.getRawValue();
    const totalDigitos = apenasDigitos(cpf).length;
    if (totalDigitos !== 11 && totalDigitos !== 14) {
      this.erro.set('CPF ou CNPJ inválido.');
      return;
    }

    this.carregando.set(true);
    this.erro.set(null);

    try {
      await this.authService.login(cpf, senha);
      await this.router.navigateByUrl('/');
    } catch {
      this.erro.set('CPF/CNPJ ou senha inválidos.');
    } finally {
      this.carregando.set(false);
    }
  }
}
