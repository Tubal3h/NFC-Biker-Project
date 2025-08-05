import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MedicalForm } from './medical-form';

describe('MedicalForm', () => {
  let component: MedicalForm;
  let fixture: ComponentFixture<MedicalForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MedicalForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MedicalForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
