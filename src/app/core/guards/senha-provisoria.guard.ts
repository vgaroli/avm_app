import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, of, switchMap, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

// currentPessoa$ é multicast com shareReplay, então um novo assinante pode
// receber via replay um valor obsoleto (de antes do login, para outro uid)
// antes que o docData do usuário recém-autenticado tenha emitido. Por isso
// esperamos explicitamente a emissão cujo uid bate com o usuário atual.
export const senhaProvisoriaGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    take(1),
    switchMap((user) =>
      !user
        ? of(null)
        : authService.currentPessoa$.pipe(
            filter((pessoa) => pessoa?.uid === user.uid),
            take(1),
          ),
    ),
    map((pessoa) => {
      const precisaTrocarSenha = !!pessoa?.senhaProvisoria;
      return !precisaTrocarSenha || router.createUrlTree(['/trocar-senha']);
    }),
  );
};
