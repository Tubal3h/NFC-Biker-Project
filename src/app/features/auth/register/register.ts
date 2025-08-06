// in src/app/features/auth/register/register.ts

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '@app/core/services/api';
import { AuthService } from '@app/core/services/auth';

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

    this.api.register({ email: this.email, password: this.password }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.authService.login(response.data);
          
          // Ora questo 'if' funzionerà correttamente
          if (this.nfcId) {
            this.router.navigate(['/claim', this.nfcId]);
          } else {
            this.router.navigate(['/dashboard']);
          }

        } else {
          this.errorMsg = response.error || 'Errore durante la registrazione.';
        }
        this.isRegistering = false;
      },
      error: (err) => {
        this.errorMsg = err.error?.error || 'Errore di connessione.';
        this.isRegistering = false;
      }
    });
  }
}