// in src/app/shared/components/navbar/navbar.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@app/core/services/auth';
import { Theme } from '@app/core/services/theme';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';
import { FaIconComponent } from "@fortawesome/angular-fontawesome";

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FaIconComponent],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar {
  auth = inject(AuthService);
  theme = inject(Theme);
  private router = inject(Router);
  user$ = this.auth.user$;
  isDark$ = this.theme.isDark$;

  // Icone per il tema
  faSun = faSun;
  faMoon = faMoon;

  // Stato per il menu mobile
  isMenuOpen = false;

  // Apre e chiude il menu
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  // Chiude il menu (utile quando si clicca un link)
  closeMenu() {
    this.isMenuOpen = false;
  }
  
  // Esegue il logout e chiude il menu
  logoutAndCloseMenu() {
    this.auth.logout();
    this.closeMenu();
    this.router.navigate(['/homepage']);
  }
  
  // Funzione di logout separata per il pulsante desktop
  logout() {
    this.auth.logout();
    this.router.navigate(['/homepage']);
  }

    // NUOVO METODO PER IL TEMA
  toggleTheme() {
    this.theme.toggleTheme();
  }
}