// in src/app/core/services/auth.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
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
  get isLogged(): boolean { return !!this.user; }

  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this._user$.next(user as AuthUser);
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    this._isInitialized$.next(true); // Segnala che l'inizializzazione è completa
  }

  login(user: AuthUser): void {
    localStorage.setItem('user', JSON.stringify(user));
    this._user$.next(user);
  }

  logout(): void {
    localStorage.removeItem('user');
    this._user$.next(null);
  }
}