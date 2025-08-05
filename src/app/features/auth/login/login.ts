import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api';
import { User } from '../../../core/models';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  @Output() loginSuccess = new EventEmitter<User>();

  email = '';
  password = '';
  errorMsg = '';

  private api = inject(ApiService);
   private router = inject(Router);

  
  gotoRegister() { this.router.navigate(['/register']); }
  gotoLogin() {} // facoltativo, resta sulla stessa

  doLogin() {
    this.errorMsg = '';
    if (!this.email || !this.password) {
      this.errorMsg = 'Compila tutti i campi';
      return;
    }
    this.api.login(this.email, this.password).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.loginSuccess.emit(res.data); // QUI EMETTI L'EVENTO!
        } else {
          this.errorMsg = res.error || 'Login fallito';
        }
      },
      error: () => {
        this.errorMsg = 'Errore di rete';
      }
    });
  }
}
