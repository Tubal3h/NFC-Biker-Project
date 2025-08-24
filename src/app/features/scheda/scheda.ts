// in src/app/features/scheda/scheda.ts

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '@app/core/services/api';
import { AuthService } from '@app/core/services/auth';
import { NotificationService } from '@app/core/services/notification';
import { MedicalProfile, AuthUser, NfcTag } from '@app/core/models';
import { forkJoin, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-scheda',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './scheda.html',
  styleUrl: './scheda.scss'
})
export class Scheda implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  auth = inject(AuthService);
  private notification = inject(NotificationService);

  // Stato della Pagina
  isLoading = true;
  errorMsg = '';
  isCardEmpty = false;
  isSwitching = false;

  // Dati da Visualizzare
  user: AuthUser | null = null;
  medicalData: MedicalProfile | null = null;
  
  // Logica per lo Switch
  isOwner = false;
  availableProfiles: MedicalProfile[] = [];
  selectedProfileId: string | null = null;

  // Logica per il Popup
  showPrivacyPopup = true;
  visitorIp: string | null = null;
  visitorLocation: string | null = null;
  private nfcId: string | null = null;

  constructor() { /* ... non cambia ... */ }

  ngOnInit(): void {
    this.nfcId = this.route.snapshot.paramMap.get('nfcId');
    if (!this.nfcId) {
      this.errorMsg = 'ID del tag non fornito.';
      this.isLoading = false;
      return;
    }
    this.loadAllData(this.nfcId);
  }

  // --- FUNZIONE DI CARICAMENTO COMPLETAMENTE Riscritto ---
  private loadAllData(nfcId: string): void {
    this.isLoading = true;
    let loadedUserId: string;

    this.api.getTag(nfcId).pipe(
      switchMap(tagRes => {
        if (!tagRes.success || !tagRes.data?.userId) throw new Error('Tag non valido o non associato.');
        
        loadedUserId = tagRes.data.userId;
        this.isOwner = this.auth.user?.id === loadedUserId;
        
        const isPremiumOwner = this.isOwner && this.auth.user?.premium;
        
        // Costruiamo le chiamate API necessarie
        const requests = {
          userResponse: this.api.getUser(loadedUserId),
          medicalResponse: this.api.getMedicalProfileById(tagRes.data.profileId!),
          // Carica la lista di profili SOLO se l'utente è proprietario e premium
          profilesListResponse: isPremiumOwner ? this.api.getUserProfiles(loadedUserId) : of({ success: true, data: [] })
        };
        return forkJoin(requests);
      }),
      catchError(error => {
        this.errorMsg = error.message || 'Errore di rete.';
        this.isLoading = false;
        return of(null);
      })
    ).subscribe(responses => {
      if (!responses) return;

      const { userResponse, medicalResponse, profilesListResponse } = responses;
      
      if (userResponse.success && userResponse.data) this.user = userResponse.data;
      if (medicalResponse.success && medicalResponse.data) this.medicalData = medicalResponse.data;
      if (profilesListResponse.success && profilesListResponse.data) this.availableProfiles = profilesListResponse.data;
      
      if (!this.user || !this.medicalData) {
        this.errorMsg = this.errorMsg || "Dati utente o medici non trovati.";
      } else if (this.isMedicalDataEmpty(this.medicalData)) {
        this.isCardEmpty = true;
        this.errorMsg = 'Scheda medica non compilata.';
      }
      
      // Imposta il valore di default della tendina
      this.selectedProfileId = this.medicalData?.id || null;
      this.isLoading = false;
    });
  }

  /**
   * Chiamato quando l'utente cambia profilo e clicca Salva.
   */
  onProfileSwitch(): void {
    if (!this.nfcId || !this.selectedProfileId) return;

    this.isSwitching = true;
    this.api.switchTagProfile(this.nfcId, this.selectedProfileId).subscribe({
      next: () => {
        this.notification.showSuccess('Profilo del casco aggiornato con successo!');
        // Ricarichiamo TUTTI i dati per mostrare le informazioni aggiornate
        this.loadAllData(this.nfcId!);
      },
      error: (err) => this.notification.showError(err.error?.error || 'Errore durante l-aggiornamento.'),
      complete: () => this.isSwitching = false
    });
  }
  
  private isMedicalDataEmpty(data: MedicalProfile): boolean {
    return !data.bloodType && !data.allergies?.trim() && !data.conditions?.trim() && !data.notes?.trim() && (!data.emergencyContacts || data.emergencyContacts.length === 0);
  }
  
  // ... (tutte le altre funzioni: goToClaim, goToDashboard, goToLogin, acceptPrivacy, etc.) ...
  
  goToClaim(): void {
    if (this.nfcId) {
      this.router.navigate(['/claim', this.nfcId]);
    }
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  goToLogin(): void {
    this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
  }

  acceptPrivacy(): void {
    this.showPrivacyPopup = false;
  }

  cancelAndGoBack(): void {
    this.router.navigate(['/homepage']);
  }

// in scheda.ts

  private loadVisitorInfo(): void {
    // Carica l'IP (invariato)
    fetch('https://api.ipify.org/?format=json')
      .then(r => r.json())
      .then(data => this.visitorIp = data.ip)
      .catch(() => this.visitorIp = 'Non rilevato');

    // Carica la geolocalizzazione (ORA FUNZIONANTE)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          // Chiama il nostro backend invece di OpenStreetMap direttamente
          this.api.getLocationInfo(pos.coords.latitude, pos.coords.longitude).subscribe(res => {
            if (res.success && res.data) {
              this.visitorLocation = res.data.location;
            } else {
              this.visitorLocation = `Lat: ${pos.coords.latitude.toFixed(2)}, Lon: ${pos.coords.longitude.toFixed(2)}`;
            }
          });
        },
        () => { this.visitorLocation = 'Posizione non autorizzata'; }
      );
    } else {
      this.visitorLocation = 'Geolocalizzazione non supportata';
    }
  }
}