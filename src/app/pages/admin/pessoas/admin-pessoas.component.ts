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
import { MatTabsModule } from '@angular/material/tabs';
import { FormaPagamento, PapelPessoa, Pessoa } from '../../../core/models/pessoa.model';
import { PessoasService } from '../../../core/services/pessoas.service';
import { formatarCep, formatarDocumento } from '../../../core/utils/cpf.util';
import { BackButtonComponent } from '../../../shared/components/back-button.component';
import { CepMaskDirective } from '../../../shared/directives/cep-mask.directive';

@Component({
  selector: 'app-admin-pessoas',
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
    MatTabsModule,
    BackButtonComponent,
    CepMaskDirective,
  ],
  templateUrl: './admin-pessoas.component.html',
  styleUrl: './admin-pessoas.component.scss',
})
export class AdminPessoasComponent {
  private readonly pessoasService = inject(PessoasService);
  private readonly fb = inject(FormBuilder);

  readonly pendentes = toSignal(this.pessoasService.listarPendentes(), { initialValue: [] as Pessoa[] });
  readonly ativos = toSignal(this.pessoasService.listarAtivos(), { initialValue: [] as Pessoa[] });

  readonly selecaoPapel: Record<string, Exclude<PapelPessoa, null>> = {};
  readonly processando = signal<string | null>(null);

  readonly editandoUid = signal<string | null>(null);
  readonly editForm = this.fb.nonNullable.group({
    nomeCompleto: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    telefone: ['', Validators.required],
    endereco: ['', Validators.required],
    cep: ['', [Validators.required, Validators.minLength(9)]],
    dataNascimento: ['', Validators.required],
    rg: ['', Validators.required],
    ocupacao: ['', Validators.required],
    formaPagamento: this.fb.nonNullable.control<FormaPagamento>('avista', Validators.required),
    aceitaWhatsapp: [false],
    fotoUrl: [''],
    observacoesDiretoria: [''],
  });

  papelDe(uid: string): Exclude<PapelPessoa, null> {
    return this.selecaoPapel[uid] ?? 'associado';
  }

  rotuloDocumento(pessoa: Pessoa): string {
    return pessoa.tipoPessoa === 'juridica' ? 'CNPJ' : 'CPF';
  }

  documentoFormatado(pessoa: Pessoa): string {
    return formatarDocumento(pessoa.cpf, pessoa.tipoPessoa ?? 'fisica');
  }

  cepFormatado(pessoa: Pessoa): string {
    return formatarCep(pessoa.cep);
  }

  async aprovar(pessoa: Pessoa): Promise<void> {
    this.processando.set(pessoa.uid);
    try {
      await this.pessoasService.aprovarInscricao(pessoa.uid, this.papelDe(pessoa.uid));
    } finally {
      this.processando.set(null);
    }
  }

  async inativar(pessoa: Pessoa): Promise<void> {
    this.processando.set(pessoa.uid);
    try {
      await this.pessoasService.inativar(pessoa.uid);
    } finally {
      this.processando.set(null);
    }
  }

  async alterarPapel(pessoa: Pessoa, papel: Exclude<PapelPessoa, null>): Promise<void> {
    this.processando.set(pessoa.uid);
    try {
      await this.pessoasService.alterarPapel(pessoa.uid, papel);
    } finally {
      this.processando.set(null);
    }
  }

  iniciarEdicao(pessoa: Pessoa): void {
    this.editandoUid.set(pessoa.uid);
    const rg = this.editForm.controls.rg;
    rg.setValidators(pessoa.tipoPessoa === 'juridica' ? [] : [Validators.required]);
    rg.updateValueAndValidity();
    this.editForm.patchValue({
      nomeCompleto: pessoa.nomeCompleto ?? '',
      email: pessoa.email ?? '',
      telefone: pessoa.telefone ?? '',
      endereco: pessoa.endereco ?? '',
      cep: pessoa.cep ?? '',
      dataNascimento: pessoa.dataNascimento ?? '',
      rg: pessoa.rg ?? '',
      ocupacao: pessoa.ocupacao ?? '',
      formaPagamento: pessoa.formaPagamento ?? 'avista',
      aceitaWhatsapp: pessoa.aceitaWhatsapp ?? false,
      fotoUrl: pessoa.fotoUrl ?? '',
      observacoesDiretoria: pessoa.observacoesDiretoria ?? '',
    });
  }

  cancelarEdicao(): void {
    this.editandoUid.set(null);
  }

  async salvarEdicao(pessoa: Pessoa): Promise<void> {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.processando.set(pessoa.uid);
    try {
      await this.pessoasService.atualizarDados(pessoa.uid, this.editForm.getRawValue());
      this.editandoUid.set(null);
    } finally {
      this.processando.set(null);
    }
  }
}
