// in src/app/core/services/auth.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthUser } from '@app/core/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user$ = new BehaviorSubject<AuthUser | null>(null);
  readonly user$: Observable<AuthUser | null> = this._user$.asObservable();
  
  private _isInitialized$ = new BehaviorSubject<boolean>(false);
  readonly isInitialized$: Observable<boolean> = this._isInitialized$.asObservable();

  constructor() {
    this.loadUserFromStorage();
  }

  get user(): AuthUser | null { return this._user$.value; }
  
  /**
   * Controlla se l'utente è loggato, verificando la presenza
   * sia dei dati utente che del token di autenticazione.
   */
  get isLogged(): boolean { return !!this.user && !!this.getToken(); }

  /**
   * Recupera il token di autenticazione dal localStorage.
   * @returns Il token come stringa, o null se non presente.
   */
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Carica i dati dell'utente e il token dal localStorage all'avvio dell'app
   * per mantenere la sessione.
   */
  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem('user');
    const token = this.getToken();

    if (userStr && token) {
      try {
        const user = JSON.parse(userStr);
        this._user$.next(user as AuthUser);
      } catch (e) {
        this.logout(); // Se i dati sono corrotti, pulisce la sessione.
      }
    }
    this._isInitialized$.next(true);
  }

  /**
   * Gestisce il login iniziale. Salva i dati dell'utente e il nuovo token.
   * @param user L'oggetto con i dati dell'utente.
   * @param token Il token JWT ricevuto dal server.
   */
  login(user: AuthUser, token: string): void {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('auth_token', token);
    this._user$.next(user);
  }

  /**
   * Aggiorna i dati dell'utente nel localStorage e nello stato dell'app
   * senza modificare il token di sessione.
   * @param user L'oggetto utente con i dati aggiornati.
   */
  updateUser(user: AuthUser): void {
    localStorage.setItem('user', JSON.stringify(user));
    this._user$.next(user);
  }

  /**
   * Esegue il logout, rimuovendo tutti i dati di sessione.
   */
  logout(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
    this._user$.next(null);
  }
}