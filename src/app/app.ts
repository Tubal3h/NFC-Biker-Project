// in src/app/app.component.ts

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router'; // Importa Router
import { CommonModule } from '@angular/common';
import { Navbar } from "./shared/components/navbar/navbar";
import { Footer } from "./shared/components/footer/footer";
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCoffee } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, Navbar, Footer, FontAwesomeModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  faCoffee = faCoffee;

  constructor() {

  }
  


}