import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiResponse, NfcTag, User } from '../../core/models';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-claim',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './claim.html',
  styleUrl: './claim.scss'
})
export class Claim {
  private api = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  nfcId = this.route.snapshot.paramMap.get('nfcId') || '';
  step: 'checking' | 'ok' | 'claimed' | 'notfound' = 'checking';
  user: User | null = null;
  claimResult = '';
  claimedUserId: string | null = null;
  showPrivacy = false;
  visitorIp: string | null = null;
  visitorLocation: string | null = null;

  constructor() {
    // Verifica nfcId nella route
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

    // Recupera utente se loggato
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.user = JSON.parse(userStr);
    }
  }

  claimAuto() {
    console.log('Claiming NFC tag:', this.nfcId, 'for user:', this.user?.id);
    if (!this.user?.id) {
      this.router.navigate(['/login'], { queryParams: { redirect: `/claim/${this.nfcId}` } });
      return;
    }
    this.api.claimNfc(this.nfcId, this.user.id).subscribe({
      next: () => {
        this.claimResult = 'Casco associato al profilo con successo!';
        setTimeout(() => this.router.navigate(['/profile']), 1200);
      },
      error: err => {
        this.claimResult = err.error?.error || 'Errore durante l’associazione';
      }
    });
  }

  logout() {
    localStorage.removeItem('user');
    this.user = null;
    this.router.navigate(['/login']);
  }

  acceptPrivacy() {
    this.showPrivacy = false;
    if (this.claimedUserId && this.nfcId) {
      this.router.navigate(['/scheda', this.nfcId]);
    }
  }

  loadVisitorIp() {
    fetch('https://api.ipify.org/?format=json')
      .then(r => r.json())
      .then(data => this.visitorIp = data.ip)
      .catch(() => this.visitorIp = null);
  }

  loadVisitorLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)
            .then(r => r.json())
            .then(data => {
              if (data && data.address) {
                this.visitorLocation =
                  data.address.city ||
                  data.address.town ||
                  data.address.village ||
                  data.address.hamlet ||
                  data.address.county ||
                  data.address.state ||
                  data.display_name ||
                  `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`;
              } else {
                this.visitorLocation = `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`;
              }
            })
            .catch(() => {
              this.visitorLocation = `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`;
            });
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
