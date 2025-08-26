// in src/app/core/services/api.service.ts

import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ApiResponse, AuthUser, MedicalProfile, NfcTag } from '@app/core/models';

export interface AuthResponse extends ApiResponse<AuthUser> {
  token: string;
}
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // ======================================================
  // --- SEZIONE AUTENTICAZIONE (Auth) ---
  // ======================================================

  /**
   * Registra un nuovo utente e lo autentica immediatamente.
   * @param credentials Oggetto con email e password.
   * @returns Un oggetto contenente il token JWT e i dati del nuovo utente.
   */
  register(credentials: { email: string, password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, credentials);
  }
  
  /**
   * Esegue il login di un utente.
   * @param email L'email dell'utente.
   * @param password La password dell'utente.
   * @param rememberMe Booleano per impostare una durata della sessione più lunga.
   * @returns Un oggetto contenente il token JWT e i dati dell'utente.
   */
  login(email: string, password: string, rememberMe: boolean): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password, rememberMe });
  }

  /**
   * Invia il token di verifica dell'email al backend per la validazione.
   * @param token Il token ricevuto dall'utente tramite il link nell'email.
   * @returns Un observable con la risposta del server.
   */
  verifyEmail(token: string): Observable<ApiResponse<{ message: string; user: AuthUser; token: string; }>> {
    return this.http.get<ApiResponse<{ message: string; user: AuthUser; token: string; }>>(`${this.apiUrl}/auth/verify-email/${token}`);
  }


  /**
   * Aggiorna la password di un utente.
   * @param userId L'ID dell'utente.
   * @param passwordData Oggetto con la password attuale e quella nuova.
   * @returns Un messaggio di successo.
   */
  changePassword(userId: string, passwordData: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/user/${userId}/change-password`, passwordData);
  }

  /**
   * Invia una richiesta per iniziare il processo di reset password.
   * @param email L'email dell'utente che ha dimenticato la password.
   * @returns Un messaggio di conferma.
   */
  forgotPassword(email: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/auth/forgot-password`, { email });
  }

  /**
   * Completa il processo di reset password usando il token ricevuto via email.
   * @param token Il token JWT per il reset.
   * @param password La nuova password scelta dall'utente.
   * @returns Un messaggio di successo.
   */
  resetPassword(token: string, password: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/auth/reset-password/${token}`, { password });
  }

  // ======================================================
  // --- SEZIONE UTENTI (User) ---
  // ======================================================

  /**
   * Ottiene i dati pubblici di un utente tramite il suo ID.
   * @param userId L'ID dell'utente.
   * @returns I dati dell'utente.
   */
  getUser(userId: string): Observable<ApiResponse<AuthUser>> {
    return this.http.get<ApiResponse<AuthUser>>(`${this.apiUrl}/user/${userId}`);
  }

  /**
   * Permette a un utente Premium di impostare un nuovo profilo come principale.
   * @param userId L'ID dell'utente che esegue l'azione.
   * @param newProfileId L'ID del profilo da impostare come principale.
   * @returns Un messaggio di successo.
   */
  setMainProfile(userId: string, newProfileId: string): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.apiUrl}/user/${userId}/set-main-profile`, { newProfileId });
  }

  /**
   * Attiva un abbonamento Premium per un utente tramite un codice.
   * @param userId L'ID dell'utente.
   * @param activationCode Il codice di attivazione.
   * @returns I dati dell'utente aggiornati con lo stato Premium.
   */
  upgradeToPremium(userId: string, activationCode: string): Observable<ApiResponse<AuthUser>> {
    return this.http.post<ApiResponse<AuthUser>>(`${this.apiUrl}/user/${userId}/upgrade-premium`, { activationCode });
  }
  

  resendVerificationEmail(): Observable<ApiResponse<any>> {
  return this.http.post<ApiResponse<any>>(`${this.apiUrl}/auth/resend-verification`, {});
  }

  // ======================================================
  // --- SEZIONE PROFILI MEDICI (MedicalProfile) ---
  // ======================================================
  
  /**
   * Ottiene tutti i profili medici di un utente.
   * @param userId L'ID del proprietario dei profili.
   * @returns Un array di profili medici.
   */
  getUserProfiles(userId: string): Observable<ApiResponse<MedicalProfile[]>> {
    return this.http.get<ApiResponse<MedicalProfile[]>>(`${this.apiUrl}/user/${userId}/profiles`);
  }

  /**
   * Ottiene un singolo profilo medico tramite il suo ID.
   * @param profileId L'ID del profilo da recuperare.
   * @returns Il profilo medico.
   */
  getMedicalProfileById(profileId: string): Observable<ApiResponse<MedicalProfile>> {
    return this.http.get<ApiResponse<MedicalProfile>>(`${this.apiUrl}/profiles/${profileId}`);
  }

  /**
   * Crea un nuovo profilo medico per un utente.
   * @param userId L'ID dell'utente che crea il profilo.
   * @param profileName Il nome del nuovo profilo.
   * @returns Il nuovo profilo medico creato.
   */
  createProfile(userId: string, profileName: string): Observable<ApiResponse<MedicalProfile>> {
    return this.http.post<ApiResponse<MedicalProfile>>(`${this.apiUrl}/user/${userId}/profiles`, { profileName });
  }

  /**
   * Aggiorna un profilo medico esistente.
   * @param profileId L'ID del profilo da aggiornare.
   * @param profileData I dati aggiornati del profilo.
   * @returns Il profilo medico aggiornato.
   */
  updateMedicalProfile(profileId: string, profileData: MedicalProfile): Observable<ApiResponse<MedicalProfile>> {
    return this.http.put<ApiResponse<MedicalProfile>>(`${this.apiUrl}/profiles/${profileId}`, profileData);
  }

  /**
   * Elimina un profilo medico.
   * @param profileId L'ID del profilo da eliminare.
   * @returns Un messaggio di successo.
   */
  deleteProfile(profileId: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/profiles/${profileId}`);
  }

  // ======================================================
  // --- SEZIONE TAG NFC ---
  // ======================================================

  /**
   * Ottiene i dati di un singolo tag NFC tramite il suo nfcId fisico.
   * @param nfcId L'ID fisico del tag NFC.
   * @returns I dati del tag.
   */
  getTag(nfcId: string): Observable<ApiResponse<NfcTag>> {
    return this.http.get<ApiResponse<NfcTag>>(`${this.apiUrl}/tag/${nfcId}`);
  }

  /**
   * Ottiene tutti i tag NFC associati a un utente.
   * @param userId L'ID dell'utente.
   * @returns Un array di tag NFC.
   */
  getUserTags(userId: string): Observable<ApiResponse<NfcTag[]>> {
    return this.http.get<ApiResponse<NfcTag[]>>(`${this.apiUrl}/user/${userId}/tags`);
  }
  
  /**
   * Associa un nuovo tag NFC a un utente.
   * @param nfcId L'ID fisico del tag da associare.
   * @param userId L'ID dell'utente che sta associando il tag.
   * @returns Un messaggio di successo e l'ID del profilo a cui è stato collegato.
   */
  claimNfc(nfcId: string, userId: string): Observable<ApiResponse<{ message: string; profileId: string }>> {
    return this.http.post<ApiResponse<{ message: string; profileId: string }>>(`${this.apiUrl}/claim`, { nfcId, userId });
  }

  /**
   * Dissocia un tag da un account utente.
   * @param nfcId L'ID fisico del tag NFC da dissociare.
   * @returns Un messaggio di successo.
   */
  dissociateTag(nfcId: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/tags/${nfcId}/dissociate`);
  }

  /**
   * Assegna un nuovo nome (alias) a un tag.
   * @param tagId L'ID del documento del tag nel database.
   * @param alias Il nuovo nome per il tag.
   * @returns Il tag aggiornato.
   */
  renameTag(tagId: string, alias: string): Observable<ApiResponse<NfcTag>> {
    return this.http.patch<ApiResponse<NfcTag>>(`${this.apiUrl}/tags/${tagId}/rename`, { alias });
  }

  /**
   * Cambia il profilo medico associato a un tag specifico.
   * @param nfcId L'ID fisico del tag NFC.
   * @param newProfileId L'ID del nuovo profilo medico da associare.
   * @returns Il tag aggiornato.
   */
  switchTagProfile(nfcId: string, newProfileId: string): Observable<ApiResponse<NfcTag>> {
    return this.http.patch<ApiResponse<NfcTag>>(`${this.apiUrl}/tags/${nfcId}/switch-profile`, { newProfileId });
  }

  /**
   * Sincronizza i tag associati a un profilo medico.
   * @param profileId L'ID del profilo.
   * @param tagIds Un array di ID dei tag da associare a questo profilo.
   * @param ownerId L'ID dell'utente proprietario.
   * @returns Un messaggio di successo.
   */
  syncTagsForProfile(profileId: string, tagIds: string[], ownerId: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/profiles/${profileId}/sync-tags`, { tagIds, ownerId });
  }

  /**
   * Ottiene la lista dei tag di un utente non ancora associati a un profilo.
   * @param userId L'ID dell'utente.
   * @returns Un array di tag non assegnati.
   */
  getUnassignedTags(userId: string): Observable<ApiResponse<NfcTag[]>> {
    return this.http.get<ApiResponse<NfcTag[]>>(`${this.apiUrl}/user/${userId}/unassigned-tags`);
  }

  /**
   * Associa un tag specifico a un profilo medico specifico.
   * @param tagId L'ID del tag da associare.
   * @param profileId L'ID del profilo a cui associarlo.
   * @returns Il tag aggiornato.
   */
  assignTagToProfile(tagId: string, profileId: string): Observable<ApiResponse<NfcTag>> {
    return this.http.patch<ApiResponse<NfcTag>>(`${this.apiUrl}/tags/${tagId}/assign-profile`, { profileId });
  }

  // ======================================================
  // --- SEZIONE UTILITY ---
  // ======================================================

  /**
   * Ottiene il nome di una località (città/paese) a partire da coordinate.
   * @param lat Latitudine.
   * @param lon Longitudine.
   * @returns Il nome della località.
   */
  getLocationInfo(lat: number, lon: number): Observable<ApiResponse<{ location: string }>> {
    return this.http.get<ApiResponse<{ location: string }>>(`${this.apiUrl}/location-info?lat=${lat}&lon=${lon}`);
  }
}