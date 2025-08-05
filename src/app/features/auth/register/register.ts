import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api';
import { User } from '../../../core/models';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register {

  private api = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  @Output() registerSuccess = new EventEmitter<User>();

  email = '';
  password = '';
  password2 = '';
  errorMsg = '';
  nfcId = '';

  constructor() {
    // Inizializza eventuali dati dalla route
    this.nfcId = this.route.snapshot.paramMap.get('nfcId') || '';
  }

  gotoLogin() { this.router.navigate(['/login']); }
  gotoRegister() {} // facoltativo, resta sulla stessa

  doRegister() {
    this.errorMsg = '';
    if (!this.email || !this.password || !this.password2) {
      this.errorMsg = 'Compila tutti i campi';
      return;
    }
    if (!this.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      this.errorMsg = 'Email non valida';
      return;
    }
    if (this.password.length < 6) {
      this.errorMsg = 'Password troppo corta';
      return;
    }
    if (this.password !== this.password2) {
      this.errorMsg = 'Le password non coincidono';
      return;
    }
    this.api.register({ email: this.email, password: this.password }).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.registerSuccess.emit(res.data);
          // Salva l'utente, se serve
          localStorage.setItem('user', JSON.stringify(res.data));
          // Redirect a /claim/:nfcId
          this.router.navigate(['/claim', this.nfcId]);
        } else {
          this.errorMsg = res.error || 'Errore di registrazione';
        }
      },
      error: (err) => {
        this.errorMsg = err.error?.error || 'Errore di rete';
      }
    });
  }
}
