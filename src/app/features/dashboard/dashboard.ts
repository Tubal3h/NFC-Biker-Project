import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '@app/core/services/auth';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})

export class Dashboard {
  // Inietta il servizio di autenticazione
  private authService = inject(AuthService);

  // Espone l'observable dell'utente al template
  // Il pipe 'async' nell'HTML si occuperà di tutto il resto
  user$ = this.authService.user$;
}