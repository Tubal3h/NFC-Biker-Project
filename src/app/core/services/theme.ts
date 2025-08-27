// in src/app/core/services/theme.service.ts
import { Injectable, RendererFactory2, Renderer2 } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Theme {
  private renderer: Renderer2;
  private _isDark = new BehaviorSubject<boolean>(false);
  isDark$ = this._isDark.asObservable();

  constructor(rendererFactory: RendererFactory2) {
    // Usiamo Renderer2 per manipolare il DOM in modo sicuro
    this.renderer = rendererFactory.createRenderer(null, null);
    this.initializeTheme();
  }

  private initializeTheme() {
    const storedTheme = localStorage.getItem('isDarkMode');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // La scelta dell'utente ha la priorità, altrimenti usa le preferenze di sistema
    const initialIsDark = storedTheme !== null ? JSON.parse(storedTheme) : prefersDark;
    
    this.setTheme(initialIsDark);
  }

  toggleTheme() {
    this.setTheme(!this._isDark.value);
  }

  private setTheme(isDark: boolean) {
    this._isDark.next(isDark);
    localStorage.setItem('isDarkMode', JSON.stringify(isDark));

    if (isDark) {
      this.renderer.addClass(document.body, 'dark-theme');
    } else {
      this.renderer.removeClass(document.body, 'dark-theme');
    }
  }
}