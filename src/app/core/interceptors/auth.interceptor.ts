// in src/app/core/interceptors/auth.interceptor.ts

import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@app/core/services/auth';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const authToken = authService.getToken();

  if (authToken) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${authToken}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: any) => {
      // Controlliamo se l'errore è un errore HTTP e se lo stato è 401 (Token Scaduto)
      if (error instanceof HttpErrorResponse && error.status === 401) {
        
        // --- NUOVA LOGICA DI CONTROLLO ---
        // 1. Catturiamo l'URL della pagina in cui si trova l'utente
        const currentUrl = router.url;
        
        // 2. Controlliamo se l'utente è su una delle pagine "pubbliche"
        if (currentUrl.startsWith('/claim') || currentUrl.startsWith('/scheda')) {
          
          // Se sì, eseguiamo un "logout silenzioso" senza reindirizzare
          console.log('Token scaduto su una rotta pubblica. Eseguo logout silenzioso.');
          authService.logout();
          // La pagina si ricaricherà automaticamente mostrando la versione per utenti non loggati.
          
        } else {
          
          // Se l'utente è su una pagina protetta (es. /dashboard), lo reindirizziamo al login
          console.log('Token scaduto su una rotta protetta. Reindirizzo al login.');
          authService.logout();
          router.navigate(['/login'], { queryParams: { returnUrl: currentUrl } });
        }
        // --- FINE NUOVA LOGICA ---
      }
      
      // Rilanciamo l'errore per il componente
      return throwError(() => error);
    })
  );
};