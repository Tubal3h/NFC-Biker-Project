import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Scheda } from './scheda';

describe('Scheda', () => {
  let component: Scheda;
  let fixture: ComponentFixture<Scheda>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Scheda]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Scheda);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
