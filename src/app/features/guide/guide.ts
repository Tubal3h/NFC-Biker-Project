import { Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faFirstAid, faMotorcycle} from '@fortawesome/free-solid-svg-icons';


@Component({
  selector: 'app-guide',
  imports: [FontAwesomeModule],
  templateUrl: './guide.html',
  styleUrl: './guide.scss'
})
export class Guide {
  faFirstAid = faFirstAid;
  faMotorcycle = faMotorcycle;
}
