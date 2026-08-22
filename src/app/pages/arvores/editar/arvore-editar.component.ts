import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { ArvoresService } from '../../../core/services/arvores.service';
import { Arvore, EstadoArvore } from '../../../core/models/arvore.model';
import { BackButtonComponent } from '../../../shared/components/back-button.component';
import { ArvoreCamposFormComponent, ArvoreCamposFormGroup } from '../shared/arvore-campos-form.component';

@Component({
  selector: 'app-arvore-editar',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, BackButtonComponent, ArvoreCamposFormComponent],
  templateUrl: './arvore-editar.component.html',
  styleUrl: './arvore-editar.component.scss',
})
export class ArvoreEditarComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly arvoresService = inject(ArvoresService);
  private readonly snackBar = inject(MatSnackBar);

  private readonly id = this.route.snapshot.paramMap.get('id')!;

  readonly arvore = signal<Arvore | null>(null);
  readonly carregando = signal(true);
  readonly salvando = signal(false);
  readonly excluindo = signal(false);
  readonly erro = signal<string | null>(null);

  readonly form: ArvoreCamposFormGroup = this.fb.nonNullable.group({
    especie: [''],
    diametroCm: this.fb.control<number | null>(null),
    estado: this.fb.nonNullable.control<EstadoArvore>('saudavel', Validators.required),
    observacoes: [''],
  });

  async ngOnInit(): Promise<void> {
    const arvore = await firstValueFrom(this.arvoresService.obterArvore$(this.id));
    if (!arvore) {
      this.erro.set('Árvore não encontrada.');
      this.carregando.set(false);
      return;
    }

    this.arvore.set(arvore);
    this.form.patchValue({
      especie: arvore.especie ?? '',
      diametroCm: arvore.diametroCm,
      estado: arvore.estado,
      observacoes: arvore.observacoes,
    });
    this.carregando.set(false);
  }

  async salvar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.salvando.set(true);
    this.erro.set(null);
    try {
      const dados = this.form.getRawValue();
      await this.arvoresService.atualizarArvore(this.id, {
        especie: dados.especie.trim() || null,
        diametroCm: dados.diametroCm,
        estado: dados.estado,
        observacoes: dados.observacoes.trim(),
      });
      this.snackBar.open('Alterações salvas com sucesso.', 'Fechar', { duration: 4000 });
      this.router.navigateByUrl('/arvores');
    } catch {
      this.erro.set('Não foi possível salvar as alterações. Tente novamente.');
    } finally {
      this.salvando.set(false);
    }
  }

  async excluir(): Promise<void> {
    const arvore = this.arvore();
    if (!arvore) {
      return;
    }

    const confirmado = confirm('Tem certeza que deseja excluir este registro? Essa ação não pode ser desfeita.');
    if (!confirmado) {
      return;
    }

    this.excluindo.set(true);
    this.erro.set(null);
    try {
      await this.arvoresService.excluirArvore(arvore);
      this.snackBar.open('Registro excluído com sucesso.', 'Fechar', { duration: 4000 });
      this.router.navigateByUrl('/arvores');
    } catch {
      this.erro.set('Não foi possível excluir o registro. Tente novamente.');
      this.excluindo.set(false);
    }
  }
}
