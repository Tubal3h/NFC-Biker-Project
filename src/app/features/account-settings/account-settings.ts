// in src/app/features/account-settings/account-settings.ts

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms'; // Importa NgForm
import { RouterModule } from '@angular/router';
import { ApiService } from '@app/core/services/api';
import { AuthService } from '@app/core/services/auth';
import { AuthUser } from '@app/core/models';

@Component({
  selector: 'app-account-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './account-settings.html',
  styleUrl: './account-settings.scss'
})
export class AccountSettings implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

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

  loadUserProfile(): void {
    const currentUser = this.auth.user;
    if (currentUser) {
      this.profileModel = {
        name: currentUser.name || '',
        surname: currentUser.surname || '',
        email: currentUser.email
      };
      this.isLoading = false;
    }
  }

  saveProfileDetails(): void {
    if (!this.auth.user) return;
    this.isSavingProfile = true;
    console.log('Salvataggio dati anagrafici (simulato):', this.profileModel);

    // In futuro, qui ci sarà la chiamata API per aggiornare l'utente
    // this.api.updateUser(this.auth.user.id, this.profileModel).subscribe(...)

    setTimeout(() => {
      // Aggiorniamo l'utente nell'AuthService per vedere subito il cambiamento
      const updatedUser = { ...this.auth.user, ...this.profileModel };
      this.auth.login(updatedUser as AuthUser);
      this.isSavingProfile = false;
      // Mostra un feedback di successo
    }, 1000);
  }

  changePassword(passwordForm: NgForm): void {
    if (this.passwordModel.newPassword !== this.passwordModel.confirmPassword) {
      console.error("Le nuove password non coincidono");
      return;
    }

    this.isSavingPassword = true;
    console.log('Cambio password richiesto (simulato)...');

    // In futuro, qui ci sarà la chiamata API per il cambio password
    // this.api.changePassword(this.auth.user.id, this.passwordModel).subscribe(...)

    setTimeout(() => {
      console.log('Password aggiornata con successo (simulato)');
      this.isSavingPassword = false;
      passwordForm.resetForm(); // Svuota i campi della password dopo il salvataggio
      // Mostra un feedback di successo
    }, 1500);
  }
}