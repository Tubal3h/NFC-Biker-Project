import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileManagement } from './profile-management';

describe('ProfileManagement', () => {
  let component: ProfileManagement;
  let fixture: ComponentFixture<ProfileManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
