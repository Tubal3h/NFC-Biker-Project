import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSms, faCamera, faGlobe, faRocket } from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

// Definiamo un'interfaccia per ogni elemento della roadmap per coerenza
interface RoadmapItem {
  status: 'In Sviluppo' | 'Pianificato';
  title: string;
  description: string;
  icon: IconDefinition;
}

@Component({
  selector: 'app-roadmap',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './roadmap.html',
  styleUrls: ['./roadmap.scss']
})
export class Roadmap {
  // Icone
  faRocket = faRocket;

  // Array con i dati della roadmap
  roadmapItems: RoadmapItem[] = [
    {
      status: 'In Sviluppo',
      title: 'Notifiche di Sicurezza Avanzate (SMS)',
      description: 'Stiamo implementando un sistema di allerta via SMS per gli utenti Premium. Includerà una notifica istantanea alla scansione del casco (con posizione) e un pulsante di allerta per i soccorritori, per avvisare immediatamente i contatti di emergenza.',
      icon: faSms
    },
    {
      status: 'Pianificato',
      title: 'Upload Foto per Veicolo e Casco',
      description: 'Per un\'identificazione inequivocabile, introdurremo l\'upload di immagini per aggiungere una foto del proprio veicolo al profilo medico e per assegnare un\'immagine personalizzata a ogni casco gestito.',
      icon: faCamera
    },
    {
      status: 'Pianificato',
      title: 'Supporto Multi-Lingua',
      description: 'La scheda medica pubblica tradurrà automaticamente le etichette dei campi nella lingua del soccorritore, rendendo le informazioni vitali immediatamente comprensibili in caso di incidenti all\'estero. Una funzione chiave per la sicurezza internazionale.',
      icon: faGlobe
    }
  ];
}