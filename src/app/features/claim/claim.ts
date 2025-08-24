// in src/app/features/claim/claim.ts

import { Component, inject, OnInit } from '@angular/core'; // Aggiunto OnInit
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '@app/core/services/api';
import { AuthService } from '@app/core/services/auth'; // Importiamo AuthService
import { ApiResponse, NfcTag, AuthUser } from '@app/core/models'; // <-- MODIFICA 1: Importa AuthUser
import { NotificationService } from '@app/core/services/notification';
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
  private notification = inject(NotificationService); // <-- Inietta NotificationService

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
   * Associa il tag NFC all'utente e decide il reindirizzamento intelligente.
   */
  claimAuto(): void {
    const currentUser = this.authService.user;
    
    if (!this.nfcId || !currentUser?.id) {
      this.notification.showError("Per favore, effettua il login per associare un casco.");
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    this.api.claimNfc(this.nfcId, currentUser.id).subscribe({
      next: (response) => {
        // 1. Assegniamo .data a una variabile locale.
        const responseData = response.data;

        // 2. Facciamo il controllo sulla variabile locale. Ora TypeScript è sicuro.
        if (response.success && responseData && responseData.profileId) {
          
          this.notification.showSuccess('Casco associato con successo!');

          // 3. Logica di reindirizzamento intelligente
          if (currentUser.premium) {
            this.api.getUserProfiles(currentUser.id).subscribe(profileRes => {
              const profiles = profileRes.data;
              if (profileRes.success && profiles && profiles.length > 1) {
                // Utente Premium con PIÙ profili -> vai alla gestione generale
                this.router.navigate(['/profile-management']);
              } else {
                // Utente Premium con UN SOLO profilo -> vai a compilare quel profilo
                this.router.navigate(['/medical-form', responseData.profileId]);
              }
            });
          } else {
            // Utente Gratuito -> vai sempre a compilare il suo unico profilo
            this.router.navigate(['/medical-form', responseData.profileId]);
          }

        } else {
          this.notification.showError(response.error || 'Risposta dal server non valida.');
        }
      },
      error: (err) => {
        const errorMsg = err.error?.error || 'Errore di connessione.';
        this.notification.showError(errorMsg);
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