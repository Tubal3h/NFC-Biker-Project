// in src/app/features/plans/plans.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Importa FormsModule per ngModel
import { AuthService } from '@app/core/services/auth';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUserCircle, faHelmetSafety, faUserEdit, faTimes, faCrown, faStar, faCheck, faCameraRetro, faCommentMedical, faSms } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-plans',
  standalone: true, // Aggiungi standalone
  imports: [CommonModule, RouterModule, FormsModule, FontAwesomeModule], // Aggiungi CommonModule, RouterModule e FormsModule
  templateUrl: './plans.html',
  styleUrls: ['./plans.scss']
})
export class Plans {
  // Aggiungiamo una proprietà per controllare il selettore
  // true = Annuale, false = Mensile
  isYearly: boolean = true;
  auth = inject(AuthService); 
  faUserCircle = faUserCircle;
  faHelmetSafety = faHelmetSafety;
  faUserEdit = faUserEdit;
  faTimes = faTimes;
  faCrown = faCrown;
  faStar = faStar;
  faCheck = faCheck;
  faCameraRetro = faCameraRetro;
  faCommentMedical = faCommentMedical;
  faSms = faSms;
}