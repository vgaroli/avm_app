import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const senhaProvisoriaGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentPessoa$.pipe(
    take(1),
    map((pessoa) => {
      const precisaTrocarSenha = !!pessoa?.senhaProvisoria;
      return !precisaTrocarSenha || router.createUrlTree(['/trocar-senha']);
    }),
  );
};
