import { Routes } from '@angular/router';
import { Claim } from './pages/claim/claim';
import { Homepage } from './pages/homepage/homepage';
import { Guide } from './pages/guide/guide';
import { Profile } from './pages/profile/profile';
import { Scheda } from './pages/scheda/scheda';

export const routes: Routes = [
    { path: 'homepage', component: Homepage },
    { path: 'guide', component: Guide },
    { path: 'claim/:nfcId', component: Claim }, // <--- PRIMA questa!
    { path: 'claim', component: Claim },
    { path: 'profile', component: Profile },
    { path: 'scheda/:nfcId', component: Scheda},


    // ...altre rotte
    { path: '', redirectTo: 'claim', pathMatch: 'full' } // es. rotta di default temporanea
];
