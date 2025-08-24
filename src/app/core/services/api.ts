// in src/app/core/services/api.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import { AuthUser, NfcTag, MedicalData, ApiResponse, MedicalProfile } from '@app/core/models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  // L'URL base ora punta alla radice delle tue API definite in server.js
  // private apiUrl = 'http://localhost:3000/api';
  private apiUrl = environment.apiUrl; // Usa l'URL definito nell'ambiente

  constructor(private http: HttpClient) {}

  // --- Funzioni di Autenticazione ---
  register(user: { email: string; password: string }): Observable<ApiResponse<AuthUser>> {
    return this.http.post<ApiResponse<AuthUser>>(`${this.apiUrl}/register`, user);
  }

  login(email: string, password: string): Observable<ApiResponse<AuthUser>> {
    return this.http.post<ApiResponse<AuthUser>>(`${this.apiUrl}/login`, { email, password });
  }

  /* -------------------------------------------------------------------------- */
  /*                               CAMBIO PASSWORD                              */
  /* -------------------------------------------------------------------------- */

  changePassword(userId: string, passwordData: any): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/user/${userId}/change-password`, passwordData);
  }

 /* -------------------------------------------------------------------------- */
 /*                         Funzioni per i Tag NFC ---                         */
 /* -------------------------------------------------------------------------- */

claimNfc(nfcId: string, userId: string): Observable<ApiResponse<{ message: string; profileId: string }>> {
  return this.http.post<ApiResponse<{ message: string; profileId: string }>>(`${this.apiUrl}/claim`, { nfcId, userId });
}
  
  getTag(nfcId: string): Observable<ApiResponse<NfcTag>> {
    return this.http.get<ApiResponse<NfcTag>>(`${this.apiUrl}/tag/${nfcId}`);
  }

/**
 * Recupera la lista di tutti i tag NFC (come oggetti completi) associati a un utente.
 */
  getUserTags(userId: string): Observable<ApiResponse<NfcTag[]>> { // <-- Il tipo di ritorno è già corretto!
    return this.http.get<ApiResponse<NfcTag[]>>(`${this.apiUrl}/user/${userId}/tags`);
  }

  /* -------------------------------------------------------------------------- */
  /*       Funzioni per i Dati Medici (ORA ALLINEATE AL TUO server.js) ---      */
  /* -------------------------------------------------------------------------- */
  
  /**
   * Recupera i dati sanitari di un utente.
   * Chiama l'endpoint GET /api/user/:userId/medical che hai creato.
   */
  getMedicalData(userId: string): Observable<ApiResponse<MedicalData>> {
    return this.http.get<ApiResponse<MedicalData>>(`${this.apiUrl}/user/${userId}/medical`);
  }

  /**
   * Aggiorna i dati sanitari di un utente.
   * Chiama l'endpoint PUT /api/user/:userId/medical che hai creato.
   */
  updateMedicalData(userId: string, data: MedicalData): Observable<ApiResponse<MedicalData>> {
    // Il tuo backend si aspetta un PUT e restituisce i dati medici aggiornati
    return this.http.put<ApiResponse<MedicalData>>(`${this.apiUrl}/user/${userId}/medical`, data);
  }

  /**
   * Aggiorna i dati anagrafici (nome/cognome) di un utente.
   */
  updateUserProfile(userId: string, profileData: { name: string; surname: string }): Observable<ApiResponse<AuthUser>> {
    return this.http.patch<ApiResponse<AuthUser>>(`${this.apiUrl}/user/${userId}/profile`, profileData);
  }  

  getUser(userId: string): Observable<ApiResponse<AuthUser>> {
    return this.http.get<ApiResponse<AuthUser>>(`${this.apiUrl}/user/${userId}`);
  }
  
  upgradeToPremium(userId: string, activationCode: string): Observable<ApiResponse<AuthUser>> {
    return this.http.post<ApiResponse<AuthUser>>(`${this.apiUrl}/user/${userId}/upgrade-premium`, { activationCode });
  }

  dissociateTag(nfcId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/tags/${nfcId}/dissociate`);
  }

  forgotPassword(email: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, password: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/auth/reset-password/${token}`, { password });
  }

  // nome casco
  renameTag(tagId: string, alias: string): Observable<ApiResponse<NfcTag>> {
    return this.http.patch<ApiResponse<NfcTag>>(`${this.apiUrl}/tags/${tagId}/rename`, { alias });
  }


  // in src/app/core/services/api.service.ts
getMedicalProfileById(profileId: string): Observable<ApiResponse<MedicalProfile>> {
  return this.http.get<ApiResponse<MedicalProfile>>(`${this.apiUrl}/profiles/${profileId}`);
}


  // --- Funzioni per la Gestione dei Profili Medici ---

/**
 * Recupera la lista di tutti i profili medici di un utente.
 */
getUserProfiles(userId: string): Observable<ApiResponse<MedicalProfile[]>> {
  return this.http.get<ApiResponse<MedicalProfile[]>>(`${this.apiUrl}/user/${userId}/profiles`);
}

/**
 * Crea un nuovo profilo medico per un utente.
 */
createProfile(userId: string, profileName: string): Observable<ApiResponse<MedicalProfile>> {
  return this.http.post<ApiResponse<MedicalProfile>>(`${this.apiUrl}/user/${userId}/profiles`, { profileName });
}

/**
 * Elimina un profilo medico specifico.
 */
deleteProfile(profileId: string): Observable<ApiResponse<void>> {
  return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/profiles/${profileId}`);
}

updateMedicalProfile(profileId: string, data: MedicalProfile): Observable<ApiResponse<void>> {
  return this.http.put<ApiResponse<void>>(`${this.apiUrl}/profiles/${profileId}`, data);
}

switchTagProfile(nfcId: string, newProfileId: string): Observable<ApiResponse<NfcTag>> {
  return this.http.patch<ApiResponse<NfcTag>>(`${this.apiUrl}/tags/${nfcId}/switch-profile`, { newProfileId });
}


getUnassignedTags(userId: string): Observable<ApiResponse<NfcTag[]>> {
  return this.http.get<ApiResponse<NfcTag[]>>(`${this.apiUrl}/user/${userId}/unassigned-tags`);
}

assignTagToProfile(tagId: string, profileId: string): Observable<ApiResponse<NfcTag>> {
  return this.http.patch<ApiResponse<NfcTag>>(`${this.apiUrl}/tags/${tagId}/assign-profile`, { profileId });
}


syncTagsForProfile(profileId: string, tagIds: string[], ownerId: string): Observable<ApiResponse<void>> {
  return this.http.post<ApiResponse<void>>(`${this.apiUrl}/profiles/${profileId}/sync-tags`, { tagIds, ownerId });
}

// in api.service.ts
setMainProfile(userId: string, newProfileId: string): Observable<any> {
  return this.http.patch(`${this.apiUrl}/user/${userId}/set-main-profile`, { newProfileId });
}



getLocationInfo(lat: number, lon: number): Observable<ApiResponse<{ location: string }>> {
  return this.http.get<ApiResponse<{ location: string }>>(`${this.apiUrl}/location-info?lat=${lat}&lon=${lon}`);
}









}

