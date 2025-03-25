import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { BallComboBoxComponent } from './ball-combo-box.component';

describe('BallComboBoxComponent', () => {
  let component: BallComboBoxComponent;
  let fixture: ComponentFixture<BallComboBoxComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [BallComboBoxComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BallComboBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
