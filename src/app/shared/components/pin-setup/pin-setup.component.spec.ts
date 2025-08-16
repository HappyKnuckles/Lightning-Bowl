import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PinSetupComponent } from './pin-setup.component';

describe('PinSetupComponent', () => {
  let component: PinSetupComponent;
  let fixture: ComponentFixture<PinSetupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PinSetupComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PinSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
