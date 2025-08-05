import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; // Importa Router
import { ApiService } from '@app/core/services/api';
import { AuthService } from '@app/core/services/auth';
import { MedicalData, AuthUser } from '@app/core/models'; 

@Component({
  selector: 'app-medical-form',
  imports: [ CommonModule, FormsModule, RouterModule ],
  templateUrl: './medical-form.html',
  styleUrl: './medical-form.scss'
})
export class MedicalForm implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private router = inject(Router);

  isLoading = true;
  isSaving = false;
  
  // L'oggetto che contiene tutti i dati del form.
  // Lo inizializziamo con una struttura vuota per evitare errori nel template prima del caricamento.
  model: MedicalData = {
    bloodType: null,
    allergies: '',
    conditions: '',
    notes: '',
    vehicle: { model: '', plate: '' },
    emergencyContacts: []
  };

  ngOnInit(): void {
    this.loadData();
  }

  /**
   * Carica i dati medici esistenti dell'utente loggato.
   */
  loadData(): void {
    // Recupera l'utente corrente dal servizio di autenticazione
    const currentUser: AuthUser | null = this.auth.user;

    if (!currentUser) {
      console.error("Errore critico: Impossibile caricare i dati. Utente non autenticato.");
      this.isLoading = false;
      // Potremmo reindirizzare al login in questo caso improbabile
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading = true;
    this.api.getMedicalData(currentUser.id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Popola il modello del form con i dati ricevuti dal backend
          this.model = response.data;
          console.log('Dati medici caricati con successo:', this.model);
        } else {
          // Se l'API ha successo ma non ci sono dati, significa che l'utente non ha mai compilato il form.
          // Il modello rimane vuoto, pronto per il primo inserimento.
          console.log('Nessun dato medico preesistente trovato. L\'utente può compilare da zero.');
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error("Errore durante il recupero dei dati medici:", err);
        this.isLoading = false;
        // Qui dovremmo mostrare un messaggio di errore all'utente (es. con un "toast" o un alert)
      }
    });
  }
  
  /**
   * Aggiunge un nuovo contatto di emergenza vuoto alla lista nel modello.
   */
  addContact(): void {
    this.model.emergencyContacts.push({ name: '', relation: '', phone: '' });
  }

  /**
   * Rimuove un contatto di emergenza dalla lista in base al suo indice.
   */
  removeContact(index: number): void {
    this.model.emergencyContacts.splice(index, 1);
  }

  /**
   * Invia i dati del form al backend per il salvataggio.
   */
  saveMedicalData(): void {
    const currentUser = this.auth.user;
    if (!currentUser) {
      console.error("Errore critico: Impossibile salvare. Utente non autenticato.");
      return;
    }
    
    this.isSaving = true;
    
    // Chiama la funzione reale dell'ApiService
    this.api.updateMedicalData(currentUser.id, this.model).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('Salvataggio completato con successo!');
          // Un buon feedback per l'utente qui è fondamentale (es. un messaggio "Salvato!")
          // Reindirizza alla dashboard per confermare il completamento dell'operazione.
          this.router.navigate(['/dashboard']);
        } else {
          console.error('Il salvataggio è fallito (risposta API con errore):', response.error);
          // Mostra un messaggio di errore specifico all'utente
        }
        this.isSaving = false;
      },
      error: (err) => {
        console.error('Errore di rete o del server durante il salvataggio:', err);
        this.isSaving = false;
        // Mostra un messaggio di errore generico all'utente
      }
    });
  }
}
