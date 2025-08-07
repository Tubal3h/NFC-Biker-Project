// in src/app/features/account-settings/account-settings.ts

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '@app/core/services/api';
import { AuthService } from '@app/core/services/auth';
import { AuthUser } from '@app/core/models';
import { take } from 'rxjs';

@Component({
  selector: 'app-account-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './account-settings.html',
  styleUrl: './account-settings.scss'
})
export class AccountSettings implements OnInit {
  private api = inject(ApiService);
  auth = inject(AuthService);

  isLoading = true;
  isSavingProfile = false;
  isSavingPassword = false;

  // Modello per i dati anagrafici
  profileModel: { name: string; surname: string; email: string } = {
    name: '',
    surname: '',
    email: ''
  };

  // Modello separato per il cambio password
  passwordModel = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  ngOnInit(): void {
    this.loadUserProfile();
  }

  /**
   * Carica i dati dell'utente loggato dall'AuthService per popolare il form.
   */
  loadUserProfile(): void {
    const currentUser = this.auth.user;
    if (currentUser) {
      this.profileModel = {
        name: currentUser.name || '',
        surname: currentUser.surname || '',
        email: currentUser.email
      };
      this.isLoading = false;
    } else {
      // Caso improbabile (protetto da AuthGuard), ma sicuro da gestire
      this.isLoading = false;
      console.error("Impossibile caricare il profilo: utente non trovato.");
    }
  }

  /**
   * Salva le modifiche ai dati anagrafici (nome e cognome) tramite API.
   */
  saveProfileDetails(): void {
    this.isSavingProfile = true;

    this.auth.user$.pipe(take(1)).subscribe(currentUser => {
      if (!currentUser) {
        console.error("Impossibile salvare: utente non loggato.");
        this.isSavingProfile = false;
        return;
      }
      
      const dataToSave = {
        name: this.profileModel.name,
        surname: this.profileModel.surname
      };

      this.api.updateUserProfile(currentUser.id, dataToSave).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.auth.login(response.data);
            console.log('Dati anagrafici salvati!');
          } else {
            console.error('Salvataggio fallito:', response.error);
          }
          this.isSavingProfile = false;
        },
        error: (err) => {
          console.error('Errore di rete durante il salvataggio:', err);
          this.isSavingProfile = false;
        }
      });
    });
  }

  /**
   * Gestisce il tentativo di cambio password (attualmente simulato).
   */
// in src/app/features/account-settings/account-settings.ts

changePassword(passwordForm: NgForm): void {
  // Controlli preliminari nel frontend
  if (this.passwordModel.newPassword !== this.passwordModel.confirmPassword) {
    // Qui dovresti mostrare un errore all'utente, per ora usiamo un alert
    alert("Errore: Le nuove password non coincidono.");
    return;
  }
  if (this.passwordModel.newPassword.length < 6) {
    alert("Errore: La nuova password deve essere di almeno 6 caratteri.");
    return;
  }

  this.isSavingPassword = true;
  const currentUser = this.auth.user;
  if (!currentUser) return;

  // Prepariamo i dati da inviare
  const dataToSend = {
    currentPassword: this.passwordModel.currentPassword,
    newPassword: this.passwordModel.newPassword
  };

  // Chiamiamo la nostra nuova funzione API
  this.api.changePassword(currentUser.id, dataToSend).subscribe({
    next: (response) => {
      if (response.success) {
        alert('Password aggiornata con successo!');
        passwordForm.resetForm(); // Svuota i campi dopo il successo
      } else {
        // Mostra l'errore specifico inviato dal backend (es. "Password attuale non corretta")
        alert(`Errore: ${response.error}`);
      }
      this.isSavingPassword = false;
    },
    error: (err) => {
      // Mostra l'errore specifico inviato dal backend (es. per password errata)
      alert(`Errore: ${err.error?.error || 'Errore di connessione.'}`);
      this.isSavingPassword = false;
    }
  });
}

  upgradeToPremium(): void {
    const userId = this.auth.user?.id;
    if (!userId) return;

    // Mostriamo un avviso di conferma prima di procedere
    if (confirm("Sei sicuro di voler passare a Premium? (Azione non reversibile)")) {
      this.api.upgradeToPremium(userId).subscribe({ // <-- Dobbiamo creare questa funzione in ApiService
        next: (response) => {
          if (response.success && response.data) {
            // Aggiorniamo lo stato dell'utente per riflettere lo stato premium
            this.auth.login(response.data);
            alert("Congratulazioni! Il tuo account è ora Premium.");
          }
        },
        error: () => alert("Si è verificato un errore durante l'upgrade.")
      });
    }
  }
}