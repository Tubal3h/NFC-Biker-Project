import { Component } from '@angular/core';
import { Navbar } from "../../components/navbar/navbar";
import { Footer } from "../../components/footer/footer";

@Component({
  selector: 'app-guide',
  imports: [Navbar, Footer],
  templateUrl: './guide.html',
  styleUrl: './guide.scss'
})
export class Guide {

}
