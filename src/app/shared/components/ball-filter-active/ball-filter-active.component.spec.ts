import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BallFilterActiveComponent } from './ball-filter-active.component';

describe('BallFilterActiveComponent', () => {
  let component: BallFilterActiveComponent;
  let fixture: ComponentFixture<BallFilterActiveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BallFilterActiveComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BallFilterActiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
