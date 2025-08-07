// in src/app/core/services/notification.spec.ts

import { TestBed } from '@angular/core/testing';

// --- ECCO LA CORREZIONE ---
// Il percorso ora punta al file corretto: 'notification.service'
import { NotificationService } from './notification';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});