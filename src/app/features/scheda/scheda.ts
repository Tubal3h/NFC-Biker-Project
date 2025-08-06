// in src/app/features/scheda/scheda.ts

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '@app/core/services/api';
import { MedicalData, AuthUser, NfcTag, ApiResponse } from '@app/core/models';
import { forkJoin } from 'rxjs'; // Importa forkJoin per le chiamate parallele
import { AuthService } from '@app/core/services/auth';

@Component({
  selector: 'app-scheda',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './scheda.html',
  styleUrl: './scheda.scss'
})
export class Scheda implements OnInit {
  // --- Servizi Inniettati ---
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService); // Inietta AuthService

  // --- Stato della Pagina ---
  isLoading = true;
  errorMsg = '';
  
  // --- Dati da Visualizzare ---
  user: AuthUser | null = null;
  medicalData: MedicalData | null = null;
  
  // --- Logica per il Popup della Privacy ---
  showPrivacyPopup = false;
  visitorIp: string | null = null;
  visitorLocation: string | null = null;
  private nfcId: string | null = null; // Memorizziamo l'ID del tag

  // --- NUOVE PROPRIETÀ PER LA LOGICA DEL PULSANTE ---
  isLoggedIn = false;
  isOwner = false;
  tagOwnerId: string | null = null;

  constructor() {
    // Il constructor controlla se è necessario mostrare il popup.
    // Questo viene deciso dal componente Claim, che passa uno "stato" durante la navigazione.
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { showPrivacyWarning?: boolean };
    
    if (state?.showPrivacyWarning) {
      this.showPrivacyPopup = true;
      this.loadVisitorInfo();
    }
  }

  ngOnInit(): void {
    this.isLoggedIn = this.auth.isLogged;
    // All'avvio del componente, recuperiamo l'ID del tag dall'URL e carichiamo i dati.
    this.nfcId = this.route.snapshot.paramMap.get('nfcId');
    if (!this.nfcId) {
      this.errorMsg = 'ID del tag non fornito.';
      this.isLoading = false;
      return;
    }
    this.loadAllData(this.nfcId);
  }

  /**
   * Carica tutti i dati necessari (utente e scheda medica) in modo efficiente.
   */
  private loadAllData(nfcId: string): void {
    // 1. Prima verifichiamo il tag per ottenere lo userId del proprietario
    this.api.getTag(nfcId).subscribe({
      next: (tagRes) => {
        if (!tagRes.success || !tagRes.data?.userId) {
          this.errorMsg = 'Tag non valido o non associato a un utente.';
          this.isLoading = false;
          return;
        }
        
        // --- MODIFICA 1: Memorizziamo l'ID del proprietario ---
        this.tagOwnerId = tagRes.data.userId;
        
        // --- MODIFICA 2: Verifichiamo subito se l'utente loggato è il proprietario ---
        if (this.isLoggedIn && this.auth.user?.id === this.tagOwnerId) {
          this.isOwner = true;
        }

        // 2. Ora che abbiamo l'ID, carichiamo i dati con forkJoin (questa parte rimane uguale)
        forkJoin({
          userResponse: this.api.getUser(this.tagOwnerId),
          medicalResponse: this.api.getMedicalData(this.tagOwnerId)
        }).subscribe({
          next: ({ userResponse, medicalResponse }) => {
            // Controlliamo l'utente
            if (userResponse.success && userResponse.data) {
              this.user = userResponse.data;
            } else {
              this.errorMsg = "L'utente associato a questo tag non è stato trovato.";
              this.isLoading = false;
              return;
            }

            // Controlliamo i dati medici
            if (medicalResponse.success && medicalResponse.data && !this.isMedicalDataEmpty(medicalResponse.data)) {
              this.medicalData = medicalResponse.data;
            } else {
              this.errorMsg = 'Scheda medica non compilata.';
            }

            this.isLoading = false;
          },
          error: () => {
            this.errorMsg = 'Errore di rete nel caricamento dei dati.';
            this.isLoading = false;
          }
        });
      },
      error: () => {
        this.errorMsg = 'Errore di rete nel recupero del tag.';
        this.isLoading = false;
      }
    });
  }

    /**
   * NUOVA FUNZIONE DI CONTROLLO:
   * Verifica se un oggetto MedicalData è "effettivamente" vuoto.
   * @param data L'oggetto MedicalData da controllare.
   * @returns true se la scheda è considerata vuota, altrimenti false.
   */
  private isMedicalDataEmpty(data: MedicalData): boolean {
    // La scheda è considerata vuota se TUTTE queste condizioni sono vere:
    const isEmpty = 
      !data.bloodType &&
      !data.allergies?.trim() &&
      !data.conditions?.trim() &&
      !data.notes?.trim() &&
      data.emergencyContacts?.length === 0;
      
    return isEmpty;
  }

  /**
   * Chiamato dal pulsante "Login e Compila Scheda" nel template di errore.
   */
  goToClaim(): void {
    if (this.nfcId) {
      this.router.navigate(['/claim', this.nfcId]);
    }
  }

  // --- Funzioni per il Popup ---

  acceptPrivacy(): void {
    this.showPrivacyPopup = false;
  }

  cancelAndGoBack(): void {
    this.router.navigate(['/homepage']);
  }

  private loadVisitorInfo(): void {
    // Carica l'IP
    fetch('https://api.ipify.org/?format=json')
      .then(r => r.json())
      .then(data => this.visitorIp = data.ip)
      .catch(() => this.visitorIp = 'Non rilevato');

    // Carica la geolocalizzazione e la converte in città
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const { latitude, longitude } = pos.coords;
          fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
            .then(res => res.json())
            .then(data => {
              if (data && data.address) {
                this.visitorLocation = data.address.city || data.address.town || data.address.county || 'Posizione rilevata';
              } else {
                this.visitorLocation = 'Posizione rilevata';
              }
            })
            .catch(() => this.visitorLocation = 'Impossibile determinare la città');
        },
        () => { this.visitorLocation = 'Posizione non autorizzata'; }
      );
    } else {
      this.visitorLocation = 'Geolocalizzazione non supportata';
    }
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  goToLogin(): void {
    // Reindirizziamo al login, passando l'URL a cui tornare dopo
    this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
  }
}