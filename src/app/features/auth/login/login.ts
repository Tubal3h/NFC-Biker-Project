import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; // Aggiungi RouterModule per routerLink
import { ApiService } from '@app/core/services/api';
import { AuthService } from '@app/core/services/auth'; // Importiamo anche AuthService
import { AuthUser } from '@app/core/models'; // <-- MODIFICA 1: Importa AuthUser, non User

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  // NON CI SERVE PIÙ QUESTO OUTPUT. La gestione del login ora è centralizzata.
  // @Output() loginSuccess = new EventEmitter<AuthUser>();

  email = '';
  password = '';
  errorMsg = '';
  isLoggingIn = false; // Per disabilitare il pulsante durante la chiamata

  // Iniezione dei servizi necessari
  private api = inject(ApiService);
  private authService = inject(AuthService); // <-- Inietta il servizio di autenticazione
  private router = inject(Router);

  /**
   * Gestisce il tentativo di login dell'utente.
   */
  doLogin() {
    if (this.isLoggingIn) return; // Previene doppi click

    this.errorMsg = '';
    if (!this.email || !this.password) {
      this.errorMsg = 'Compila tutti i campi';
      return;
    }

    this.isLoggingIn = true;

    this.api.login(this.email, this.password).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // --- MODIFICA 2 (LOGICA CENTRALE) ---
          // Se il login ha successo, non emettiamo più un evento.
          // Chiamiamo direttamente l'AuthService per salvare lo stato dell'utente.
          this.authService.login(response.data);
          
          // Dopo il login, reindirizziamo l'utente alla sua dashboard.
          this.router.navigate(['/dashboard']);
          
        } else {
          this.errorMsg = response.error || 'Credenziali non valide.';
        }
        this.isLoggingIn = false;
      },
      error: (err) => {
        console.error("Errore durante il login:", err);
        this.errorMsg = 'Errore di connessione con il server.';
        this.isLoggingIn = false;
      }
    });
  }
}
