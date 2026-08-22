import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { QRCodeComponent } from 'angularx-qrcode';
import { PAPEL_PESSOA_LABEL } from '../../core/models/pessoa.model';
import { AuthService } from '../../core/services/auth.service';
import { iniciais } from '../../core/utils/avatar.util';
import { BackButtonComponent } from '../../shared/components/back-button.component';

@Component({
  selector: 'app-credencial',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, QRCodeComponent, BackButtonComponent],
  templateUrl: './credencial.component.html',
  styleUrl: './credencial.component.scss',
})
export class CredencialComponent {
  private readonly authService = inject(AuthService);

  readonly pessoa = toSignal(this.authService.currentPessoa$, { initialValue: null });

  readonly papelLabel = computed(() => {
    const papel = this.pessoa()?.papel;
    return papel ? PAPEL_PESSOA_LABEL[papel] : '';
  });

  readonly numeroAssociado = computed(() => this.pessoa()?.uid.slice(-6).toUpperCase() ?? '');

  readonly nomeExibido = computed(() => {
    const p = this.pessoa();
    return p?.nomeExibicao || p?.nomeCompleto || '';
  });

  readonly iniciaisNome = computed(() => iniciais(this.nomeExibido()));
}
