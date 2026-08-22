import { Component, signal, inject, OnInit, Injector } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('avm_app');
  private readonly swUpdate = inject(SwUpdate);
  private readonly injector = inject(Injector);

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
