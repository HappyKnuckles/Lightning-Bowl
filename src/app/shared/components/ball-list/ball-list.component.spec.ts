import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { BallListComponent } from './ball-list.component';

describe('BallListComponent', () => {
  let component: BallListComponent;
  let fixture: ComponentFixture<BallListComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [BallListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BallListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
