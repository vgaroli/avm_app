import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { ArvoresService } from '../../../core/services/arvores.service';
import { PlantnetService } from '../../../core/services/plantnet.service';
import {
  Arvore,
  EstadoArvore,
  FotoArvore,
  SugestaoEspecie,
  TIPO_FOTO_ARVORE_LABEL,
  TipoFotoArvore,
} from '../../../core/models/arvore.model';
import { obterFotosArvore } from '../../../core/utils/arvore-foto.util';
import { BackButtonComponent } from '../../../shared/components/back-button.component';
import { ArvoreCamposFormComponent, ArvoreCamposFormGroup } from '../shared/arvore-campos-form.component';

const TIPOS_FOTO: TipoFotoArvore[] = ['inteira', 'folha', 'fruto', 'casca', 'flor'];

@Component({
  selector: 'app-arvore-moderar',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    ReactiveFormsModule,
    BackButtonComponent,
    ArvoreCamposFormComponent,
  ],
  templateUrl: './arvore-moderar.component.html',
  styleUrl: './arvore-moderar.component.scss',
})
export class ArvoreModerarComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly arvoresService = inject(ArvoresService);
  private readonly plantnetService = inject(PlantnetService);
  private readonly snackBar = inject(MatSnackBar);

  private readonly id = this.route.snapshot.paramMap.get('id')!;

  protected readonly TIPOS_FOTO = TIPOS_FOTO;
  protected readonly TIPO_FOTO_ARVORE_LABEL = TIPO_FOTO_ARVORE_LABEL;

  readonly arvore = signal<Arvore | null>(null);
  readonly carregando = signal(true);
  readonly consultandoPlantnet = signal(false);
  readonly validando = signal(false);
  readonly erro = signal<string | null>(null);

  readonly fotosEditaveis = signal<FotoArvore[]>([]);
  readonly sugestoes = signal<SugestaoEspecie[]>([]);
  readonly sugestaoSelecionadaIndex = signal<number | null>(null);

  readonly especieCientificaControl = new FormControl<string | null>(null);

  readonly form: ArvoreCamposFormGroup = this.fb.nonNullable.group({
    especie: [''],
    diametroCm: this.fb.control<number | null>(null),
    estado: this.fb.nonNullable.control<EstadoArvore>('saudavel', Validators.required),
    observacoes: [''],
  });

  readonly jaValidada = computed(() => this.arvore()?.status === 'validado');

  async ngOnInit(): Promise<void> {
    const arvore = await firstValueFrom(this.arvoresService.obterArvore$(this.id));
    if (!arvore) {
      this.erro.set('Árvore não encontrada.');
      this.carregando.set(false);
      return;
    }

    this.arvore.set(arvore);
    this.fotosEditaveis.set(obterFotosArvore(arvore));
    this.sugestoes.set(arvore.moderacao?.sugestoesPlantnet ?? []);
    this.form.patchValue({
      especie: arvore.especie ?? '',
      diametroCm: arvore.diametroCm,
      estado: arvore.estado,
      observacoes: arvore.observacoes,
    });
    this.especieCientificaControl.setValue(arvore.especieCientifica ?? null);
    this.carregando.set(false);
  }

  alterarTipoFoto(indice: number, novoTipo: TipoFotoArvore): void {
    this.fotosEditaveis.update((fotos) => fotos.map((foto, i) => (i === indice ? { ...foto, tipo: novoTipo } : foto)));
  }

  async consultarPlantnet(): Promise<void> {
    if (!this.fotosEditaveis().length) {
      return;
    }

    this.consultandoPlantnet.set(true);
    this.erro.set(null);
    try {
      const sugestoes = await this.plantnetService.identificarEspecie(this.fotosEditaveis());
      this.sugestoes.set(sugestoes);
      this.sugestaoSelecionadaIndex.set(null);
      await this.arvoresService.salvarSugestoesPlantnet(this.id, sugestoes);
    } catch (erro) {
      console.error('[ArvoreModerar] Falha ao consultar Pl@ntNet', erro);
      this.erro.set('Não foi possível consultar o Pl@ntNet agora. Tente novamente.');
    } finally {
      this.consultandoPlantnet.set(false);
    }
  }

  selecionarSugestao(indice: number): void {
    const sugestao = this.sugestoes()[indice];
    if (!sugestao) {
      return;
    }
    this.sugestaoSelecionadaIndex.set(indice);
    this.especieCientificaControl.setValue(sugestao.nomeCientifico);
    this.form.patchValue({ especie: sugestao.nomesComuns[0] ?? this.form.controls.especie.value });
  }

  async validar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.validando.set(true);
    this.erro.set(null);
    try {
      const dados = this.form.getRawValue();
      await this.arvoresService.validarArvore(this.id, {
        especie: dados.especie.trim() || null,
        especieCientifica: this.especieCientificaControl.value?.trim() || null,
        diametroCm: dados.diametroCm,
        estado: dados.estado,
        observacoes: dados.observacoes.trim(),
        fotos: this.fotosEditaveis(),
        sugestoesPlantnet: this.sugestoes().length ? this.sugestoes() : null,
      });
      this.snackBar.open('Registro validado.', 'Fechar', { duration: 4000 });
      this.router.navigateByUrl('/arvores');
    } catch (erro) {
      console.error('[ArvoreModerar] Falha ao validar o registro', erro);
      this.erro.set('Não foi possível validar o registro. Tente novamente.');
    } finally {
      this.validando.set(false);
    }
  }
}
