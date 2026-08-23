import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ArvoresService } from '../../../core/services/arvores.service';
import { EstadoArvore } from '../../../core/models/arvore.model';
import { dentroDoPerimetroVilaMariana } from '../../../core/utils/geofence.util';
import { BackButtonComponent } from '../../../shared/components/back-button.component';
import { ArvoreCamposFormComponent, ArvoreCamposFormGroup } from '../shared/arvore-campos-form.component';

type StatusGps = 'aguardando' | 'sucesso' | 'negado' | 'erro';
type StatusPerimetro = 'verificando' | 'dentro' | 'fora';

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

  readonly foto = signal<File | null>(null);
  readonly fotoPreviewUrl = signal<string | null>(null);

  readonly statusGps = signal<StatusGps>('aguardando');
  readonly lat = signal<number | null>(null);
  readonly lng = signal<number | null>(null);

  readonly statusPerimetro = signal<StatusPerimetro | null>(null);
  readonly erroPerimetro = signal<string | null>(null);

  readonly enviando = signal(false);
  readonly erro = signal<string | null>(null);

  readonly podeSalvar = computed(
    () => !!this.foto() && this.statusGps() === 'sucesso' && this.statusPerimetro() === 'dentro' && !this.enviando(),
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

  selecionarFoto(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const arquivo = input.files?.[0] ?? null;

    const anterior = this.fotoPreviewUrl();
    if (anterior) {
      URL.revokeObjectURL(anterior);
    }

    this.foto.set(arquivo);
    this.fotoPreviewUrl.set(arquivo ? URL.createObjectURL(arquivo) : null);
  }

  async salvar(): Promise<void> {
    const arquivo = this.foto();
    const lat = this.lat();
    const lng = this.lng();
    if (!arquivo || lat === null || lng === null || !this.podeSalvar()) {
      return;
    }

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
        arquivo,
        lat,
        lng,
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
      return 'Sem permissão para registrar a árvore. Confirme se seu cadastro está ativo como diretoria e tente novamente.';
    }
    if (codigo === 'storage/canceled' || codigo === 'storage/retry-limit-exceeded') {
      return 'O envio da foto foi interrompido (conexão instável). Verifique sua internet e tente novamente.';
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
