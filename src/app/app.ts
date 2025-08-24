// in src/app/app.component.ts

import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router'; // Importa Router
import { AuthService } from './core/services/auth';
import { InactivityService } from './core/services/inactivity';
import { CommonModule } from '@angular/common';
import { Navbar } from "./shared/components/navbar/navbar";
import { Footer } from "./shared/components/footer/footer";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, Navbar, Footer],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private auth = inject(AuthService);
  private router = inject(Router); // Inietta il Router
  inactivityService = inject(InactivityService);

  constructor() {
    // Quando l'utente fa login, avvia il monitoraggio.
    // Quando fa logout, lo ferma.
    this.auth.user$.subscribe(user => {
      if (user) {
        this.inactivityService.startWatching(30); // Imposta 30 minuti di sessione
      } else {
        this.inactivityService.stopWatching();
      }
    });
  }
  
  // Funzione per il pulsante "Resta Collegato"
  stay(): void {
    this.inactivityService.resetTimer();
  }

  // Funzione per il pulsante "Logout" nel popup
  logout(): void {
    this.auth.logout();
    // Non serve il router.navigate qui perché il servizio lo fa già
  }
}