export interface NfcTag {
  id: string;
  nfcId: string;
  userId: string | null;
  createdAt: string;
  alias: string | null;
  profileId: string | null; // Questo è il nuovo riferimento al profilo medico
}