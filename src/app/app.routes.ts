// in src/app/app.routes.ts

import { Routes } from '@angular/router';
import { authGuard } from '@app/core/guards/auth-guard';

// --- Importazione dei Componenti con la TUA nomenclatura e percorsi corretti ---

import { Homepage } from '@app/features/homepage/homepage';
import { Guide } from '@app/features/guide/guide';
import { Claim } from '@app/features/claim/claim';
import { Scheda } from '@app/features/scheda/scheda';
import { About } from './features/about/about';
import { Plans } from './features/plans/plans';

// Rotte di Autenticazione
import { AUTH_ROUTES } from '@app/features/auth/auth.routes';

// Componenti dell'Area Riservata
import { Dashboard } from '@app/features/dashboard/dashboard';
import { MedicalForm } from '@app/features/medical-form/medical-form';
import { AccountSettings } from '@app/features/account-settings/account-settings';
import { TagManagement } from './features/tag-management/tag-management';
import { ProfileManagement } from './features/profile-management/profile-management';


export const routes: Routes = [

  // --- ROTTE PUBBLICHE ---
  { path: 'homepage', component: Homepage },
  { path: 'guide', component: Guide },
  { path: 'claim/:nfcId', component: Claim },
  { path: 'claim', component: Claim },
  { path: 'scheda/:nfcId', component: Scheda },
  { path: 'about', component: About },
  { path: 'plans', component: Plans },
  

  // --- ROTTE DI AUTENTICAZIONE ---
  ...AUTH_ROUTES,
  
  // --- AREA RISERVATA (PROTETTA) ---
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'medical-form/:profileId', component: MedicalForm, canActivate: [authGuard] },
  { path: 'account-settings', component: AccountSettings, canActivate: [authGuard] },
  { path: 'tag-management', component: TagManagement, canActivate: [authGuard] },
  { path: 'profile-management', component: ProfileManagement, canActivate: [authGuard] },

  // --- REDIRECTS & FALLBACK ---
  { path: '', redirectTo: 'homepage', pathMatch: 'full' },
  { path: '**', redirectTo: 'homepage' }
];