import { Component } from '@angular/core';
import { Navbar } from "../../components/navbar/navbar";
import { LogoGif } from "../../components/logo-gif/logo-gif";
import { Footer } from "../../components/footer/footer";

@Component({
  selector: 'app-homepage',
  imports: [Navbar, LogoGif, Footer],
  templateUrl: './homepage.html',
  styleUrl: './homepage.scss'
})
export class Homepage {

}
