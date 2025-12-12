import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PinLeaveStatsComponent } from './pin-leave-stats.component';

describe('PinLeaveStatsComponent', () => {
  let component: PinLeaveStatsComponent;
  let fixture: ComponentFixture<PinLeaveStatsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PinLeaveStatsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PinLeaveStatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
