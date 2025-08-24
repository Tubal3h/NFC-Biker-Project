// in src/app/app.config.ts

import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // Provider fondamentale di Angular per il rilevamento delle modifiche
    provideZoneChangeDetection({ eventCoalescing: true }),

    // Provider per la gestione delle rotte
    provideRouter(routes, withComponentInputBinding()),

    // Provider per le animazioni (richiesto da ngx-toastr)
    provideAnimations(),

    // Provider per le chiamate HTTP, con il nostro interceptor e withFetch
    provideHttpClient(
      withInterceptors([authInterceptor]),
      withFetch()
    ),
    
    // Provider per il servizio di notifiche (ngx-toastr)
    provideToastr({
      positionClass: 'toast-bottom-center',
      timeOut: 5000,
      preventDuplicates: true,
      progressBar: true,
      closeButton: true,
    }),
  ]
};