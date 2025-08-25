// in src/app/features/tag-management/tag-management.ts

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '@app/core/services/api';
import { AuthService } from '@app/core/services/auth';
import { NfcTag } from '@app/core/models';
import { NotificationService } from '@app/core/services/notification';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faTrash, faPencilAlt } from '@fortawesome/free-solid-svg-icons';


@Component({
  selector: 'app-tag-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FontAwesomeModule],
  templateUrl: './tag-management.html',
  styleUrls: ['./tag-management.scss']
})
export class TagManagement implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private notification = inject(NotificationService);

  faArrowLeft = faArrowLeft;
  faTrash = faTrash;
  faPencilAlt = faPencilAlt;

  isLoading = true;
  errorMsg = '';
  tags: NfcTag[] = [];

  // Proprietà per il modale di rinomina
  isRenameModalVisible = false;
  tagToRename: NfcTag | null = null;
  newAliasValue = '';

  // --- NUOVE PROPRIETÀ PER IL MODALE DI ELIMINAZIONE ---
  isDeleteModalVisible = false;
  tagToDelete: NfcTag | null = null;

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

  // --- Gestione Modale Rinomina ---
  openRenameModal(tag: NfcTag): void {
    this.tagToRename = tag;
    this.newAliasValue = tag.alias || '';
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
          this.closeRenameModal();
        } else {
          this.notification.showError(response.error || 'Si è verificato un errore.');
        }
      },
      error: (err) => {
        this.notification.showError(err.error?.error || 'Impossibile rinominare il dispositivo.');
      }
    });
  }

  // --- NUOVA GESTIONE MODALE ELIMINAZIONE ---

  // Questo ora apre solo il popup, non usa più `confirm()`
  openDeleteModal(tag: NfcTag): void {
    this.tagToDelete = tag;
    this.isDeleteModalVisible = true;
  }

  closeDeleteModal(): void {
    this.isDeleteModalVisible = false;
    this.tagToDelete = null;
  }

  // Questa funzione viene chiamata dal pulsante di conferma nel popup
  submitDelete(): void {
    if (!this.tagToDelete) return;

    this.api.dissociateTag(this.tagToDelete.nfcId).subscribe({
      next: (response) => {
        if (response.success) {
          this.tags = this.tags.filter(tag => tag.id !== this.tagToDelete!.id);
          this.notification.showSuccess(`Il dispositivo "${this.tagToDelete!.nfcId}" è stato dissociato.`);
          this.closeDeleteModal(); // Chiude il popup
        } else {
          this.notification.showError(response.error || 'Si è verificato un errore.');
        }
      },
      error: (err) => {
        this.notification.showError(err.error?.error || 'Impossibile dissociare il dispositivo.');
      }
    });
  }
}