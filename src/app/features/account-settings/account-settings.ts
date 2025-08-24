// in src/app/features/account-settings/account-settings.ts

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '@app/core/services/api';
import { AuthService } from '@app/core/services/auth';
import { NotificationService } from '@app/core/services/notification';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-account-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DatePipe],
  templateUrl: './account-settings.html',
  styleUrl: './account-settings.scss'
})
export class AccountSettings implements OnInit {
  private notification = inject(NotificationService);
  private api = inject(ApiService);
  auth = inject(AuthService);

  isLoading = true; // <-- Decommentato
  isSavingPassword = false;
  activationCode = '';
  isUpgrading = false;

  passwordModel = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  ngOnInit(): void {
     this.isLoading = false;
  }


  changePassword(passwordForm: NgForm): void {
    if (this.passwordModel.newPassword !== this.passwordModel.confirmPassword) {
      // 3. Sostituisci alert() con una notifica di errore
      this.notification.showError('Le nuove password non coincidono.');
      return;
    }
    if (this.passwordModel.newPassword.length < 6) {
      this.notification.showError('La nuova password deve essere di almeno 6 caratteri.');
      return;
    }

    this.isSavingPassword = true;
    const currentUser = this.auth.user;
    if (!currentUser) { this.isSavingPassword = false; return; }

    const dataToSend = {
      currentPassword: this.passwordModel.currentPassword,
      newPassword: this.passwordModel.newPassword
    };

    this.api.changePassword(currentUser.id, dataToSend).subscribe({
      next: (response) => {
        if (response.success) {
          // 4. Sostituisci alert() con una notifica di successo
          this.notification.showSuccess('Password aggiornata con successo!');
          passwordForm.resetForm();
        } else {
          this.notification.showError(response.error || 'Si è verificato un errore.');
        }
        this.isSavingPassword = false;
      },
      error: (err) => {
        // 5. Sostituisci alert() con una notifica di errore
        this.notification.showError(err.error?.error || 'Errore di connessione con il server.');
        this.isSavingPassword = false;
      }
    });
  } 

    /**
   * Tenta di attivare il premium usando il codice fornito.
   */
  upgradeToPremium(): void {
    const currentUser = this.auth.user;
    if (!currentUser || !this.activationCode) return;

    this.isUpgrading = true;

    this.api.upgradeToPremium(currentUser.id, this.activationCode).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Aggiorniamo lo stato dell'utente con i nuovi dati premium
          this.auth.updateUser(response.data);
          this.notification.showSuccess('Congratulazioni, il tuo account è ora Premium!');
        } else {
          this.notification.showError(response.error || 'Si è verificato un errore.');
        }
        this.isUpgrading = false;
      },
      error: (err) => {
        this.notification.showError(err.error?.error || 'Codice non valido o errore di rete.');
        this.isUpgrading = false;
      }
    });
  }
  
}