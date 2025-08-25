// in src/app/shared/components/footer/footer.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTelegramPlane, faInstagram, faWhatsapp } from '@fortawesome/free-brands-svg-icons';


@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule],
  templateUrl: './footer.html',
  styleUrl: './footer.scss'
})
export class Footer {
  // Aggiunge l'anno corrente per il copyright dinamico
  currentYear = new Date().getFullYear();

  // Icona di Telegram
  faTelegramPlane = faTelegramPlane;
  faInstagram = faInstagram;
  faWhatsapp = faWhatsapp;
}