// in src/app/features/scheda/scheda.ts

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '@app/core/services/api';
import { AuthService } from '@app/core/services/auth';
import { MedicalData, AuthUser, NfcTag } from '@app/core/models';
import { forkJoin, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-scheda',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './scheda.html',
  styleUrl: './scheda.scss'
})
export class Scheda implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);

  isLoading = true;
  errorMsg = '';
  isCardEmpty = false;
  user: AuthUser | null = null;
  medicalData: MedicalData | null = null;
   isLoggedIn = false;
  isOwner = false;
  showPrivacyPopup = false;
  visitorIp: string | null = null;
  visitorLocation: string | null = null;
  private nfcId: string | null = null;

  constructor() {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { showPrivacyWarning?: boolean };
    if (state?.showPrivacyWarning) {
      this.showPrivacyPopup = true;
      this.loadVisitorInfo();
    }
  }

  ngOnInit(): void {
     this.isLoggedIn = this.auth.isLogged;
    // La logica di caricamento inizia qui
    this.nfcId = this.route.snapshot.paramMap.get('nfcId');
    if (!this.nfcId) {
      this.errorMsg = 'ID del tag non fornito.';
      this.isLoading = false;
      return;
    }
    this.loadAllData(this.nfcId);
  }

  private loadAllData(nfcId: string): void {
    this.isLoading = true;

    // Iniziamo una catena di operazioni reattive
    this.api.getTag(nfcId).pipe(
      // Il primo passo è ottenere il tag. Se fallisce, l'errore viene catturato alla fine.
      switchMap(tagRes => {
        if (!tagRes.success || !tagRes.data?.userId) {
          // Se il tag non è valido, trasformiamo questo in un errore che blocca la catena.
          throw new Error('Tag non valido o non associato a un utente.');
        }
        
        const userId = tagRes.data.userId;
        // Controlliamo subito se l'utente loggato è il proprietario.
        this.isOwner = this.auth.user?.id === userId;
        
        // Passiamo alla fase successiva: caricare i dati in parallelo.
        return forkJoin({
          userResponse: this.api.getUser(userId),
          medicalResponse: this.api.getMedicalData(userId)
        });
      }),
      // Gestiamo l'errore di qualsiasi passo precedente in un unico posto.
      catchError(error => {
        this.errorMsg = error.message || 'Errore di rete o tag non trovato.';
        this.isLoading = false;
        return of(null); // Termina la catena in modo pulito
      })
    ).subscribe(result => {
      // Se c'è stato un errore, result sarà null e non faremo nulla.
      if (!result) return;

      const { userResponse, medicalResponse } = result;

      // Gestiamo la risposta dell'utente
      if (!userResponse.success || !userResponse.data) {
        this.errorMsg = "L'utente associato a questo tag non è stato trovato.";
        this.isLoading = false;
        return;
      }
      this.user = userResponse.data;

      // Gestiamo la risposta dei dati medici
      this.medicalData = medicalResponse.data || null;
      if (!this.medicalData || this.isMedicalDataEmpty(this.medicalData)) {
        this.isCardEmpty = true;
        this.errorMsg = 'Scheda medica non compilata.';
      }
      
      this.isLoading = false;
    });
  }
  
  private isMedicalDataEmpty(data: MedicalData): boolean {
    const isEmpty = !data.bloodType && !data.allergies?.trim() && !data.conditions?.trim() && !data.notes?.trim() && (!data.emergencyContacts || data.emergencyContacts.length === 0);
    return isEmpty;
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
    // Carica l'IP (questo funziona ancora)
    fetch('https://api.ipify.org/?format=json')
      .then(r => r.json())
      .then(data => this.visitorIp = data.ip)
      .catch(() => this.visitorIp = 'Non rilevato');

    // Carica la geolocalizzazione
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          // PER ORA, mostriamo solo le coordinate per evitare l'errore CORS
          this.visitorLocation = `Lat: ${pos.coords.latitude.toFixed(2)}, Lon: ${pos.coords.longitude.toFixed(2)}`;

          // --- LA CHIAMATA PROBLEMATICA (TEMPORANEAMENTE COMMENTATA) ---
          /*
          fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`)
            .then(res => res.json())
            .then(data => {
              if (data && data.address) {
                this.visitorLocation = data.address.city || data.address.town || data.address.county || 'Posizione rilevata';
              } else {
                this.visitorLocation = 'Posizione rilevata';
              }
            })
            .catch(() => this.visitorLocation = 'Impossibile determinare la città');
          */
        },
        () => { this.visitorLocation = 'Posizione non autorizzata'; }
      );
    } else {
      this.visitorLocation = 'Geolocalizzazione non supportata';
    }
  }
}