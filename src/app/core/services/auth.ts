// in src/app/core/services/auth.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

// PASSO 1: IMPORTA la definizione UFFICIALE dal nostro file dei modelli.
import { AuthUser } from '@app/core/models'; 

// PASSO 2: CANCELLA la vecchia definizione locale.
/*
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  // altri campi se vuoi (ruoli, premium, etc)
}
*/

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user$ = new BehaviorSubject<AuthUser | null>(this.loadUser());
  readonly user$: Observable<AuthUser | null> = this._user$.asObservable();

  // Getter sincrono (comodità)
  get user(): AuthUser | null { return this._user$.value; }
  get isLogged(): boolean { return !!this.user; }

  private loadUser(): AuthUser | null {
    const userStr = localStorage.getItem('user');
    // Se ci sono dati in localStorage, li interpretiamo come un AuthUser completo.
    return userStr ? (JSON.parse(userStr) as AuthUser) : null;
  }

  /**
   * Questo metodo viene chiamato dopo una chiamata API di login andata a buon fine.
   * Riceve l'oggetto utente COMPLETO dal backend (incluso premium, nfcTags, etc.).
   */
  login(user: AuthUser) {
    localStorage.setItem('user', JSON.stringify(user));
    this._user$.next(user);
  }

  /**
   * Rimuove l'utente dal localStorage e notifica l'applicazione.
   */
  logout() {
    localStorage.removeItem('user');
    this._user$.next(null);
  }
}