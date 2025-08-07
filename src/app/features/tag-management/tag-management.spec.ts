import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TagManagement } from './tag-management';

describe('TagManagement', () => {
  let component: TagManagement;
  let fixture: ComponentFixture<TagManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TagManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TagManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
