import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, NfcTag, MedicalData, ApiResponse } from '../models'; // Assicurati che il percorso sia corretto

@Injectable({ providedIn: 'root' })
export class ApiService {
  private apiUrl = 'http://localhost:3000/api'; // Cambia se metti il backend online

  constructor(private http: HttpClient) {}

  // Registrazione
  register(user: { email: string; password: string }): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.apiUrl}/register`, user);
  }

  // Login
  login(email: string, password: string): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.apiUrl}/login`, { email, password });
  }

  // Claim NFC
  claimNfc(nfcId: string, userId: string): Observable<ApiResponse<{ success: boolean }>> {
    return this.http.post<ApiResponse<{ success: boolean }>>(`${this.apiUrl}/claim`, { nfcId, userId });
  }

// Aggiorna dati sanitari
updateMedicalData(userId: string, data: MedicalData): Observable<ApiResponse<MedicalData>> {
  return this.http.put<ApiResponse<MedicalData>>(`${this.apiUrl}/user/${userId}/medical`, data);
}

// Recupera dati sanitari
getMedicalData(userId: string): Observable<ApiResponse<MedicalData>> {
  return this.http.get<ApiResponse<MedicalData>>(`${this.apiUrl}/user/${userId}/medical`);
}

  // Visualizza caschi associati
  getUserTags(userId: string): Observable<ApiResponse<NfcTag[]>> {
    return this.http.get<ApiResponse<NfcTag[]>>(`${this.apiUrl}/user/${userId}/tags`);
  }

  // Recupera info tag NFC
  getTag(nfcId: string): Observable<ApiResponse<NfcTag>> {
    return this.http.get<ApiResponse<NfcTag>>(`${this.apiUrl}/tag/${nfcId}`);
  }


  
}
