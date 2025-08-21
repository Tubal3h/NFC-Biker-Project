// in src/app/shared/components/navbar/navbar.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@app/core/services/auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar {
  auth = inject(AuthService);
  private router = inject(Router);
  user$ = this.auth.user$;
  
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
}