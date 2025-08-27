import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUsersRectangle,faAddressBook,faClipboardUser,faBoxOpen, faCheckCircle, faStar, faUserCircle, faCheck, faTimes, faCrown, faInfoCircle, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { faTelegramPlane } from '@fortawesome/free-brands-svg-icons';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@app/core/services/auth';

@Component({
  selector: 'app-products-services',
  imports: [CommonModule, RouterModule, FontAwesomeModule, FormsModule],
  templateUrl: './products-services.html',
  styleUrl: './products-services.scss'
})
export class ProductsServices {
  auth = inject(AuthService);
  isYearly = true; 


  icons = {
    faAddressBook,
    faUsersRectangle,
    faClipboardUser,
    faBoxOpen,
    faCheckCircle,
    faStar,
    faUserCircle,
    faCheck,
    faTimes,
    faCrown,
    faInfoCircle,
    faChevronLeft,
    faChevronRight
  };

  productImages: string[] = [
    'assets/img/kit/kit-img1.png', // Immagine del kit completa
    'assets/img/kit/kit-img2.png', // Dettaglio dei Tag NFC
    'assets/img/kit/kit-img3.png'  // Dettaglio delle salviette e card
  ];
  currentImageIndex: number = 0;

  // Dati per l'offerta di lancio
  totalLaunchKits: number = 50;
  kitsSold: number = 0; // Questo dovrebbe venire dal backend in un'applicazione reale
  showLaunchOffer: boolean = this.kitsSold < this.totalLaunchKits;
    // Getter per calcolare i kit rimanenti
  get kitsRemaining(): number {
    return this.totalLaunchKits - this.kitsSold;
  }

  // Metodi per la navigazione della galleria
  nextImage(): void {
    this.currentImageIndex = (this.currentImageIndex + 1) % this.productImages.length;
  }

  prevImage(): void {
    this.currentImageIndex = (this.currentImageIndex - 1 + this.productImages.length) % this.productImages.length;
  }

}
