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
    this.nfcId = this.route.snapshot.paramMap.get('nfcId');
  }

  doRegister(): void {
    if (this.isRegistering) return;

    this.errorMsg = '';
    if (!this.email || !this.password || !this.password2) {
      this.errorMsg = 'Compila tutti i campi.';
      return;
    }
    if (this.password !== this.password2) {
      this.errorMsg = 'Le password non coincidono.';
      return;
    }
    
    this.isRegistering = true;

    this.api.register({ email: this.email, password: this.password }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Passiamo 'response.data' direttamente al servizio.
          // TypeScript sa già che è di tipo AuthUser grazie alla definizione nell'ApiService.
          this.authService.login(response.data);
          
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
        console.error("Errore durante la registrazione:", err);
        this.errorMsg = err.error?.error || 'Errore di connessione con il server.';
        this.isRegistering = false;
      }
    });
  }
}