import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter , withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { provideToastr } from 'ngx-toastr';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withFetch()),
    
    provideAnimations(), // richiesto per le animazioni di ngx-toastr
    provideToastr({      // configurazione opzionale per i toast
      positionClass: 'toast-bottom-center', // Posizione dei toast
      timeOut: 5000,                      // Il toast scompare dopo 5 secondi
      preventDuplicates: true,            // Evita di mostrare toast identici
      progressBar: true,                  // Aggiunge una barra di progresso visiva
      closeButton: true,                  // Aggiunge un pulsante per chiudere il toast
    }),
  ]
};
