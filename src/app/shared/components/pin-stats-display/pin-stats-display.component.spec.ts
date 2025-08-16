import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PinStatsDisplayComponent } from './pin-stats-display.component';

describe('PinStatsDisplayComponent', () => {
  let component: PinStatsDisplayComponent;
  let fixture: ComponentFixture<PinStatsDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PinStatsDisplayComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PinStatsDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
