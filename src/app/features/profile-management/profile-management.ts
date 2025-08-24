// in src/app/features/profile-management/profile-management.ts

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '@app/core/services/api';
import { AuthService } from '@app/core/services/auth';
import { NotificationService } from '@app/core/services/notification';
import { MedicalProfile, NfcTag, AuthUser } from '@app/core/models';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-profile-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './profile-management.html',
  styleUrls: ['./profile-management.scss']
})
export class ProfileManagement implements OnInit {
  private api = inject(ApiService);
  auth = inject(AuthService); // Pubblico per l'uso nel template
  private notification = inject(NotificationService);
  // private router = inject(Router);

  isLoading = true;
  profiles: MedicalProfile[] = [];
  isCreateModalVisible = false;
  newProfileNameValue = '';
  isDeleteModalVisible = false;
  profileToDelete: MedicalProfile | null = null;
  allUserTags: NfcTag[] = [];
  unassignedTags: NfcTag[] = [];
  isTagSyncModalVisible = false;
  profileToManage: MedicalProfile | null = null;
  selectedTagIds: Set<string> = new Set();

  ngOnInit(): void {
    // this.loadProfiles();
    this.loadInitialData();
  }

    // Funzione che carica TUTTO all'inizio
  loadInitialData(): void {
    const userId = this.auth.user?.id;
    if (!userId) return;
    this.isLoading = true;
    
    forkJoin({
      profiles: this.api.getUserProfiles(userId),
      tags: this.api.getUserTags(userId) // Carichiamo TUTTI i tag dell'utente
    }).subscribe({
      next: ({ profiles, tags }) => {
        if (profiles.success && profiles.data) this.profiles = profiles.data;
        if (tags.success && tags.data) {
          this.allUserTags = tags.data;
          // Filtriamo per trovare quelli non assegnati
          this.unassignedTags = this.allUserTags.filter(tag => !tag.profileId);
        }
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

    // Funzione per trovare i tag associati a un profilo specifico
  getTagsForProfile(profileId: string): NfcTag[] {
    return this.allUserTags.filter(tag => tag.profileId === profileId);
  }

  // Funzione per associare un tag (chiamata dall'HTML)
  assignTag(tagId: string, profileId: string) {
    if (!tagId) return;
    this.api.assignTagToProfile(tagId, profileId).subscribe(() => {
      this.notification.showSuccess('Casco associato al profilo!');
      this.loadInitialData(); // Ricarica tutto per aggiornare le liste
    });
  }

  loadProfiles(): void {
    const userId = this.auth.user?.id;
    if (!userId) {
      this.notification.showError("Impossibile caricare i profili: utente non trovato.");
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.api.getUserProfiles(userId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.profiles = res.data;
        }
        this.isLoading = false;
      },
      error: () => {
        this.notification.showError("Errore nel caricamento dei profili.");
        this.isLoading = false;
      }
    });
  }

  openCreateModal(): void {
    this.newProfileNameValue = '';
    this.isCreateModalVisible = true;
  }

  closeCreateModal(): void {
    this.isCreateModalVisible = false;
  }

  submitNewProfile(): void {
    const userId = this.auth.user?.id;
    if (!userId || !this.newProfileNameValue || this.newProfileNameValue.trim() === '') {
      this.notification.showError("Per favore, inserisci un nome per il profilo.");
      return;
    }
    
    this.api.createProfile(userId, this.newProfileNameValue.trim()).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.profiles.push(res.data);
          this.notification.showSuccess(`Profilo creato con successo.`);
          this.closeCreateModal();
        } else {
          this.notification.showError(res.error || "Impossibile creare il profilo.");
        }
      },
      error: (err) => this.notification.showError(err.error?.error || "Errore di rete.")
    });
  }

  deleteProfile(profileId: string, profileName: string): void {
    if (!profileId) return;

    // Chiediamo conferma prima di un'azione distruttiva
    if (confirm(`Sei sicuro di voler eliminare il profilo "${profileName}"? Questa azione non può essere annullata.`)) {
      this.api.deleteProfile(profileId).subscribe({
        next: (res) => {
          if (res.success) {
            // Rimuoviamo il profilo dalla lista per un aggiornamento istantaneo
            this.profiles = this.profiles.filter(p => p.id !== profileId);
            this.notification.showSuccess(`Profilo "${profileName}" eliminato.`);
          } else {
            this.notification.showError(res.error || "Impossibile eliminare il profilo.");
          }
        },
        error: (err) => this.notification.showError(err.error?.error || "Errore di rete.")
      });
    }
  }

  openDeleteModal(profile: MedicalProfile): void {
    this.profileToDelete = profile;
    this.isDeleteModalVisible = true;
  }
  
  closeDeleteModal(): void {
    this.isDeleteModalVisible = false;
    this.profileToDelete = null;
  }

  submitDelete(): void {
    if (!this.profileToDelete || !this.profileToDelete.id) return;

    this.api.deleteProfile(this.profileToDelete.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.profiles = this.profiles.filter(p => p.id !== this.profileToDelete!.id);
          this.notification.showSuccess(`Profilo "${this.profileToDelete!.profileName}" eliminato.`);
          this.closeDeleteModal();
        } else {
          this.notification.showError(res.error || "Impossibile eliminare il profilo.");
        }
      },
      error: (err) => this.notification.showError(err.error?.error || "Errore di rete.")
    });
  }

  openTagSyncModal(profile: MedicalProfile): void {
    this.profileToManage = profile;
    // Pre-popola il Set con i tag già associati a questo profilo
    const associatedTags = this.allUserTags.filter(t => t.profileId === profile.id);
    this.selectedTagIds = new Set(associatedTags.map(t => t.id!));
    this.isTagSyncModalVisible = true;
  }

  closeTagSyncModal(): void {
    this.isTagSyncModalVisible = false;
  }

  isTagSelectedForCurrentProfile(tag: NfcTag): boolean {
    return this.selectedTagIds.has(tag.id!);
  }

  onTagSelectionChange(tagId: string, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) {
      if (this.selectedTagIds.size >= 10) {
        (event.target as HTMLInputElement).checked = false; // Annulla la spunta
        this.notification.showWarning('Puoi associare un massimo di 10 caschi.');
        return;
      }
      this.selectedTagIds.add(tagId);
    } else {
      this.selectedTagIds.delete(tagId);
    }
  }


  submitTagSync(): void {
    if (!this.profileToManage || !this.auth.user) return;

    // --- NUOVO CONTROLLO DI SICUREZZA PER L'ESPERIENZA UTENTE ---
    const isMainProfile = this.profileToManage.id === this.auth.user.mainProfileId;
    const isTryingToEmptyList = this.selectedTagIds.size === 0;
    const currentTagsOnProfile = this.getTagsForProfile(this.profileToManage.id!);

    // Blocca l'azione se si sta cercando di svuotare il profilo principale
    // e ci sono effettivamente dei caschi da rimuovere.
    if (isMainProfile && isTryingToEmptyList && currentTagsOnProfile.length > 0) {
      this.notification.showError(
        "Non puoi lasciare il profilo principale senza caschi. Per rimuoverli da qui, associali prima a un altro profilo."
      );
      return; // Interrompe la funzione prima di chiamare il backend
    }
    // --- FINE DEL CONTROLLO ---

    const tagIdsArray = Array.from(this.selectedTagIds);
    this.api.syncTagsForProfile(this.profileToManage.id!, tagIdsArray, this.auth.user!.id).subscribe(() => {
      this.notification.showSuccess('Associazioni salvate!');
      this.closeTagSyncModal();
      this.loadInitialData(); // Ricarica tutto
    });
  }

  setAsMainProfile(profileId: string): void {
    const userId = this.auth.user?.id;
    if (!userId || !profileId) return;

    this.api.setMainProfile(userId, profileId).subscribe({
      next: (res) => {
        if (res.success) {
          this.notification.showSuccess('Profilo principale aggiornato!');
          // Aggiorniamo l'utente locale nell'AuthService per riflettere il cambiamento
          const updatedUser = { ...this.auth.user!, mainProfileId: profileId };
          this.auth.updateUser(updatedUser as AuthUser); // Usiamo il metodo login per aggiornare lo stato
        } else {
          this.notification.showError(res.error || "Impossibile aggiornare il profilo.");
        }
      },
      error: (err) => this.notification.showError(err.error?.error || "Errore di rete.")
    });
  }
}