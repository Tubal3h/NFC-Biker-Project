// in src/app/features/tag-management/tag-management.ts

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '@app/core/services/api';
import { AuthService } from '@app/core/services/auth';
import { NfcTag } from '@app/core/models';
import { NotificationService } from '@app/core/services/notification';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tag-management',
  imports: [CommonModule, RouterModule, FormsModule],
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
  isRenameModalVisible = false;
  tagToRename: NfcTag | null = null;
  newAliasValue = '';

  ngOnInit(): void {
    this.loadTags();
  }

   // --- NUOVE FUNZIONI PER GESTIRE IL POPUP ---

  openRenameModal(tag: NfcTag): void {
    this.tagToRename = tag;
    this.newAliasValue = tag.alias || ''; // Pre-compila l'input con il nome attuale
    this.isRenameModalVisible = true;
  }

  closeRenameModal(): void {
    this.isRenameModalVisible = false;
    this.tagToRename = null;
    this.newAliasValue = '';
  }

  submitRename(): void {
    if (!this.tagToRename || !this.newAliasValue || this.newAliasValue.trim() === '') {
      this.notification.showError('Per favore, inserisci un nome valido.');
      return;
    }

    this.api.renameTag(this.tagToRename.id, this.newAliasValue.trim()).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const index = this.tags.findIndex(t => t.id === this.tagToRename!.id);
          if (index !== -1) {
            this.tags[index].alias = response.data.alias;
          }
          this.notification.showSuccess('Dispositivo rinominato con successo!');
          this.closeRenameModal(); // Chiude il popup dopo il successo
        } else {
          this.notification.showError(response.error || 'Si è verificato un errore.');
        }
      },
      error: (err) => {
        this.notification.showError(err.error?.error || 'Impossibile rinominare il dispositivo.');
      }
    });
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

  renameTag(tagToRename: NfcTag): void {
    // Usiamo il `prompt` di JavaScript per una soluzione semplice e veloce
    const newAlias = prompt('Inserisci un nuovo nome per questo casco:', tagToRename.alias || tagToRename.nfcId);

    // Se l'utente preme "Annulla" o non inserisce nulla, non facciamo niente
    if (!newAlias || newAlias.trim() === '') {
      return;
    }

    // Chiamiamo la nostra nuova funzione API
    this.api.renameTag(tagToRename.id, newAlias.trim()).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // --- MIGLIORAMENTO UX ---
          // Aggiorniamo l'alias nel nostro array locale per un refresh istantaneo,
          // senza dover ricaricare tutti i tag dal server.
          const index = this.tags.findIndex(t => t.id === tagToRename.id);
          if (index !== -1) {
            this.tags[index].alias = response.data.alias;
          }
          
          this.notification.showSuccess('Dispositivo rinominato con successo!');
        } else {
          this.notification.showError(response.error || 'Si è verificato un errore.');
        }
      },
      error: (err) => {
        this.notification.showError(err.error?.error || 'Impossibile rinominare il dispositivo.');
      }
    });
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