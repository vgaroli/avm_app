import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ArvoresService, FotoParaEnviar } from '../../../core/services/arvores.service';
import { EstadoArvore, TIPO_FOTO_ARVORE_LABEL, TipoFotoArvore } from '../../../core/models/arvore.model';
import { dentroDoPerimetroVilaMariana } from '../../../core/utils/geofence.util';
import { comprimirImagem } from '../../../core/utils/imagem.util';
import { BackButtonComponent } from '../../../shared/components/back-button.component';
import { ArvoreCamposFormComponent, ArvoreCamposFormGroup } from '../shared/arvore-campos-form.component';

type StatusGps = 'aguardando' | 'sucesso' | 'negado' | 'erro';
type StatusPerimetro = 'verificando' | 'dentro' | 'fora';

const TIPOS_FOTO: TipoFotoArvore[] = ['inteira', 'folha', 'fruto', 'casca', 'flor'];
const MINIMO_FOTOS = 2;
const PRECISAO_GPS_LIMITE_METROS = 30;

@Component({
  selector: 'app-arvore-nova',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule, BackButtonComponent, ArvoreCamposFormComponent],
  templateUrl: './arvore-nova.component.html',
  styleUrl: './arvore-nova.component.scss',
})
export class ArvoreNovaComponent {
  private readonly fb = inject(FormBuilder);
  private readonly arvoresService = inject(ArvoresService);
  private readonly router = inject(Router);

  protected readonly TIPOS_FOTO = TIPOS_FOTO;
  protected readonly TIPO_FOTO_ARVORE_LABEL = TIPO_FOTO_ARVORE_LABEL;
  protected readonly MINIMO_FOTOS = MINIMO_FOTOS;

  readonly fotosPorTipo = signal<Partial<Record<TipoFotoArvore, File>>>({});
  readonly previewsPorTipo = signal<Partial<Record<TipoFotoArvore, string>>>({});
  readonly tipoAtivo = signal<TipoFotoArvore>('inteira');
  readonly comprimindo = signal<TipoFotoArvore | null>(null);

  readonly totalFotos = computed(() => Object.keys(this.fotosPorTipo()).length);

  readonly statusGps = signal<StatusGps>('aguardando');
  readonly lat = signal<number | null>(null);
  readonly lng = signal<number | null>(null);
  readonly precisaoGpsMetros = signal<number | null>(null);
  readonly avisoPrecisaoGps = computed(
    () => this.precisaoGpsMetros() !== null && this.precisaoGpsMetros()! > PRECISAO_GPS_LIMITE_METROS,
  );

  readonly statusPerimetro = signal<StatusPerimetro | null>(null);
  readonly erroPerimetro = signal<string | null>(null);

  readonly enviando = signal(false);
  readonly erro = signal<string | null>(null);

  readonly podeSalvar = computed(
    () =>
      this.totalFotos() >= MINIMO_FOTOS &&
      this.statusGps() === 'sucesso' &&
      this.statusPerimetro() === 'dentro' &&
      !this.enviando(),
  );

  readonly form: ArvoreCamposFormGroup = this.fb.nonNullable.group({
    especie: [''],
    diametroCm: this.fb.control<number | null>(null),
    estado: this.fb.nonNullable.control<EstadoArvore>('saudavel', Validators.required),
    observacoes: [''],
  });

  constructor() {
    this.capturarLocalizacao();
  }

  capturarLocalizacao(): void {
    if (!navigator.geolocation) {
      this.statusGps.set('erro');
      return;
    }

    this.statusGps.set('aguardando');
    this.statusPerimetro.set(null);
    navigator.geolocation.getCurrentPosition(
      (posicao) => {
        const lat = posicao.coords.latitude;
        const lng = posicao.coords.longitude;
        this.lat.set(lat);
        this.lng.set(lng);
        this.precisaoGpsMetros.set(posicao.coords.accuracy ?? null);
        this.statusGps.set('sucesso');
        this.verificarPerimetro(lat, lng);
      },
      (erro) => {
        this.statusGps.set(erro.code === erro.PERMISSION_DENIED ? 'negado' : 'erro');
      },
      { enableHighAccuracy: true },
    );
  }

  private async verificarPerimetro(lat: number, lng: number): Promise<void> {
    this.statusPerimetro.set('verificando');
    this.erroPerimetro.set(null);
    try {
      const dentro = await dentroDoPerimetroVilaMariana(lat, lng);
      this.statusPerimetro.set(dentro ? 'dentro' : 'fora');
    } catch (erro) {
      console.error('[ArvoreNova] Falha ao verificar o perímetro', erro);
      this.statusPerimetro.set('fora');
      this.erroPerimetro.set(
        'Não foi possível confirmar se você está em Vila Mariana (falha ao carregar o mapa da região). Verifique sua conexão e tente novamente.',
      );
    }
  }

  tentarNovamentePerimetro(): void {
    const lat = this.lat();
    const lng = this.lng();
    if (lat === null || lng === null) {
      return;
    }
    void this.verificarPerimetro(lat, lng);
  }

  selecionarAba(tipo: TipoFotoArvore): void {
    this.tipoAtivo.set(tipo);
  }

  async selecionarFoto(evento: Event, tipo: TipoFotoArvore): Promise<void> {
    const input = evento.target as HTMLInputElement;
    const arquivo = input.files?.[0] ?? null;
    input.value = '';
    if (!arquivo) {
      return;
    }

    this.comprimindo.set(tipo);
    try {
      const comprimido = await comprimirImagem(arquivo).catch(() => arquivo);

      const previewAnterior = this.previewsPorTipo()[tipo];
      if (previewAnterior) {
        URL.revokeObjectURL(previewAnterior);
      }

      this.fotosPorTipo.update((atual) => ({ ...atual, [tipo]: comprimido }));
      this.previewsPorTipo.update((atual) => ({ ...atual, [tipo]: URL.createObjectURL(comprimido) }));
    } finally {
      this.comprimindo.set(null);
    }
  }

  removerFoto(tipo: TipoFotoArvore): void {
    const preview = this.previewsPorTipo()[tipo];
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    this.fotosPorTipo.update((atual) => {
      const copia = { ...atual };
      delete copia[tipo];
      return copia;
    });
    this.previewsPorTipo.update((atual) => {
      const copia = { ...atual };
      delete copia[tipo];
      return copia;
    });
  }

  async salvar(): Promise<void> {
    const lat = this.lat();
    const lng = this.lng();
    if (lat === null || lng === null || !this.podeSalvar()) {
      return;
    }

    const fotos: FotoParaEnviar[] = Object.entries(this.fotosPorTipo()).map(([tipo, arquivo]) => ({
      tipo: tipo as TipoFotoArvore,
      arquivo: arquivo as File,
    }));

    this.enviando.set(true);
    this.erro.set(null);
    try {
      const dados = this.form.getRawValue();
      await this.arvoresService.registrarArvore(
        {
          especie: dados.especie.trim() || null,
          diametroCm: dados.diametroCm,
          estado: dados.estado,
          observacoes: dados.observacoes.trim(),
        },
        fotos,
        lat,
        lng,
        this.precisaoGpsMetros(),
      );
      this.router.navigateByUrl('/');
    } catch (erro) {
      console.error('[ArvoreNova] Falha ao salvar o registro da árvore', erro);
      this.erro.set(this.mensagemErroSalvar(erro));
    } finally {
      this.enviando.set(false);
    }
  }

  private mensagemErroSalvar(erro: unknown): string {
    const codigo = this.codigoErro(erro);

    if (codigo === 'storage/unauthorized' || codigo === 'permission-denied') {
      return 'Sem permissão para registrar a árvore. Confirme se seu cadastro está ativo e autorizado a registrar árvores, e tente novamente.';
    }
    if (codigo === 'storage/canceled' || codigo === 'storage/retry-limit-exceeded') {
      return 'O envio das fotos foi interrompido (conexão instável). Verifique sua internet e tente novamente.';
    }
    if (codigo === 'storage/quota-exceeded') {
      return 'Limite de armazenamento de fotos excedido. Avise a diretoria.';
    }
    if (codigo === 'unavailable' || !navigator.onLine) {
      return 'Sem conexão com a internet no momento do envio. Verifique sua conexão e tente novamente.';
    }

    const mensagem = erro instanceof Error ? erro.message : null;
    return mensagem
      ? `Não foi possível salvar o registro da árvore (${mensagem}). Tente novamente.`
      : 'Não foi possível salvar o registro da árvore. Tente novamente.';
  }

  private codigoErro(erro: unknown): string | null {
    return erro && typeof erro === 'object' && 'code' in erro && typeof (erro as { code: unknown }).code === 'string'
      ? (erro as { code: string }).code
      : null;
  }
}
