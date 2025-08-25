import { Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faHelmetSafety, faMobileAlt, faUserEdit, faRoute, faBoxOpen, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { faTelegramPlane } from '@fortawesome/free-brands-svg-icons';

@Component({
  selector: 'app-homepage',
  imports: [FontAwesomeModule],
  templateUrl: './homepage.html',
  styleUrl: './homepage.scss'
})
export class Homepage {
  faHelmetSafety = faHelmetSafety;
  faMobileAlt = faMobileAlt;
  faUserEdit = faUserEdit;
  faRoute = faRoute;
  faBoxOpen = faBoxOpen;
  faCheckCircle = faCheckCircle;
  faTelegramPlane = faTelegramPlane;
}
