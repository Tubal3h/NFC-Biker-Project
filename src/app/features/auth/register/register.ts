// in src/app/features/auth/register/register.ts

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '@app/core/services/api';
import { AuthService } from '@app/core/services/auth';
import { NotificationService } from '@app/core/services/notification';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register implements OnInit {
  private api = inject(ApiService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
    private notification = inject(NotificationService);

  email = '';
  password = '';
  password2 = '';
  errorMsg = '';
  isRegistering = false;
  
  private nfcId: string | null = null;

  ngOnInit(): void {
    // ======================================================
    // --- ECCO LA CORREZIONE: usiamo queryParamMap ---
    // ======================================================
    this.nfcId = this.route.snapshot.queryParamMap.get('nfcId');
  }

  doRegister(): void {
    if (this.isRegistering) return;
    
    // ... validazioni ...
    if (this.password !== this.password2) {
      this.errorMsg = 'Le password non coincidono.';
      return;
    }
    
    this.isRegistering = true;

  // in src/app/features/auth/register/register.ts

  this.api.register({ email: this.email, password: this.password }).subscribe({
    next: (response) => {
      // La risposta è di tipo AuthResponse: { success, data: AuthUser, token: string }
      if (response.success && response.data && response.token) {

        // --- ECCO LA CORREZIONE ---
        this.authService.login(response.data, response.token);
        this.notification.showSuccess('Registrazione completata! Benvenuto.');

        const targetRoute = this.nfcId ? ['/claim', this.nfcId] : ['/dashboard'];
        this.router.navigate(targetRoute);

      } else {
        this.errorMsg = response.error || 'Errore durante la registrazione.';
      }
    },
    error: (err) => {
      this.errorMsg = err.error?.error || 'Errore di connessione.';
    },
    complete: () => {
      this.isRegistering = false;
    }
  });

  }
}