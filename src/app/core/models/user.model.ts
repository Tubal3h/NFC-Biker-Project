import { MedicalData } from './medical-data.model';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  premium: boolean;
  nfcTags: string[];
  medicalData: MedicalData;
}