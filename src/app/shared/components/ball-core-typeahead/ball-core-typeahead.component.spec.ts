import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BallCoreTypeaheadComponent } from './ball-core-typeahead.component';

describe('BallCoreTypeaheadComponent', () => {
  let component: BallCoreTypeaheadComponent;
  let fixture: ComponentFixture<BallCoreTypeaheadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BallCoreTypeaheadComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BallCoreTypeaheadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
