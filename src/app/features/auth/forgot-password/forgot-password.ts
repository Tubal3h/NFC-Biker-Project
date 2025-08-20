// in src/app/features/auth/forgot-password/forgot-password.ts

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '@app/core/services/api';
import { NotificationService } from '@app/core/services/notification';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss'
})
export class ForgotPassword {
  private api = inject(ApiService);
  private notification = inject(NotificationService);

  email = '';
  isLoading = false;
  isSubmitted = false; // Flag per mostrare il messaggio di successo

  requestReset(): void {
    if (this.isLoading) return;
    this.isLoading = true;

    this.api.forgotPassword(this.email).subscribe({
      next: () => {
        // Per motivi di sicurezza, mostriamo sempre un messaggio di successo,
        // anche se l'email non esiste.
        this.isLoading = false;
        this.isSubmitted = true; // Cambia la vista al messaggio di successo
      },
      error: (err) => {
        console.error("Errore durante la richiesta di reset:", err);
        this.isLoading = false;
        this.notification.showError('Si è verificato un errore. Riprova più tardi.');
      }
    });
  }
}