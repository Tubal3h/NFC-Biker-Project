import { Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBolt, faShieldAlt, faUsers} from '@fortawesome/free-solid-svg-icons';
import { faTelegramPlane } from '@fortawesome/free-brands-svg-icons';

@Component({
  selector: 'app-about',
  imports: [FontAwesomeModule],
  templateUrl: './about.html',
  styleUrl: './about.scss'
})
export class About {
  faBolt = faBolt;
  faShieldAlt = faShieldAlt;
  faUsers = faUsers;
  faTelegramPlane = faTelegramPlane;
}
