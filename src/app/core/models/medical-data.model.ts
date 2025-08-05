import { EmergencyContact } from "./emergency-contact.model";

export interface MedicalData {
  bloodType: string;
  allergies: string;
  conditions: string;
  notes: string;
  emergencyContacts: EmergencyContact[];
}