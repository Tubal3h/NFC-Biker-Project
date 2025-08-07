// in src/app/core/services/api.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import { AuthUser, NfcTag, MedicalData, ApiResponse } from '@app/core/models';

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

  // --- Funzioni per i Tag NFC ---
  claimNfc(nfcId: string, userId: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/claim`, { nfcId, userId });
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

  // --- Funzioni per i Dati Medici (ORA ALLINEATE AL TUO server.js) ---

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
  // in api.service.ts
  upgradeToPremium(userId: string): Observable<ApiResponse<AuthUser>> {
    return this.http.post<ApiResponse<AuthUser>>(`${this.apiUrl}/upgrade`, { userId });
  }

  dissociateTag(nfcId: string): Observable<ApiResponse<void>> {
  return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/tags/${nfcId}/dissociate`);
}
}

