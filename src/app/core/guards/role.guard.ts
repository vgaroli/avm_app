import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs';
import { PapelPessoa } from '../models/pessoa.model';
import { AuthService } from '../services/auth.service';

export const roleGuard = (papeisPermitidos: Exclude<PapelPessoa, null> | Exclude<PapelPessoa, null>[]): CanActivateFn => {
  const papeis = Array.isArray(papeisPermitidos) ? papeisPermitidos : [papeisPermitidos];

  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.currentPessoa$.pipe(
      take(1),
      map((pessoa) => {
        const autorizado = !!pessoa && pessoa.status === 'ativo' && !!pessoa.papel && papeis.includes(pessoa.papel);
        return autorizado || router.createUrlTree(['/']);
      }),
    );
  };
};
