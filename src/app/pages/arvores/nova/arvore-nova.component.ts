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
    try {
      const dentro = await dentroDoPerimetroVilaMariana(lat, lng);
      this.statusPerimetro.set(dentro ? 'dentro' : 'fora');
    } catch {
      this.statusPerimetro.set('fora');
    }
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
    } catch {
      this.erro.set('Não foi possível salvar o registro da árvore. Tente novamente.');
    } finally {
      this.enviando.set(false);
    }
  }
}
