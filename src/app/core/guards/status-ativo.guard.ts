import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const statusAtivoGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentPessoa$.pipe(
    take(1),
    map((pessoa) => {
      const autorizado = !!pessoa && pessoa.status === 'ativo';
      return autorizado || router.createUrlTree(['/']);
    }),
  );
};
