// in src/app/core/models/medical-data.model.ts
import { EmergencyContact } from "./emergency-contact.model";

export interface MedicalProfile {
  id?: string;
  ownerId?: string;
  profileName?: string;
  
  // NUOVI CAMPI ANAGRAFICI
  name: string;
  surname: string;
  birthDate: string | null; // Usiamo string per compatibilità con l'input di tipo 'date'
  birthPlace: string;
  residence: string;

  bloodType: string | null;
  allergies: string;
  conditions: string;
  notes: string;
  emergencyContacts: EmergencyContact[];
  isActive?: boolean;
}

export type MedicalData = MedicalProfile;