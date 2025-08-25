// in src/app/features/dashboard/dashboard.ts

import { Component, inject, OnInit } from '@angular/core'; // Aggiungi OnInit
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '@app/core/services/auth';
import { ApiService } from '@app/core/services/api'; // Importa ApiService
import { forkJoin } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUsers, faUserAstronaut, faHelmetSafety, faGear  } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule , FontAwesomeModule,],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  private authService = inject(AuthService);
  private apiService = inject(ApiService); // Inietta ApiService

  user$ = this.authService.user$;

  
  // FontAwesomeIcons = {
  //   faUsers:faUsers
  // };
  faUsers = faUsers;
  faUserAstronaut = faUserAstronaut;
  faHelmetSafety = faHelmetSafety;
  faGear = faGear;

  // Nuovo stato per memorizzare la lista dei tag
  profileCount = 0;
  tagCount = 0;
  userName: string | null = null;
  isLoadingData = true;

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    const currentUser = this.authService.user;
    if (!currentUser?.id || !currentUser?.mainProfileId) {
      this.isLoadingData = false;
      return;
    }

    this.isLoadingData = true;
    
    // Usiamo forkJoin per eseguire le chiamate API contemporaneamente
    forkJoin({
      mainProfile: this.apiService.getMedicalProfileById(currentUser.mainProfileId),
      profiles: this.apiService.getUserProfiles(currentUser.id),
      tags: this.apiService.getUserTags(currentUser.id)
    }).subscribe({
      next: ({ mainProfile, profiles, tags }) => {
        if (mainProfile.success && mainProfile.data) {
          // Estraiamo il nome dal profilo principale per il saluto
          this.userName = mainProfile.data.name;
        }
        if (profiles.success && profiles.data) {
          this.profileCount = profiles.data.length;
        }
        if (tags.success && tags.data) {
          this.tagCount = tags.data.length;
        }
        this.isLoadingData = false;
      },
      error: () => {
        this.isLoadingData = false;
        // Qui potresti mostrare una notifica di errore se il caricamento fallisce
      }
    });
  }
}