import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api';
import { MedicalData, ApiResponse, NfcTag } from '../../models';
import { Navbar } from "../../components/navbar/navbar";
import { Footer } from "../../components/footer/footer";

@Component({
  selector: 'app-scheda',
  standalone: true,
  imports: [CommonModule, Navbar, Footer],
  templateUrl: './scheda.html',
  styleUrl: './scheda.scss'
})
export class Scheda {
  nfcId = '';
  userId = '';
  medicalData: MedicalData | null = null;
  errorMsg = '';
  isLoaded = false;

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    // Prendi l'ID dalla route
    this.nfcId = this.route.snapshot.paramMap.get('nfcId') || '';
    if (!this.nfcId) {
      this.errorMsg = 'Tag non valido.';
      this.isLoaded = true;
      return;
    }

    this.api.getTag(this.nfcId).subscribe({
      next: (res: ApiResponse<NfcTag>) => {
        if (res.success && res.data && res.data.userId) {
          this.userId = res.data.userId;
          this.api.getMedicalData(this.userId).subscribe({
            next: (medRes) => {
              // Vuoto se tutti i valori sono falsy
              if (medRes.success && medRes.data && Object.values(medRes.data).some(v => v)) {
                this.medicalData = medRes.data;
              } else {
                this.errorMsg = 'Scheda medica non compilata.';
              }
              this.isLoaded = true;
            },
            error: () => {
              this.errorMsg = 'Errore nel caricamento dati.';
              this.isLoaded = true;
            }
          });
        } else {
          this.errorMsg = 'Scheda non disponibile o non associata.';
          this.isLoaded = true;
        }
      },
      error: () => {
        this.errorMsg = 'Tag non valido.';
        this.isLoaded = true;
      }
    });
  }

  goToClaim() {
    this.router.navigate(['/claim', this.nfcId]);
  }

}
