import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductsServices } from './products-services';

describe('ProductsServices', () => {
  let component: ProductsServices;
  let fixture: ComponentFixture<ProductsServices>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductsServices]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductsServices);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
