import { Component, inject } from '@angular/core';
import { Navbar } from "../../components/navbar/navbar";
import { Footer } from "../../components/footer/footer";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiResponse, NfcTag, User } from '../../models'; // importa le interfacce giuste

@Component({
  selector: 'app-claim',
  imports: [Navbar, Footer, CommonModule, FormsModule],
  templateUrl: './claim.html',
  styleUrl: './claim.scss'
})
export class Claim {
  // Dipendenze "iniettate"
  private api = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  nfcId = this.route.snapshot.paramMap.get('nfcId') || '';
  step: 'checking' | 'ok' | 'claimed' | 'notfound' = 'checking';
  user: User | null = null;

  // Login & Register state
  authTab: 'login' | 'register' = 'login';
  loginEmail = '';
  loginPassword = '';
  regEmail = '';
  regPassword = '';
  regPassword2 = '';
  loginError = '';
  registerError = '';
  claimResult = '';
  claimedUserId: string | null = null;

  showPrivacy = false;
  visitorIp: string | null = null;
  visitorLocation: string | null = null;


  constructor() {
    // Controllo che l'nfcId sia presente
    if (!this.nfcId) {
      this.step = 'notfound';
      return;
    }

    // Verifica tag NFC
    this.api.getTag(this.nfcId).subscribe({
      next: (res: ApiResponse<NfcTag>) => {
        if (res.success && res.data) {
          if (res.data.userId) {
            this.claimedUserId = res.data.userId;
            this.step = 'claimed';
            // Mostra popup privacy automaticamente
            this.showPrivacy = true;
            this.loadVisitorIp();
            this.loadVisitorLocation();
          } else {
            this.step = 'ok';
          }
        } else {
          this.step = 'notfound';
        }
      },
      error: () => {
        this.step = 'notfound';
      }
    });


    // Recupera utente da localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.user = JSON.parse(userStr);
    }
  }

  login() {
    this.loginError = '';

    if (!this.loginEmail || !this.loginEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      this.loginError = 'Inserisci una email valida.';
      return;
    }
    if (!this.loginPassword || this.loginPassword.length < 6) {
      this.loginError = 'La password deve contenere almeno 6 caratteri.';
      return;
    }

    this.api.login(this.loginEmail, this.loginPassword).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.user = res.data;
          localStorage.setItem('user', JSON.stringify(res.data));
          // this.claimAuto();
        } else {
          this.loginError = res.error || 'Login fallito';
        }
      },
      error: err => {
        this.loginError = err.error?.error || 'Login fallito';
      }
    });
  }

  register() {
    this.registerError = '';

    if (!this.regEmail || !this.regEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      this.registerError = 'Inserisci una email valida.';
      return;
    }
    if (!this.regPassword || this.regPassword.length < 6) {
      this.registerError = 'La password deve contenere almeno 6 caratteri.';
      return;
    }
    if (this.regPassword !== this.regPassword2) {
      this.registerError = 'Le password non coincidono.';
      return;
    }

    this.api.register({
      email: this.regEmail,
      password: this.regPassword
    }).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.user = res.data;
          localStorage.setItem('user', JSON.stringify(res.data));
          // this.claimAuto();
        } else {
          this.registerError = res.error || 'Registrazione fallita';
        }
      },
      error: err => {
        this.registerError = err.error?.error || 'Registrazione fallita';
      }
    });
  }

  claimAuto() {
    if (!this.user?.id) return;
    this.api.claimNfc(this.nfcId, this.user.id).subscribe({
      next: () => {
        this.claimResult = 'Casco associato al profilo con successo!';
        setTimeout(() => {
          this.router.navigate(['/profile']);
        }, 1200);
      },
      error: err => {
        this.claimResult = err.error?.error || 'Errore durante l’associazione';
      }
    });
  }

  logout() {
  localStorage.removeItem('user');
  this.user = null;
  // (opzionale) puoi anche reindirizzare:
  this.router.navigate(['/homepage']);
  }

  goToScheda() {
  if (this.claimedUserId && this.nfcId) {
    this.router.navigate(['/scheda', this.nfcId]);
  }
  }

  showPrivacyNotice() {
  this.showPrivacy = true;
  this.loadVisitorIp();
  this.loadVisitorLocation();
  }

  acceptPrivacy() {
    // Qui puoi loggare ip/posizione etc.
    this.showPrivacy = false;
    if (this.claimedUserId && this.nfcId) {
      this.router.navigate(['/scheda', this.nfcId]);
    }
  }

  // Ottieni IP pubblico (esempio tramite un servizio pubblico)
  loadVisitorIp() {
    fetch('https://api.ipify.org/?format=json')
      .then(r => r.json())
      .then(data => this.visitorIp = data.ip)
      .catch(() => this.visitorIp = null);
  }

  // Geolocalizzazione approssimativa
  loadVisitorLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          this.visitorLocation = `Lat: ${pos.coords.latitude.toFixed(4)}, Lon: ${pos.coords.longitude.toFixed(4)}`;
        },
        () => { this.visitorLocation = 'Posizione non autorizzata'; }
      );
    } else {
      this.visitorLocation = 'Non supportata';
    }
  }

  goBack() {
  this.showPrivacy = false;
  this.router.navigate(['/homepage']);
  }

}
