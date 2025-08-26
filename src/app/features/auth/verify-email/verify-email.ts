import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router  } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSpinner, faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '@app/core/services/auth';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiResponse, AuthUser } from '@app/core/models';

// Importa il tuo ApiService per centralizzare le chiamate
import { ApiService } from '@app/core/services/api';

// Definiamo un tipo per gestire lo stato della vista in modo pulito e robusto
type VerificationStatus = 'loading' | 'success' | 'error';
@Component({
  selector: 'app-verify-email',
  imports: [CommonModule, RouterModule, FontAwesomeModule],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.scss'
})
export class VerifyEmail implements OnInit {
  // Iniezione delle dipendenze con il metodo moderno inject()
  private route = inject(ActivatedRoute);
  private apiService = inject(ApiService);
  private router = inject(Router);
  private authService = inject(AuthService);

  // Proprietà per gestire lo stato e i messaggi mostrati nel template
  status: VerificationStatus = 'loading';
  errorMessage = 'Si è verificato un errore imprevisto.';

  // Icone di FontAwesome per un feedback visivo immediato
  icons = {
    loading: faSpinner,
    success: faCheckCircle,
    error: faTimesCircle
  };

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token');

    if (!token) {
      this.status = 'error';
      this.errorMessage = 'Token di verifica non trovato. Controlla il link che hai ricevuto via email.';
      return;
    }
    
    this.verifyUserToken(token);
  }

  /**
   * Chiama il servizio API per validare il token di verifica.
   * @param token Il token estratto dall'URL.
   */
  private verifyUserToken(token: string): void {
    this.apiService.verifyEmail(token).subscribe({
      next: (response: ApiResponse<{ message: string; user: AuthUser; token:string; }>) => {
        // --- CORREZIONE: Aggiungi un controllo di sicurezza ---
        if (response.success && response.data) {
          this.status = 'success';
          
          const { user, token } = response.data; // Ora questa riga è sicura
          const wasAlreadyLoggedIn = this.authService.isLogged;

          if (user && token) {
            this.authService.login(user, token);
          }

          if (wasAlreadyLoggedIn) {
            setTimeout(() => {
              this.router.navigate(['/dashboard']);
            }, 2000);
          }
        } else {
          // Gestisce il caso in cui la chiamata ha successo ma non ci sono dati
          this.status = 'error';
          this.errorMessage = response.error || 'Risposta non valida dal server.';
        }
      },
      error: (err: HttpErrorResponse) => {
        this.status = 'error';
        this.errorMessage = err.error?.error || 'Il token non è valido o è scaduto.';
      }
    });
  }

  
}
