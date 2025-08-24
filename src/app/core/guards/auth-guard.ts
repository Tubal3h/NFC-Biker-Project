// in src/app/core/guards/auth.guard.ts

import { inject } from '@angular/core';
// AGGIUNGIAMO ActivatedRouteSnapshot e RouterStateSnapshot
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth';
import { map, filter, switchMap } from 'rxjs/operators';

// AGGIUNGIAMO 'route' e 'state' come parametri della funzione
export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isInitialized$.pipe(
    filter(isInitialized => isInitialized),
    switchMap(() => authService.user$),
    map(user => {
      if (user) {
        return true; // Utente loggato, può procedere.
      }
      
      // --- ECCO LA CORREZIONE FONDAMENTALE ---
      // Se l'utente non è loggato, lo reindirizziamo al login,
      // passando l'URL a cui voleva andare (`state.url`) come parametro 'returnUrl'.
      return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
    })
  );
};