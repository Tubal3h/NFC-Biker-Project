import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router'; // Aggiungi RouterModule per routerLink
import { ApiService } from '@app/core/services/api';
import { AuthService } from '@app/core/services/auth'; // Importiamo anche AuthService

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login implements OnInit {
  // NON CI SERVE PIÙ QUESTO OUTPUT. La gestione del login ora è centralizzata.
  // @Output() loginSuccess = new EventEmitter<AuthUser>();
  /* -------------------------------------------------------------------------- */
  /*                                  Proprietà                                */
  /* -------------------------------------------------------------------------- */
  email = '';
  password = '';
  errorMsg = '';
  isLoggingIn = false; // Per disabilitare il pulsante durante la chiamata

  /* -------------------------------------------------------------------------- */
  /*                                  Iniezione                                 */
  /* -------------------------------------------------------------------------- */
  private nfcId: string | null = null;
  private returnUrl: string | null = null;

  private api = inject(ApiService);
  private authService = inject(AuthService); // <-- Inietta il servizio di autenticazione
  private router = inject(Router);
  private route = inject(ActivatedRoute); // Inietta ActivatedRoute

  ngOnInit(): void {
    this.nfcId = this.route.snapshot.queryParamMap.get('nfcId');
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
  }
  /**
   * Gestisce il tentativo di login dell'utente.
   */
doLogin() {
  if (this.isLoggingIn) return;

  this.errorMsg = '';
  if (!this.email || !this.password) {
    this.errorMsg = 'Compila tutti i campi';
    return;
  }

  this.isLoggingIn = true;

  this.api.login(this.email, this.password).subscribe({
    next: (response) => {
      if (response.success && response.data) {
        
        // <-- ECCO LA RIGA MANCANTE E FONDAMENTALE! -->
        // Prima di fare qualsiasi altra cosa, salviamo l'utente!
        this.authService.login(response.data);

        // Ora che l'utente è salvato, possiamo navigare
        if (this.nfcId) {
          this.router.navigate(['/claim', this.nfcId]);
        } else if (this.returnUrl) {
          this.router.navigateByUrl(this.returnUrl);
        } else {
          this.router.navigate(['/dashboard']);
        }
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
