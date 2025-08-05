import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogoGif } from './logo-gif';

describe('LogoGif', () => {
  let component: LogoGif;
  let fixture: ComponentFixture<LogoGif>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogoGif]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LogoGif);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
