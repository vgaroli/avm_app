import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { ArvoresService, MAXIMO_FOTOS_VISITA } from '../../../../core/services/arvores.service';
import {
  Arvore,
  ESTADO_ARVORE_LABEL,
  EstadoArvore,
  TIPO_OCORRENCIA_LABEL,
  TipoOcorrencia,
} from '../../../../core/models/arvore.model';
import { obterSituacaoArvore } from '../../../../core/utils/arvore-foto.util';
import { comprimirImagem } from '../../../../core/utils/imagem.util';
import { BackButtonComponent } from '../../../../shared/components/back-button.component';

const OCORRENCIAS: TipoOcorrencia[] = [
  'podada',
  'galhoQuebrado',
  'pragaDoenca',
  'conflitoFiacao',
  'danoCalcada',
  'outro',
  'removida',
];

interface FotoVisita {
  arquivo: File;
  preview: string;
}

@Component({
  selector: 'app-arvore-visita-nova',
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
    BackButtonComponent,
  ],
  templateUrl: './arvore-visita-nova.component.html',
  styleUrl: './arvore-visita-nova.component.scss',
})
export class ArvoreVisitaNovaComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly arvoresService = inject(ArvoresService);
  private readonly snackBar = inject(MatSnackBar);

  readonly id = this.route.snapshot.paramMap.get('id')!;

  protected readonly OCORRENCIAS = OCORRENCIAS;
  protected readonly TIPO_OCORRENCIA_LABEL = TIPO_OCORRENCIA_LABEL;
  protected readonly ESTADO_ARVORE_LABEL = ESTADO_ARVORE_LABEL;
  protected readonly MAXIMO_FOTOS = MAXIMO_FOTOS_VISITA;

  readonly arvore = signal<Arvore | null>(null);
  readonly carregando = signal(true);
  readonly jaRemovida = computed(() => {
    const arvore = this.arvore();
    return !!arvore && obterSituacaoArvore(arvore) === 'removida';
  });

  readonly ocorrencias = signal<TipoOcorrencia[]>([]);
  readonly removida = computed(() => this.ocorrencias().includes('removida'));

  readonly estadoControl = new FormControl<EstadoArvore | null>(null);
  readonly observacoesControl = new FormControl('', { nonNullable: true });
  private readonly estado = toSignal(this.estadoControl.valueChanges, { initialValue: null });

  readonly fotos = signal<FotoVisita[]>([]);
  readonly comprimindo = signal(false);
  readonly enviando = signal(false);
  readonly erro = signal<string | null>(null);

  readonly podeSalvar = computed(() => {
    if (this.enviando() || this.comprimindo() || !this.arvore() || this.jaRemovida()) {
      return false;
    }
    return this.removida() ? this.fotos().length >= 1 : !!this.estado();
  });

  async ngOnInit(): Promise<void> {
    const arvore = await firstValueFrom(this.arvoresService.obterArvore$(this.id));
    if (arvore) {
      this.arvore.set(arvore);
      this.estadoControl.setValue(arvore.estado);
    } else {
      this.erro.set('Árvore não encontrada.');
    }
    this.carregando.set(false);
  }

  ngOnDestroy(): void {
    this.fotos().forEach((foto) => URL.revokeObjectURL(foto.preview));
  }

  /** "Removida" é exclusiva: marcá-la limpa as demais, e marcar outra desmarca "Removida". */
  alternarOcorrencia(ocorrencia: TipoOcorrencia): void {
    this.ocorrencias.update((atuais) => {
      if (atuais.includes(ocorrencia)) {
        return atuais.filter((o) => o !== ocorrencia);
      }
      if (ocorrencia === 'removida') {
        return ['removida'];
      }
      return [...atuais.filter((o) => o !== 'removida'), ocorrencia];
    });
  }

  async adicionarFoto(evento: Event): Promise<void> {
    const input = evento.target as HTMLInputElement;
    const arquivo = input.files?.[0] ?? null;
    input.value = '';
    if (!arquivo || this.fotos().length >= MAXIMO_FOTOS_VISITA) {
      return;
    }

    this.comprimindo.set(true);
    try {
      const comprimido = await comprimirImagem(arquivo).catch(() => arquivo);
      this.fotos.update((atuais) => [...atuais, { arquivo: comprimido, preview: URL.createObjectURL(comprimido) }]);
    } finally {
      this.comprimindo.set(false);
    }
  }

  removerFoto(indice: number): void {
    const foto = this.fotos()[indice];
    if (foto) {
      URL.revokeObjectURL(foto.preview);
    }
    this.fotos.update((atuais) => atuais.filter((_, i) => i !== indice));
  }

  async salvar(): Promise<void> {
    if (!this.podeSalvar()) {
      return;
    }

    const removida = this.removida();
    if (
      removida &&
      !confirm('Confirma que esta árvore foi removida? Ela deixará de aparecer no mapa por padrão.')
    ) {
      return;
    }

    this.enviando.set(true);
    this.erro.set(null);
    try {
      await this.arvoresService.registrarVisita(
        this.id,
        {
          estadoObservado: removida ? null : this.estadoControl.value,
          ocorrencias: this.ocorrencias(),
          observacoes: this.observacoesControl.value.trim(),
        },
        this.fotos().map((foto) => foto.arquivo),
      );
      this.snackBar.open(removida ? 'Remoção registrada.' : 'Visita registrada.', 'Fechar', { duration: 4000 });
      this.router.navigate(['/arvores', this.id, 'visitas'], { replaceUrl: true });
    } catch (erro) {
      console.error('[ArvoreVisitaNova] Falha ao registrar a visita', erro);
      this.erro.set(this.mensagemErroSalvar(erro));
    } finally {
      this.enviando.set(false);
    }
  }

  private mensagemErroSalvar(erro: unknown): string {
    const codigo =
      erro && typeof erro === 'object' && 'code' in erro && typeof (erro as { code: unknown }).code === 'string'
        ? (erro as { code: string }).code
        : null;

    if (codigo === 'storage/unauthorized' || codigo === 'permission-denied') {
      return 'Sem permissão para registrar a visita. Confirme se seu cadastro está ativo e autorizado a registrar árvores.';
    }
    if (codigo === 'storage/canceled' || codigo === 'storage/retry-limit-exceeded') {
      return 'O envio das fotos foi interrompido (conexão instável). Verifique sua internet e tente novamente.';
    }
    if (codigo === 'unavailable' || !navigator.onLine) {
      return 'Sem conexão com a internet no momento do envio. Verifique sua conexão e tente novamente.';
    }

    const mensagem = erro instanceof Error ? erro.message : null;
    return mensagem
      ? `Não foi possível registrar a visita (${mensagem}). Tente novamente.`
      : 'Não foi possível registrar a visita. Tente novamente.';
  }
}
