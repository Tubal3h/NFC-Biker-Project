// in src/app/features/medical-form/medical-form.ts

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '@app/core/services/api';
import { AuthService } from '@app/core/services/auth';
import { MedicalData, AuthUser } from '@app/core/models';

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

  // ================================================================
  // --- FUNZIONE loadData() COMPLETA E CORRETTA ---
  // ================================================================
  loadData(): void {
    const currentUser: AuthUser | null = this.auth.user;
    if (!currentUser) {
      this.isLoading = false;
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading = true;
    this.api.getMedicalData(currentUser.id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.model = response.data;
        }
        this.isLoading = false; // <-- Ecco dove si sblocca il caricamento!
      },
      error: (err) => {
        console.error("Errore durante il caricamento dei dati:", err);
        this.isLoading = false; // <-- E anche qui in caso di errore!
      }
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

  // ================================================================
  // --- FUNZIONE saveMedicalData() COMPLETA E CORRETTA ---
  // ================================================================
  saveMedicalData(): void {
    const currentUser = this.auth.user;
    if (!currentUser) return;
    
    this.isSaving = true;
    
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
  }
}