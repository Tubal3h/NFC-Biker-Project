import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '@app/core/services/api';
import { NotificationService } from '@app/core/services/notification';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss'
})
export class ResetPassword implements OnInit {
  private api = inject(ApiService);
  private notification = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private token: string | null = null;
  
  // Stato della pagina
  isLoading = false; // Lo useremo per verificare il token, se necessario
  isSaving = false;
  invalidToken = false;

  // Modello del form
  password = '';
  password2 = '';

  ngOnInit(): void {
    // Recupera il token dal parametro dell'URL
    this.token = this.route.snapshot.paramMap.get('token');
    
    // Potremmo aggiungere qui una chiamata per verificare subito la validità del token,
    // ma per ora lo verifichiamo solo al momento del salvataggio.
    if (!this.token) {
      this.invalidToken = true;
    }
  }

  doResetPassword(): void {
    if (this.isSaving || !this.token) return;
    if (this.password !== this.password2) {
      this.notification.showError('Le password non coincidono.');
      return;
    }

    this.isSaving = true;

    this.api.resetPassword(this.token, this.password).subscribe({
      next: (response) => {
        if (response.success) {
          this.notification.showSuccess('Password resettata con successo! Ora puoi effettuare il login.');
          // Reindirizza l'utente alla pagina di login dopo il successo
          this.router.navigate(['/login']);
        } else {
          this.notification.showError(response.error || 'Si è verificato un errore.');
          this.invalidToken = true; // Probabilmente il token è scaduto
        }
        this.isSaving = false;
      },
      error: (err) => {
        this.notification.showError(err.error?.error || 'Token non valido o scaduto.');
        this.invalidToken = true;
        this.isSaving = false;
      }
    });
  }
}