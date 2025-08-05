// Sostituisci il contenuto di navbar.component.ts con questo
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss']
})
export class Navbar {
  auth = inject(AuthService);
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
  }
}