// in src/app/core/services/inactivity.service.ts

import { Injectable, NgZone } from '@angular/core';
import { AuthService } from './auth';
import { Router } from '@angular/router';
import { Subject, fromEvent, merge, timer } from 'rxjs';
import { switchMap, takeUntil, throttleTime } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class InactivityService {
  private inactive$ = new Subject<void>();
  private destroy$ = new Subject<void>();
  
  // Emette 'true' quando il popup di avviso deve essere visibile
  public showWarningPopup$ = new Subject<boolean>();

  constructor(
    private authService: AuthService,
    private router: Router,
    private ngZone: NgZone // Servizio di Angular per gestire eventi fuori dalla sua zona
  ) {}

  /**
   * Avvia il monitoraggio dell'inattività dell'utente.
   * @param timeoutMinutes La durata totale della sessione in minuti.
   */
  startWatching(timeoutMinutes: number): void {
    // Eventi che resettano il timer (indicano che l'utente è attivo)
    const activityEvents$ = merge(
      fromEvent(window, 'mousemove'),
      fromEvent(window, 'click'),
      fromEvent(window, 'keypress')
    ).pipe(throttleTime(1000)); // Considera attività al massimo ogni secondo

    const timeoutMs = timeoutMinutes * 60 * 1000;
    const warningMs = 2 * 60 * 1000; // Il popup appare 2 minuti prima della scadenza

    // Eseguiamo i timer fuori dalla zona di Angular per non appesantire l'app
    this.ngZone.runOutsideAngular(() => {
      activityEvents$.pipe(
        // Ad ogni attività, riavvia il timer
        switchMap(() => {
          this.hidePopup();
          // Timer che scatta 2 minuti prima della scadenza
          return timer(timeoutMs - warningMs).pipe(
            switchMap(() => {
              this.showPopup();
              // Secondo timer che scatta alla scadenza effettiva
              return timer(warningMs);
            })
          );
        }),
        takeUntil(this.destroy$)
      ).subscribe(() => {
        // Quando il secondo timer scade, emette il segnale di inattività
        this.inactive$.next();
      });
    });

    // Quando riceviamo il segnale di inattività, eseguiamo il logout
    this.inactive$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.logout();
    });
  }

  /**
   * Ferma il monitoraggio (es. al logout manuale).
   */
  stopWatching(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.hidePopup();
  }

  /**
   * Resetta il timer quando l'utente clicca "Resta Collegato".
   */
  resetTimer(): void {
    this.hidePopup();
    // Simula un'attività per far ripartire il timer da capo
    window.dispatchEvent(new Event('mousemove'));
  }

  private showPopup(): void {
    this.ngZone.run(() => this.showWarningPopup$.next(true));
  }

  private hidePopup(): void {
    this.ngZone.run(() => this.showWarningPopup$.next(false));
  }
  
  private logout(): void {
    this.ngZone.run(() => {
      this.stopWatching();
      this.authService.logout();
      // Reindirizza al login con un messaggio che spiega il motivo
      this.router.navigate(['/login'], { queryParams: { reason: 'session_expired' } });
    });
  }
}