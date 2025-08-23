// in src/app/core/models/user.model.ts

export interface AuthUser {
  id: string;
  email: string;
  premium: boolean;
  mainProfileId?: string;
  premiumExpiresAt?: Date | string | null;
  nfcTags: string[]; 
  // RIMOSSI: name, surname
}