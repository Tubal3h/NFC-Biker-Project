// in src/app/core/interceptors/auth.interceptor.ts

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '@app/core/services/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // 1. Inietta l'AuthService per accedere al token
  const authService = inject(AuthService);
  const authToken = authService.getToken();

  // 2. Se il token esiste, clona la richiesta e aggiungi l'header di autorizzazione
  if (authToken) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${authToken}` // Formato standard "Bearer TOKEN"
      }
    });
    // 3. Invia la richiesta modificata
    return next(authReq);
  }

  // 4. Se non c'è token, invia la richiesta originale senza modifiche
  return next(req);
};