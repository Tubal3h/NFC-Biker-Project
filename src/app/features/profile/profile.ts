import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MedicalData, User } from '../../core/models';
import { ApiService } from '../../core/services/api';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class Profile {
  user: User | null = null;
  name = '';
  surname = '';
  medicalData: MedicalData = {
    bloodType: '',
    allergies: '',
    conditions: '',
    notes: '',
    emergencyContacts: []
  };
  message = '';
  errorMsg = '';

  contactForm: FormGroup;
  editIndex: number | null = null;

  constructor(private api: ApiService, private fb: FormBuilder) {
    // Recupera user da localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.user = JSON.parse(userStr);
      this.loadMedicalData();
    }

    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.pattern(/^[A-Za-z\s]+$/)]],
      relation: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]]
    });
  }

  // Carica dati medici da backend
  loadMedicalData() {
    if (!this.user) return;
    this.api.getMedicalData(this.user.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.medicalData = res.data;
        } else {
          this.errorMsg = res.error || 'Errore nel caricamento dati.';
        }
      },
      error: () => {
        this.errorMsg = 'Errore nel caricamento dati.';
      }
    });
  }

  // Salva dati sanitari (scheda generale)
save() {
  if (!this.user) return;

  // Prendi i campi dal form (aggiungi i campi name e surname nella UI!)
  const dataToSend = {
    name: this.name,                       // <-- campo nuovo (aggiungi nella UI!)
    surname: this.surname,                 // <-- campo nuovo (separato, opzionale)
    bloodType: this.medicalData.bloodType,
    allergies: this.medicalData.allergies,
    conditions: this.medicalData.conditions,
    notes: this.medicalData.notes,
    emergencyContacts: this.medicalData.emergencyContacts
  };

  this.api.updateMedicalData(this.user.id, dataToSend).subscribe({
    next: () => {
      this.message = 'Dati aggiornati!';
      setTimeout(() => this.message = '', 2000);
    },
    error: () => { this.errorMsg = 'Errore durante il salvataggio.'; }
  });
}


  // Inizio modifica di un contatto già salvato
  startEdit(i: number) {
    this.editIndex = i;
    const c = this.medicalData.emergencyContacts[i];
    this.contactForm.setValue({
      name: c.name,
      relation: c.relation,
      phone: c.phone
    });
  }

  // Salva contatto (sia nuovo che modificato)
  onContactSave() {
    if (this.contactForm.invalid) return;
    const value = this.contactForm.value;
    if (this.editIndex !== null) {
      // Modifica esistente
      this.medicalData.emergencyContacts[this.editIndex] = value;
      this.editIndex = null;
    } else {
      // Nuovo contatto
      this.medicalData.emergencyContacts.push(value);
    }
    this.contactForm.reset();
  }

  // Annulla la modifica
  cancelEdit() {
    this.editIndex = null;
    this.contactForm.reset();
  }

  // Elimina un contatto
  removeContact(i: number) {
    this.medicalData.emergencyContacts.splice(i, 1);
    if (this.editIndex === i) {
      this.cancelEdit();
    }
  }
}
