import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { BallTypeaheadComponent } from './ball-typeahead.component';

describe('BallComboBoxComponent', () => {
  let component: BallTypeaheadComponent;
  let fixture: ComponentFixture<BallTypeaheadComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [BallTypeaheadComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BallTypeaheadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
