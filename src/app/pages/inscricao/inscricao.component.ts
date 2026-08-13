import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { AuthService } from '../../core/services/auth.service';
import { CpfMaskDirective } from '../../shared/directives/cpf-mask.directive';
import { CepMaskDirective } from '../../shared/directives/cep-mask.directive';
import { BackButtonComponent } from '../../shared/components/back-button.component';
import { documentoValido } from '../../core/utils/cpf.util';
import { TipoPessoa } from '../../core/models/pessoa.model';

function senhasIguaisValidator(control: AbstractControl): ValidationErrors | null {
  const senha = control.get('senha')?.value;
  const confirmarSenha = control.get('confirmarSenha')?.value;
  return senha === confirmarSenha ? null : { senhasDiferentes: true };
}

@Component({
  selector: 'app-inscricao',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    CpfMaskDirective,
    CepMaskDirective,
    BackButtonComponent,
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
  readonly ocultarConfirmarSenha = signal(true);

  readonly estatutoUrl = 'https://www.vilamariana.org.br/estatuto';

  readonly form = this.fb.nonNullable.group({
    tipoPessoa: this.fb.nonNullable.control<TipoPessoa>('fisica', Validators.required),
    nomeCompleto: ['', [Validators.required, Validators.minLength(3)]],
    cpf: ['', [Validators.required, Validators.minLength(14)]],
    rg: ['', [Validators.required]],
    emailPessoal: ['', [Validators.required, Validators.email]],
    telefone: ['', [Validators.required]],
    endereco: ['', [Validators.required]],
    cep: ['', [Validators.required, Validators.minLength(9)]],
    dataNascimento: ['', [Validators.required]],
    ocupacao: ['', [Validators.required]],
    formaPagamento: this.fb.nonNullable.control<'avista' | 'parcelado'>('avista', Validators.required),
    aceitaWhatsapp: [false],
    aceitaLgpd: [false, Validators.requiredTrue],
    aceitaEstatuto: [false, Validators.requiredTrue],
    aceitaResponsabilidades: [false, Validators.requiredTrue],
    senha: ['', [Validators.required, Validators.minLength(6)]],
    confirmarSenha: ['', [Validators.required]],
  }, { validators: senhasIguaisValidator });

  constructor() {
    // RG não se aplica a pessoa jurídica.
    this.form.controls.tipoPessoa.valueChanges.subscribe((tipo) => {
      const rg = this.form.controls.rg;
      rg.setValidators(tipo === 'juridica' ? [] : [Validators.required]);
      rg.updateValueAndValidity();
    });
  }

  async inscrever(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { confirmarSenha, ...dados } = this.form.getRawValue();
    if (!documentoValido(dados.cpf, dados.tipoPessoa)) {
      this.erro.set(dados.tipoPessoa === 'juridica' ? 'CNPJ inválido.' : 'CPF inválido.');
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
        codigo === 'auth/email-already-in-use'
          ? `Já existe uma inscrição com esse ${dados.tipoPessoa === 'juridica' ? 'CNPJ' : 'CPF'}.`
          : 'Não foi possível concluir a inscrição.',
      );
    } finally {
      this.carregando.set(false);
    }
  }
}
