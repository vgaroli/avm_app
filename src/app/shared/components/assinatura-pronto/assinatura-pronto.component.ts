import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-assinatura-pronto',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="assinatura">
      um produto
      <a class="marca" href="https://prontosolucoes.com.br/" target="_blank" rel="noopener"
         aria-label="Pronto Soluções (abre em nova aba)">
        <span class="pronto">Pronto</span> <span class="solucoes">Soluções</span>
      </a>
    </footer>
  `,
  styles: `
    :host { display: block; }

    .assinatura {
      font-size: 12px;
      line-height: 1.5;
      text-align: center;
      padding: 12px 16px;
      padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
      color: #5A6070;
      background: none;
      border: 0;
    }

    .marca {
      font-family: 'Outfit', sans-serif;
      color: #141A24;
      text-decoration: none;
      border-radius: 2px;
    }
    .marca:hover,
    .marca:focus-visible { text-decoration: underline; }
    .marca:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }

    .pronto { font-weight: 700; }
    .solucoes { font-weight: 300; }
  `,
})
export class AssinaturaProntoComponent {}
