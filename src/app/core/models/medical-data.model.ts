// in src/app/core/models/medical-data.model.ts
import { EmergencyContact } from "./emergency-contact.model";

/** L'interfaccia per i dati medici, esattamente come sono salvati nell'utente. */
export interface MedicalData {
  bloodType: string | null;
  allergies: string;
  conditions: string;
  notes: string;
  emergencyContacts: EmergencyContact[];
}