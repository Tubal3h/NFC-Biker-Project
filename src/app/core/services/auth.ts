import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  // altri campi se vuoi (ruoli, premium, etc)
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user$ = new BehaviorSubject<AuthUser | null>(this.loadUser());
  readonly user$: Observable<AuthUser | null> = this._user$.asObservable();

  // Getter sincrono (comodità)
  get user(): AuthUser | null { return this._user$.value; }
  get isLogged(): boolean { return !!this.user; }

  private loadUser(): AuthUser | null {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  }

  /** Chiamato dopo login API */
  login(user: AuthUser) {
    localStorage.setItem('user', JSON.stringify(user));
    this._user$.next(user);
  }

  logout() {
    localStorage.removeItem('user');
    this._user$.next(null);
  }
}
