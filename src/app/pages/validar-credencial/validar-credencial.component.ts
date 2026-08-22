import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { take } from 'rxjs';
import { BarcodeFormat } from '@zxing/library';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { PAPEL_PESSOA_LABEL } from '../../core/models/pessoa.model';
import { Credencial } from '../../core/models/credencial.model';
import { CredenciaisService } from '../../core/services/credenciais.service';
import { iniciais } from '../../core/utils/avatar.util';
import { BackButtonComponent } from '../../shared/components/back-button.component';

type EstadoValidacao = 'escaneando' | 'buscando' | 'resultado' | 'nao-encontrada' | 'erro-camera';

@Component({
  selector: 'app-validar-credencial',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule, ZXingScannerModule, BackButtonComponent],
  templateUrl: './validar-credencial.component.html',
  styleUrl: './validar-credencial.component.scss',
})
export class ValidarCredencialComponent {
  private readonly credenciaisService = inject(CredenciaisService);

  readonly PAPEL_PESSOA_LABEL = PAPEL_PESSOA_LABEL;
  readonly formatosAceitos = [BarcodeFormat.QR_CODE];

  readonly estado = signal<EstadoValidacao>('escaneando');
  readonly credencial = signal<Credencial | null>(null);
  readonly scannerAtivo = signal(true);

  iniciaisDe(nome: string): string {
    return iniciais(nome);
  }

  aoEscanear(uid: string): void {
    if (this.estado() === 'buscando' || this.estado() === 'resultado' || this.estado() === 'nao-encontrada') {
      return;
    }

    this.scannerAtivo.set(false);
    this.estado.set('buscando');

    this.credenciaisService.buscarPorId(uid).pipe(take(1)).subscribe({
      next: (credencial) => {
        this.credencial.set(credencial);
        this.estado.set(credencial ? 'resultado' : 'nao-encontrada');
      },
      error: () => {
        this.credencial.set(null);
        this.estado.set('nao-encontrada');
      },
    });
  }

  aoSemCameras(): void {
    this.estado.set('erro-camera');
  }

  aoRespostaPermissao(permitido: boolean): void {
    if (!permitido) {
      this.estado.set('erro-camera');
    }
  }

  escanearNovamente(): void {
    this.credencial.set(null);
    this.estado.set('escaneando');
    this.scannerAtivo.set(true);
  }
}
