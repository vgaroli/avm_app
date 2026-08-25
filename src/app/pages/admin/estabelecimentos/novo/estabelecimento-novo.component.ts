import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { EstabelecimentosService } from '../../../../core/services/estabelecimentos.service';
import { apenasDigitos } from '../../../../core/utils/cpf.util';
import { StatusGps, capturarLocalizacaoAtual, excedePrecisaoGps, statusGpsDoErro } from '../../../../core/utils/gps.util';
import { CpfMaskDirective } from '../../../../shared/directives/cpf-mask.directive';
import { BackButtonComponent } from '../../../../shared/components/back-button.component';

@Component({
  selector: 'app-estabelecimento-novo',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    CpfMaskDirective,
    BackButtonComponent,
  ],
  templateUrl: './estabelecimento-novo.component.html',
  styleUrl: './estabelecimento-novo.component.scss',
})
export class EstabelecimentoNovoComponent {
  private readonly fb = inject(FormBuilder);
  private readonly estabelecimentosService = inject(EstabelecimentosService);
  private readonly router = inject(Router);

  readonly statusGps = signal<StatusGps>('aguardando');
  readonly lat = signal<number | null>(null);
  readonly lng = signal<number | null>(null);
  readonly precisaoGpsMetros = signal<number | null>(null);
  readonly avisoPrecisaoGps = computed(() => excedePrecisaoGps(this.precisaoGpsMetros()));

  readonly enviando = signal(false);
  readonly erro = signal<string | null>(null);

  readonly podeSalvar = computed(() => this.statusGps() === 'sucesso' && !this.enviando());

  readonly form = this.fb.nonNullable.group({
    nome: ['', Validators.required],
    cnpj: ['', Validators.required],
    responsavel: ['', Validators.required],
    endereco: ['', Validators.required],
    categoria: ['', Validators.required],
    beneficioAssociado: [''],
  });

  constructor() {
    void this.capturarLocalizacao();
  }

  async capturarLocalizacao(): Promise<void> {
    this.statusGps.set('aguardando');
    try {
      const { lat, lng, precisaoGpsMetros } = await capturarLocalizacaoAtual();
      this.lat.set(lat);
      this.lng.set(lng);
      this.precisaoGpsMetros.set(precisaoGpsMetros);
      this.statusGps.set('sucesso');
    } catch (erro) {
      this.statusGps.set(statusGpsDoErro(erro));
    }
  }

  async salvar(): Promise<void> {
    const lat = this.lat();
    const lng = this.lng();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (lat === null || lng === null || !this.podeSalvar()) {
      return;
    }

    this.enviando.set(true);
    this.erro.set(null);
    try {
      const dados = this.form.getRawValue();
      await this.estabelecimentosService.registrarEstabelecimento(
        {
          nome: dados.nome.trim(),
          cnpj: apenasDigitos(dados.cnpj),
          responsavel: dados.responsavel.trim(),
          endereco: dados.endereco.trim(),
          categoria: dados.categoria.trim(),
          beneficioAssociado: dados.beneficioAssociado.trim() || null,
        },
        lat,
        lng,
        this.precisaoGpsMetros(),
      );
      this.router.navigateByUrl('/admin/estabelecimentos');
    } catch (erro) {
      console.error('[EstabelecimentoNovo] Falha ao salvar o cadastro', erro);
      this.erro.set('Não foi possível salvar o cadastro. Tente novamente.');
    } finally {
      this.enviando.set(false);
    }
  }
}
