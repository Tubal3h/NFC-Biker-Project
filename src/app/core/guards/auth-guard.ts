// core/guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const isLogged = !!localStorage.getItem('user'); // esempio: login check
  if (!isLogged) {
    router.navigate(['/claim']); // o /login
    return false;
  }
  return true;
};
(authGuard as any).standalone = true; // Opzionale, per compatibilità Angular 16+
