// in src/app/features/dashboard/dashboard.ts

import { Component, inject, OnInit } from '@angular/core'; // Aggiungi OnInit
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '@app/core/services/auth';
import { ApiService } from '@app/core/services/api'; // Importa ApiService
import { AuthUser, NfcTag } from '@app/core/models'; // Importa NfcTag

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  private authService = inject(AuthService);
  private apiService = inject(ApiService); // Inietta ApiService

  user$ = this.authService.user$;
  
  // Nuovo stato per memorizzare la lista dei tag
  userTags: NfcTag[] = [];
  tagsLoading = true;

  ngOnInit(): void {
    this.loadUserTags();
  }

  loadUserTags(): void {
    const currentUser = this.authService.user;
    if (!currentUser) {
      this.tagsLoading = false;
      return;
    }

    this.apiService.getUserTags(currentUser.id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.userTags = response.data;
        }
        this.tagsLoading = false;
      },
      error: () => {
        this.tagsLoading = false;
      }
    });
  }
}