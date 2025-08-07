// in src/app/features/tag-management/tag-management.ts

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '@app/core/services/api';
import { AuthService } from '@app/core/services/auth';
import { NfcTag } from '@app/core/models';
import { NotificationService } from '@app/core/services/notification';

@Component({
  selector: 'app-tag-management',
  imports: [CommonModule, RouterModule],
  templateUrl: './tag-management.html',
  styleUrl: './tag-management.scss'
})
export class TagManagement implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private notification = inject(NotificationService); 

  isLoading = true;
  errorMsg = '';
  tags: NfcTag[] = [];

  ngOnInit(): void {
    this.loadTags();
  }

  loadTags(): void {
    const currentUser = this.auth.user;
    if (!currentUser) {
      this.errorMsg = 'Utente non trovato.';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.api.getUserTags(currentUser.id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.tags = response.data;
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMsg = 'Impossibile caricare i dispositivi.';
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  renameTag(tag: NfcTag): void {
    // Sostituiamo l'alert con una notifica informativa
    this.notification.showInfo('La funzionalità per rinominare i dispositivi sarà disponibile a breve.', 'Coming Soon');
    console.log('Richiesta di rinominare il tag:', tag.nfcId);
  }

  dissociateTag(tagToDissociate: NfcTag): void {
    if (confirm(`Sei sicuro di voler dissociare il casco "${tagToDissociate.nfcId}" dal tuo account?`)) {
      
      this.api.dissociateTag(tagToDissociate.nfcId).subscribe({
        next: (response) => {
          if (response.success) {
            this.tags = this.tags.filter(tag => tag.id !== tagToDissociate.id);
            // 3. Sostituiamo alert() con una notifica di successo
            this.notification.showSuccess(`Il dispositivo "${tagToDissociate.nfcId}" è stato dissociato.`);
          } else {
            this.notification.showError(response.error || 'Si è verificato un errore.');
          }
        },
        error: (err) => {
          // 4. Sostituiamo alert() con una notifica di errore
          this.notification.showError(err.error?.error || 'Impossibile dissociare il dispositivo.');
        }
      });
    }
  }

}