// in src/app/core/services/api.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthUser, NfcTag, MedicalData, ApiResponse } from '@app/core/models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  // L'URL base ora punta alla radice delle tue API definite in server.js
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  // --- Funzioni di Autenticazione ---
  register(user: { email: string; password: string }): Observable<ApiResponse<AuthUser>> {
    return this.http.post<ApiResponse<AuthUser>>(`${this.apiUrl}/register`, user);
  }

  login(email: string, password: string): Observable<ApiResponse<AuthUser>> {
    return this.http.post<ApiResponse<AuthUser>>(`${this.apiUrl}/login`, { email, password });
  }

  // --- Funzioni per i Tag NFC ---
  claimNfc(nfcId: string, userId: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/claim`, { nfcId, userId });
  }
  
  getTag(nfcId: string): Observable<ApiResponse<NfcTag>> {
    return this.http.get<ApiResponse<NfcTag>>(`${this.apiUrl}/tag/${nfcId}`);
  }

  getUserTags(userId: string): Observable<ApiResponse<NfcTag[]>> {
    return this.http.get<ApiResponse<NfcTag[]>>(`${this.apiUrl}/user/${userId}/tags`);
  }

  // --- Funzioni per i Dati Medici (ORA CORRETTE) ---

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
    return this.http.put<ApiResponse<MedicalData>>(`${this.apiUrl}/user/${userId}/medical`, data);
  }
}