// in src/app/core/models/user.model.ts
import { MedicalData } from './medical-data.model';

/** Rappresenta l'utente completo come gestito dal backend e dall'AuthService. */
export interface AuthUser {
  id: string;
  name: string;
  surname: string;
  email: string;
  premium: boolean;
  nfcTags: string[];
  medicalData?: MedicalData; // I dati medici sono un oggetto annidato e opzionale
}