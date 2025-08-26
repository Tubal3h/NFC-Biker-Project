import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSpinner, faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';

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
    // NOTA: Dovrai creare il metodo 'verifyEmail' nel tuo ApiService.
    // Questo metodo farà una GET a `/api/auth/verify-email/${token}`
    this.apiService.verifyEmail(token).subscribe({
      next: () => {
        this.status = 'success';
      },
      error: (err) => {
        this.status = 'error';
        // Estraiamo un messaggio di errore specifico dall'API, se presente
        this.errorMessage = err.error?.error || 'Il token non è valido o è scaduto. Prova a registrarti di nuovo.';
      }
    });
  }
}
