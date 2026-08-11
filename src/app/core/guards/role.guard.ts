import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs';
import { PapelPessoa } from '../models/pessoa.model';
import { AuthService } from '../services/auth.service';

export const roleGuard = (papelPermitido: PapelPessoa): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.currentPessoa$.pipe(
      take(1),
      map((pessoa) => {
        const autorizado = !!pessoa && pessoa.status === 'ativo' && pessoa.papel === papelPermitido;
        return autorizado || router.createUrlTree(['/']);
      }),
    );
  };
};
