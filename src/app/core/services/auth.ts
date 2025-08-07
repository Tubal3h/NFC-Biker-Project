// in src/app/core/services/auth.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthUser } from '@app/core/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user$ = new BehaviorSubject<AuthUser | null>(this.loadUser());
  readonly user$: Observable<AuthUser | null> = this._user$.asObservable();

  get user(): AuthUser | null { return this._user$.value; }
  get isLogged(): boolean { return !!this.user; }

  private loadUser(): AuthUser | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      const user = JSON.parse(userStr);
      // Controlla se l'ID è nel formato _id e lo converte
      if (user._id && !user.id) {
        user.id = user._id;
        delete user._id;
      }
      return user as AuthUser;
    } catch (e) {
      return null;
    }
  }

  login(user: any) { // Accetta 'any' per essere più flessibile
    // Controlla se l'ID è nel formato _id e lo converte
    if (user._id && !user.id) {
      user.id = user._id;
      delete user._id;
    }
    localStorage.setItem('user', JSON.stringify(user));
    this._user$.next(user as AuthUser);
  }

  logout() {
    localStorage.removeItem('user');
    this._user$.next(null);
  }
}