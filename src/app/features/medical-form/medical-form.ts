// in src/app/features/medical-form/medical-form.ts

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ApiService } from '@app/core/services/api';
import { NotificationService } from '@app/core/services/notification';
import { MedicalProfile, EmergencyContact } from '@app/core/models';
import { AuthService } from '@app/core/services/auth';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faUserCircle, faFirstAid, faAddressBook, faPhone, faPlus,  } from '@fortawesome/free-solid-svg-icons';
import { faTelegramPlane } from '@fortawesome/free-brands-svg-icons';

@Component({
  selector: 'app-medical-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FontAwesomeModule],
  templateUrl: './medical-form.html',
  styleUrls: ['./medical-form.scss']
})
export class MedicalForm implements OnInit {
  faArrowLeft = faArrowLeft;
  faUserCircle = faUserCircle;
  faFirstAid = faFirstAid;
  faAddressBook = faAddressBook;
  faPhone = faPhone;
  faPlus = faPlus;
  


  private api = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notification = inject(NotificationService);
  auth = inject(AuthService); // Inietta AuthService e rendilo pubblico


  private profileId: string | null = null;
  isLoading = true;
  isSaving = false;
  
  // Proprietà per il popup di conferma salvataggio
  isConfirmationModalVisible = false;
  isDataConfirmed = false;
  
  // Proprietà per il popup dei contatti
  isContactModalVisible = false;
  contactModel: EmergencyContact = { name: '', relation: '', phone: '' };
  isEditMode = false;
  editingContactIndex: number | null = null;
  
  readonly relationTypes: string[] = [
    'Genitore', 'Coniuge', 'Figlio/a', 'Parente', 'Amico/a', 'Collega', 'Altro'
  ];

  model: MedicalProfile = {
    profileName: '', name: '', surname: '', birthDate: null,
    birthPlace: '', residence: '', bloodType: null, allergies: '',
    conditions: '', notes: '', emergencyContacts: []
  };

  ngOnInit(): void {
    this.profileId = this.route.snapshot.paramMap.get('profileId');
    this.loadData();
  }

  // Calcola il limite massimo di contatti in base al piano dell'utente
  get maxContacts(): number {
    return this.auth.user?.premium ? 10 : 3;
  }

  loadData(): void {
    if (!this.profileId) {
      this.notification.showError("ID del profilo non specificato.");
      this.router.navigate(['/profile-management']);
      return;
    }
    this.isLoading = true;
    this.api.getMedicalProfileById(this.profileId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.model = res.data;
          // Assicura che emergencyContacts sia sempre un array
          if (!this.model.emergencyContacts) {
            this.model.emergencyContacts = [];
          }
        } else {
          this.notification.showError(res.error || "Impossibile caricare il profilo.");
          this.router.navigate(['/profile-management']);
        }
        this.isLoading = false;
      },
      error: () => {
        this.notification.showError("Errore di rete nel caricamento del profilo.");
        this.isLoading = false;
      }
    });
  }

  // --- GESTIONE POPUP CONFERMA SALVATAGGIO ---
  openConfirmationModal(): void {
    this.isConfirmationModalVisible = true;
  }

  closeConfirmationModal(): void {
    this.isConfirmationModalVisible = false;
    this.isDataConfirmed = false; // Resetta la checkbox
  }
  
  submitSave(): void {
    if (!this.profileId) {
      this.notification.showError("Impossibile salvare: ID del profilo mancante.");
      return;
    }
    
    this.isSaving = true;
    this.model.emergencyContacts = this.model.emergencyContacts.filter(c => c.name && c.phone);

    this.api.updateMedicalProfile(this.profileId, this.model).subscribe({
      next: (response) => {
        if (response.success) {
          this.notification.showSuccess('Profilo aggiornato con successo!');
          this.closeConfirmationModal();
          this.router.navigate(['/profile-management']);
        } else {
          this.notification.showError(response.error || 'Salvataggio fallito.');
        }
        this.isSaving = false;
      },
      error: (err) => {
        this.notification.showError(err.error?.error || 'Errore di rete.');
        this.isSaving = false;
      }
    });
  }

  // --- GESTIONE POPUP CONTATTI D'EMERGENZA ---

  openContactModal(contact?: EmergencyContact, index?: number): void {
    if (contact && index !== undefined) {
      // Modalità Modifica
      this.isEditMode = true;
      this.editingContactIndex = index;
      this.contactModel = { ...contact }; // Crea una copia per l'editing
    } else {
      // Modalità Aggiungi: controlla il limite prima di aprire
      if (this.model.emergencyContacts.length >= this.maxContacts) {
        this.notification.showWarning(`Hai raggiunto il limite di ${this.maxContacts} contatti per il tuo piano.`);
        return; // Non apre il popup
      }
      this.isEditMode = false;
      this.editingContactIndex = null;
      this.contactModel = { name: '', relation: '', phone: '' }; // Resetta il modello
    }
    this.isContactModalVisible = true;
  }

  closeContactModal(): void {
    this.isContactModalVisible = false;
  }

  saveContact(): void {
    // Validazione dei campi
    if (!this.contactModel.name.trim() || !this.contactModel.relation || !this.contactModel.phone.trim()) {
      this.notification.showError("Per favore, compila tutti i campi del contatto.");
      return;
    }

    if (this.isEditMode && this.editingContactIndex !== null) {
      // Aggiorna il contatto esistente nell'array
      this.model.emergencyContacts[this.editingContactIndex] = this.contactModel;
    } else {
      // Aggiunge un nuovo contatto all'array
      this.model.emergencyContacts.push(this.contactModel);
    }
    
    this.notification.showSuccess(this.isEditMode ? 'Contatto aggiornato.' : 'Contatto aggiunto.');
    this.closeContactModal();
  }

  removeContact(index: number): void {
    const contactName = this.model.emergencyContacts[index]?.name || 'questo contatto';
    if (confirm(`Sei sicuro di voler eliminare ${contactName}?`)) {
      this.model.emergencyContacts.splice(index, 1);
      this.notification.showSuccess("Contatto rimosso.");
    }
  }
}