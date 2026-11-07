import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { QRCodeComponent } from 'angularx-qrcode';
import { CriterioAmigoBairro } from '../../../../core/models/criterio-amigo-bairro.model';
import { STATUS_ESTABELECIMENTO_COR, STATUS_ESTABELECIMENTO_LABEL } from '../../../../core/models/estabelecimento.model';
import { CriteriosAmigoBairroService } from '../../../../core/services/criterios-amigo-bairro.service';
import { EstabelecimentosService } from '../../../../core/services/estabelecimentos.service';
import { formatarCnpj } from '../../../../core/utils/cpf.util';
import { BackButtonComponent } from '../../../../shared/components/back-button.component';

@Component({
  selector: 'app-estabelecimento-detalhe',
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
    QRCodeComponent,
    BackButtonComponent,
  ],
  templateUrl: './estabelecimento-detalhe.component.html',
  styleUrl: './estabelecimento-detalhe.component.scss',
})
export class EstabelecimentoDetalheComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly estabelecimentosService = inject(EstabelecimentosService);
  private readonly criteriosService = inject(CriteriosAmigoBairroService);
  private readonly fb = inject(FormBuilder);

  private readonly id = this.route.snapshot.paramMap.get('id')!;

  readonly statusLabel = STATUS_ESTABELECIMENTO_LABEL;
  readonly statusCor = STATUS_ESTABELECIMENTO_COR;

  readonly estabelecimento = toSignal(this.estabelecimentosService.obterEstabelecimento$(this.id), {
    initialValue: undefined,
  });
  readonly criterios = toSignal(this.criteriosService.criteriosAtivos$, { initialValue: [] as CriterioAmigoBairro[] });

  readonly cnpjFormatado = computed(() => {
    const cnpj = this.estabelecimento()?.cnpj;
    return cnpj ? formatarCnpj(cnpj) : '';
  });

  readonly criteriosSelecionados = signal<Set<string>>(new Set());
  readonly processando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly mostrarNovoCriterio = signal(false);

  readonly reprovarForm = this.fb.nonNullable.group({ comentario: [''] });

  readonly novoCriterioForm = this.fb.nonNullable.group({
    titulo: ['', Validators.required],
    descricao: [''],
    categoria: [''],
    obrigatorio: [false],
    pontos: [1],
  });

  readonly urlPublica = computed(() => {
    const token = this.estabelecimento()?.tokenPublico;
    return token ? `${window.location.origin}/amigo/${token}` : '';
  });

  alternarCriterio(id: string): void {
    this.criteriosSelecionados.update((atual) => {
      const copia = new Set(atual);
      if (copia.has(id)) {
        copia.delete(id);
      } else {
        copia.add(id);
      }
      return copia;
    });
  }

  async aprovar(): Promise<void> {
    const estabelecimento = this.estabelecimento();
    if (!estabelecimento) {
      return;
    }

    const titulos = this.criterios()
      .filter((criterio) => this.criteriosSelecionados().has(criterio.id))
      .map((criterio) => criterio.titulo);

    this.processando.set(true);
    this.erro.set(null);
    try {
      await this.estabelecimentosService.aprovar(estabelecimento, titulos);
    } catch (erro) {
      console.error('[EstabelecimentoDetalhe] Falha ao aprovar o cadastro', erro);
      this.erro.set('Não foi possível aprovar o cadastro. Tente novamente.');
    } finally {
      this.processando.set(false);
    }
  }

  async reprovar(): Promise<void> {
    const comentario = this.reprovarForm.getRawValue().comentario.trim();
    this.processando.set(true);
    this.erro.set(null);
    try {
      await this.estabelecimentosService.reprovar(this.id, comentario || undefined);
    } catch (erro) {
      console.error('[EstabelecimentoDetalhe] Falha ao reprovar o cadastro', erro);
      this.erro.set('Não foi possível reprovar o cadastro. Tente novamente.');
    } finally {
      this.processando.set(false);
    }
  }

  async revogarToken(): Promise<void> {
    const estabelecimento = this.estabelecimento();
    if (!estabelecimento) {
      return;
    }
    this.processando.set(true);
    this.erro.set(null);
    try {
      await this.estabelecimentosService.revogarToken(estabelecimento);
    } catch (erro) {
      console.error('[EstabelecimentoDetalhe] Falha ao revogar o token', erro);
      this.erro.set('Não foi possível gerar um novo QR code. Tente novamente.');
    } finally {
      this.processando.set(false);
    }
  }

  async salvarNovoCriterio(): Promise<void> {
    if (this.novoCriterioForm.invalid) {
      this.novoCriterioForm.markAllAsTouched();
      return;
    }

    const dados = this.novoCriterioForm.getRawValue();
    this.processando.set(true);
    try {
      await this.criteriosService.criar({
        titulo: dados.titulo.trim(),
        descricao: dados.descricao.trim(),
        categoria: dados.categoria.trim(),
        obrigatorio: dados.obrigatorio,
        pontos: dados.pontos,
      });
      this.novoCriterioForm.reset({ titulo: '', descricao: '', categoria: '', obrigatorio: false, pontos: 1 });
      this.mostrarNovoCriterio.set(false);
    } finally {
      this.processando.set(false);
    }
  }

  formatarData(iso: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  }
}
