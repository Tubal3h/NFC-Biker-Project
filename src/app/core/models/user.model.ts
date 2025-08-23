// in src/app/core/models/user.model.ts

export interface AuthUser {
  id: string;
  email: string;
  premium: boolean;
  premiumExpiresAt?: Date | string | null;
  nfcTags: string[]; 
  // RIMOSSI: name, surname
}