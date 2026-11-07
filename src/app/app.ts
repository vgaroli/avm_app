import { Component, signal, inject, OnInit, Injector } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { filter, map } from 'rxjs';
import { AssinaturaProntoComponent } from './shared/components/assinatura-pronto/assinatura-pronto.component';

function semQueryNemFragmento(url: string): string {
  return url.split(/[?#]/)[0];
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AssinaturaProntoComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('avm_app');
  private readonly swUpdate = inject(SwUpdate);
  private readonly injector = inject(Injector);
  private readonly router = inject(Router);

  // Na home o rodapé fica dentro do <main> rolável, acima da barra inferior fixa.
  protected readonly naHome = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => semQueryNemFragmento(e.urlAfterRedirects) === '/'),
    ),
    { initialValue: semQueryNemFragmento(this.router.url) === '/' },
  );

  ngOnInit() {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.subscribe((event) => {
        if (event.type === 'VERSION_READY') {
          this.avisarNovaVersao();
        }
      });
    }
  }

  // Carregado sob demanda: MatSnackBar traz o overlay do CDK, que só vale a
  // pena baixar no raro caso em que uma atualização realmente está disponível.
  private async avisarNovaVersao(): Promise<void> {
    const { MatSnackBar } = await import('@angular/material/snack-bar');
    const snackBar = this.injector.get(MatSnackBar);
    const referencia = snackBar.open('Há uma nova versão do app disponível.', 'Atualizar');
    referencia.onAction().subscribe(() => window.location.reload());
  }
}
