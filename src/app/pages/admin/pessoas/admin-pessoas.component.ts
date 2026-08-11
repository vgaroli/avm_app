import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { PapelPessoa, Pessoa } from '../../../core/models/pessoa.model';
import { PessoasService } from '../../../core/services/pessoas.service';
import { formatarCpf } from '../../../core/utils/cpf.util';

@Component({
  selector: 'app-admin-pessoas',
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
    MatTabsModule,
  ],
  templateUrl: './admin-pessoas.component.html',
  styleUrl: './admin-pessoas.component.scss',
})
export class AdminPessoasComponent {
  private readonly pessoasService = inject(PessoasService);
  private readonly fb = inject(FormBuilder);

  readonly formatarCpf = formatarCpf;

  readonly pendentes = toSignal(this.pessoasService.listarPendentes(), { initialValue: [] as Pessoa[] });
  readonly ativos = toSignal(this.pessoasService.listarAtivos(), { initialValue: [] as Pessoa[] });

  readonly selecaoPapel: Record<string, Exclude<PapelPessoa, null>> = {};
  readonly processando = signal<string | null>(null);

  readonly editandoUid = signal<string | null>(null);
  readonly editForm = this.fb.nonNullable.group({
    nomeCompleto: ['', Validators.required],
    telefone: ['', Validators.required],
    endereco: ['', Validators.required],
    observacoesDiretoria: [''],
  });

  papelDe(uid: string): Exclude<PapelPessoa, null> {
    return this.selecaoPapel[uid] ?? 'associado';
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
    this.editForm.setValue({
      nomeCompleto: pessoa.nomeCompleto,
      telefone: pessoa.telefone,
      endereco: pessoa.endereco,
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
