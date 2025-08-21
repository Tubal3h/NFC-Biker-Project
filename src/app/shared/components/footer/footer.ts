// in src/app/shared/components/footer/footer.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.html',
  styleUrl: './footer.scss'
})
export class Footer {
  // Aggiunge l'anno corrente per il copyright dinamico
  currentYear = new Date().getFullYear();
}