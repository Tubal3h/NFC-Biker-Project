// in src/app/features/medical-form/medical-form.ts

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '@app/core/services/api';
import { AuthService } from '@app/core/services/auth';
import { MedicalData, AuthUser } from '@app/core/models';
import { filter, switchMap, take } from 'rxjs'; // <-- Importa gli operatori RxJS

@Component({
  selector: 'app-medical-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './medical-form.html',
  styleUrl: './medical-form.scss'
})
export class MedicalForm implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private router = inject(Router);

  isLoading = true;
  isSaving = false;
  
  readonly relationTypes: string[] = [
    'Genitore', 'Coniuge', 'Figlio/a', 'Parente', 'Amico/a', 'Collega', 'Altro'
  ];

  model: MedicalData = {
    bloodType: null,
    allergies: '',
    conditions: '',
    notes: '',
    emergencyContacts: []
  };

  ngOnInit(): void {
    this.loadData();
  }

  /**
   * Carica i dati in modo reattivo, aspettando che l'utente sia disponibile.
   */
  loadData(): void {
    this.isLoading = true;
    
    this.auth.user$.pipe(
      // Aspetta finché l'utente non è più null
      filter((user): user is AuthUser => user !== null),
      // Prendi solo il primo utente valido per evitare chiamate multiple
      take(1),
      // Passa alla chiamata API usando l'ID dell'utente che abbiamo ricevuto
      switchMap(currentUser => this.api.getMedicalData(currentUser.id))
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.model = response.data;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error("Errore definitivo durante il caricamento dei dati:", err);
        this.isLoading = false;
      }
    });
  }

  /**
   * Salva i dati in modo reattivo, assicurandosi di avere l'utente prima di salvare.
   */
  saveMedicalData(): void {
    this.isSaving = true;

    // Usiamo lo stesso pattern reattivo per la massima sicurezza
    this.auth.user$.pipe(take(1)).subscribe(currentUser => {
      if (!currentUser) {
        console.error("Impossibile salvare: utente non loggato.");
        this.isSaving = false;
        return;
      }

      // Filtra i contatti vuoti prima di salvare
      this.model.emergencyContacts = this.model.emergencyContacts.filter(
        contact => contact.name && contact.phone
      );

      this.api.updateMedicalData(currentUser.id, this.model).subscribe({
        next: (response) => {
          if (response.success) {
            this.router.navigate(['/dashboard']);
          } else {
            console.error('Salvataggio fallito (API):', response.error);
          }
          this.isSaving = false;
        },
        error: (err) => {
          console.error('Errore di rete durante il salvataggio:', err);
          this.isSaving = false;
        }
      });
    });
  }
  
  addContact(): void {
    const lastContact = this.model.emergencyContacts[this.model.emergencyContacts.length - 1];
    if (!lastContact || (lastContact.name && lastContact.phone)) {
      this.model.emergencyContacts.push({ name: '', relation: '', phone: '' });
    }
  }

  removeContact(index: number): void {
    this.model.emergencyContacts.splice(index, 1);
  }
}