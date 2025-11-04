import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BallStatsComponent } from './ball-stats.component';

describe('BallStatsComponent', () => {
  let component: BallStatsComponent;
  let fixture: ComponentFixture<BallStatsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BallStatsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BallStatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
