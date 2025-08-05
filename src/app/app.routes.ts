import { Routes } from '@angular/router';
import { Claim } from './features/claim/claim';
import { Homepage } from './features/homepage/homepage';
import { Guide } from './features/guide/guide';
import { Dashboard } from './features/dashboard/dashboard';
import { Scheda } from './features/scheda/scheda';
import { AUTH_ROUTES } from './features/auth/auth.routes';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';

export const routes: Routes = [
    
    { path: 'homepage', component: Homepage },
    { path: 'login', component: Login },
    { path: 'register', component: Register },
    { path: 'guide', component: Guide },
    { path: 'claim/:nfcId', component: Claim }, // <--- PRIMA questa!
    { path: 'claim', component: Claim },
    { path: 'dashboard', component: Dashboard },
    { path: 'scheda/:nfcId', component: Scheda},
    {
        path: 'register/:nfcId',
        component: Register // oppure loadComponent se standalone!
    },
    ...AUTH_ROUTES, // Includi le rotte di autenticazione


    // ...altre rotte
    { path: '', redirectTo: 'claim', pathMatch: 'full' } // es. rotta di default temporanea
];
