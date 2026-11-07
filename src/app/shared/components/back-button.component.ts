import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-back-button',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <button mat-icon-button [routerLink]="destino()" [attr.aria-label]="rotulo()" class="back-button">
      <mat-icon>arrow_back</mat-icon>
    </button>
  `,
  styles: [
    `
      .back-button {
        color: inherit;
      }
    `,
  ],
})
export class BackButtonComponent {
  readonly destino = input<string | unknown[]>('/');
  readonly rotulo = input('Voltar para o início');
}
