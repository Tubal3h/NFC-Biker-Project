// in src/app/features/dashboard/dashboard.ts

import { Component, inject, OnInit } from '@angular/core'; // Aggiungi OnInit
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '@app/core/services/auth';
import { ApiService } from '@app/core/services/api'; // Importa ApiService
import { forkJoin } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUsers, faUserAstronaut, faHelmetSafety, faGear, faExclamationTriangle, faPaperPlane, faSpinner   } from '@fortawesome/free-solid-svg-icons';
import { NotificationService } from '@app/core/services/notification';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule , FontAwesomeModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  private authService = inject(AuthService);
  private apiService = inject(ApiService); 
  private notificationService = inject(NotificationService);

  user$ = this.authService.user$;

  icons = {
    faUsers,
    faUserAstronaut,
    faHelmetSafety,
    faGear,
    faWarning: faExclamationTriangle,
    faSend: faPaperPlane,
    faSpinner: faSpinner
  };

  // Nuovo stato per memorizzare la lista dei tag
  profileCount = 0;
  tagCount = 0;
  userName: string | null = null;
  isLoadingData = true;

    // Stato specifico per la verifica
  daysUntilDeletion: number | null = null;
  isResendingEmail = false;

  ngOnInit(): void {
    this.loadDashboardData();
    this.checkVerificationStatus();
  }

  loadDashboardData(): void {
    const currentUser = this.authService.user;
    if (!currentUser?.id || !currentUser?.mainProfileId) {
      this.isLoadingData = false;
      return;
    }

    this.isLoadingData = true;
    
    // Usiamo forkJoin per eseguire le chiamate API contemporaneamente
    forkJoin({
      mainProfile: this.apiService.getMedicalProfileById(currentUser.mainProfileId),
      profiles: this.apiService.getUserProfiles(currentUser.id),
      tags: this.apiService.getUserTags(currentUser.id)
    }).subscribe({
      next: ({ mainProfile, profiles, tags }) => {
        if (mainProfile.success && mainProfile.data) {
          // Estraiamo il nome dal profilo principale per il saluto
          this.userName = mainProfile.data.name;
        }
        if (profiles.success && profiles.data) {
          this.profileCount = profiles.data.length;
        }
        if (tags.success && tags.data) {
          this.tagCount = tags.data.length;
        }
        this.isLoadingData = false;
      },
      error: () => {
        this.isLoadingData = false;
        // Qui potresti mostrare una notifica di errore se il caricamento fallisce
      }
    });
  }

    /**
   * Controlla lo stato di verifica dell'utente e calcola i giorni rimanenti.
   */
  private checkVerificationStatus(): void {
    const currentUser = this.authService.user;
    if (currentUser && !currentUser.isVerified && currentUser.createdAt) {
      const creationDate = new Date(currentUser.createdAt);

      // --- ECCO LA MODIFICA ---
      // Imposta la scadenza a 90 giorni dalla data di creazione
      const expirationDate = new Date(creationDate.setDate(creationDate.getDate() + 90));
      // --- FINE MODIFICA ---

      const today = new Date();
      const timeDiff = expirationDate.getTime() - today.getTime();
      this.daysUntilDeletion = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
    }
  }

  /**
   * Chiama l'API per inviare nuovamente l'email di verifica.
   */
  resendVerificationEmail(): void {
    if (this.isResendingEmail) return;

    this.isResendingEmail = true;
    // NOTA: Dovrai creare il metodo 'resendVerificationEmail' in ApiService
    // che farà una POST a '/api/auth/resend-verification'
    this.apiService.resendVerificationEmail().subscribe({
      next: () => {
        this.notificationService.showSuccess('Email di verifica inviata di nuovo. Controlla la tua casella di posta, inclusa la cartella spam.');
        this.isResendingEmail = false;
      },
      error: (err) => {
        this.notificationService.showError(err.error?.error || 'Si è verificato un errore.');
        this.isResendingEmail = false;
      }
    });
  }
}