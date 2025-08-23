// in src/app/features/claim/claim.ts

import { Component, inject, OnInit } from '@angular/core'; // Aggiunto OnInit
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '@app/core/services/api';
import { AuthService } from '@app/core/services/auth'; // Importiamo AuthService
import { ApiResponse, NfcTag, AuthUser } from '@app/core/models'; // <-- MODIFICA 1: Importa AuthUser
import { Observable } from 'rxjs';

@Component({
  selector: 'app-claim',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './claim.html',
  styleUrl: './claim.scss'
})
export class Claim implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService); // <-- Inietta AuthService

  nfcId: string | null = null;
  step: 'checking' | 'ok' | 'claimed' | 'notfound' = 'checking';
  
  // MODIFICA 2: La variabile 'user' ora è un Observable!
  user$: Observable<AuthUser | null>;

  claimResult = '';
  showPrivacy = false;
  visitorIp: string | null = null;
  visitorLocation: string | null = null;
  
  constructor() {
    // Il constructor ora è più pulito.
    // L'utente viene gestito in modo reattivo dall'AuthService.
    this.user$ = this.authService.user$;
  }

  ngOnInit(): void {
    this.nfcId = this.route.snapshot.paramMap.get('nfcId');
    if (!this.nfcId) {
      this.step = 'notfound';
      return;
    }
    this.checkTagStatus(this.nfcId);
  }

  /**
   * Controlla lo stato del tag NFC (libero, associato, non valido).
   */
  private checkTagStatus(nfcId: string): void {
    this.api.getTag(nfcId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          if (response.data.profileId || response.data.userId) {
            // Se il tag è già associato, reindirizza direttamente alla scheda.
            // L'avviso di privacy verrà gestito da 'SchedaComponent'.
            this.router.navigate(['/scheda', nfcId], { state: { showPrivacyWarning: true } });
          } else {
            // Se il tag è libero, la pagina è pronta per il claim.
            this.step = 'ok';
          }
        } else {
          this.step = 'notfound';
        }
      },
      error: () => {
        this.step = 'notfound';
      }
    });
  }

  /**
   * Associa il tag NFC all'utente attualmente loggato.
   */
  claimAuto(): void {
    const currentUserId = this.authService.user?.id;
    if (!this.nfcId || !currentUserId) {
      console.error("Impossibile associare: ID del tag o dell'utente mancante.");
      this.router.navigate(['/login'], { queryParams: { nfcId: this.nfcId } });
      return;
    }

    // Chiamiamo l'ApiService, che ora si aspetta di ricevere un profileId nella risposta
    this.api.claimNfc(this.nfcId, currentUserId).subscribe({
      next: (response) => {
        // --- QUESTA È LA NUOVA LOGICA ---
        if (response.success && response.data?.profileId) {
          // Se l'API ha successo e ci restituisce l'ID del profilo,
          // reindirizziamo l'utente all'URL di modifica corretto.
          console.log(`Tag associato, reindirizzamento al profilo: ${response.data.profileId}`);
          this.router.navigate(['/medical-form', response.data.profileId]);
          
        } else {
          // Se la risposta non contiene l'ID (caso anomalo), mostriamo un errore
          // e mandiamo l'utente alla pagina di gestione come fallback.
          this.claimResult = 'Associazione riuscita, ma si è verificato un errore nel reindirizzamento.';
          this.router.navigate(['/profile-management']);
        }
      },
      error: (err) => {
        // La tua gestione degli errori rimane identica
        if (err.error?.error?.includes('Limite massimo raggiunto')) {
          this.claimResult = 'Hai raggiunto il limite di 1 casco per l\'account gratuito.';
        } else {
          this.claimResult = err.error?.error || 'Errore durante l’associazione.';
        }
      }
    });
  }

  /**
   * Esegue il logout tramite AuthService e reindirizza.
   */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']); // Torna alla homepage dopo il logout
  }

  // Abbiamo rimosso la logica del popup della privacy da qui,
  // perché ora è gestita correttamente dal componente 'Scheda'.
}