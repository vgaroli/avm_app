import { Component, Injector, effect, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ImageCropperComponent } from 'ngx-image-cropper';
import { FormaPagamento } from '../../core/models/pessoa.model';
import { AuthService } from '../../core/services/auth.service';
import { PessoasService } from '../../core/services/pessoas.service';
import { iniciais } from '../../core/utils/avatar.util';
import { BackButtonComponent } from '../../shared/components/back-button.component';
import { CepMaskDirective } from '../../shared/directives/cep-mask.directive';

@Component({
  selector: 'app-perfil',
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
    MatProgressSpinnerModule,
    MatSelectModule,
    ImageCropperComponent,
    BackButtonComponent,
    CepMaskDirective,
  ],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.scss',
})
export class PerfilComponent {
  private readonly authService = inject(AuthService);
  private readonly pessoasService = inject(PessoasService);
  private readonly fb = inject(FormBuilder);
  private readonly injector = inject(Injector);

  private readonly cropperRef = viewChild(ImageCropperComponent);

  private formInicializado = false;

  readonly pessoa = toSignal(this.authService.currentPessoa$, { initialValue: null });
  readonly salvando = signal(false);
  readonly enviandoFoto = signal(false);
  readonly mostrarCropper = signal(false);
  readonly eventoImagem = signal<Event | null>(null);
  readonly fotoAtual = signal<string | null>(null);
  readonly iniciaisNome = signal('');

  readonly form = this.fb.nonNullable.group({
    nomeCompleto: ['', Validators.required],
    nomeExibicao: [''],
    email: ['', [Validators.required, Validators.email]],
    telefone: ['', Validators.required],
    endereco: ['', Validators.required],
    cep: ['', [Validators.required, Validators.minLength(9)]],
    dataNascimento: ['', Validators.required],
    rg: [''],
    ocupacao: ['', Validators.required],
    formaPagamento: this.fb.nonNullable.control<FormaPagamento>('avista', Validators.required),
    aceitaWhatsapp: [false],
  });

  constructor() {
    effect(() => {
      const p = this.pessoa();
      if (!p || this.formInicializado) {
        return;
      }
      this.formInicializado = true;

      const rg = this.form.controls.rg;
      rg.setValidators(p.tipoPessoa === 'juridica' ? [] : [Validators.required]);
      rg.updateValueAndValidity();

      this.form.patchValue({
        nomeCompleto: p.nomeCompleto ?? '',
        nomeExibicao: p.nomeExibicao ?? '',
        email: p.email ?? '',
        telefone: p.telefone ?? '',
        endereco: p.endereco ?? '',
        cep: p.cep ?? '',
        dataNascimento: p.dataNascimento ?? '',
        rg: p.rg ?? '',
        ocupacao: p.ocupacao ?? '',
        formaPagamento: p.formaPagamento ?? 'avista',
        aceitaWhatsapp: p.aceitaWhatsapp ?? false,
      });
      this.fotoAtual.set(p.fotoUrl ?? null);
      this.iniciaisNome.set(iniciais(p.nomeCompleto ?? ''));
    });
  }

  aoSelecionarArquivo(event: Event): void {
    this.eventoImagem.set(event);
    this.mostrarCropper.set(true);
  }

  cancelarCorte(): void {
    this.mostrarCropper.set(false);
    this.eventoImagem.set(null);
  }

  async confirmarFoto(): Promise<void> {
    const uid = this.pessoa()?.uid;
    if (!uid) {
      return;
    }

    const resultado = await this.cropperRef()?.crop('blob');
    if (!resultado?.blob) {
      return;
    }

    this.enviandoFoto.set(true);
    try {
      const url = await this.pessoasService.uploadFotoPerfil(uid, resultado.blob);
      this.fotoAtual.set(url);
      this.mostrarCropper.set(false);
      this.eventoImagem.set(null);
    } finally {
      this.enviandoFoto.set(false);
    }
  }

  async salvar(): Promise<void> {
    const pessoa = this.pessoa();
    if (!pessoa || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.salvando.set(true);
    try {
      const foto = this.fotoAtual();
      await this.pessoasService.atualizarMeuPerfil(pessoa.uid, {
        ...this.form.getRawValue(),
        ...(foto ? { fotoUrl: foto } : {}),
      });
      await this.avisarSucesso();
    } finally {
      this.salvando.set(false);
    }
  }

  private async avisarSucesso(): Promise<void> {
    const { MatSnackBar } = await import('@angular/material/snack-bar');
    const snackBar = this.injector.get(MatSnackBar);
    snackBar.open('Perfil atualizado.', 'Ok', { duration: 3000 });
  }
}
