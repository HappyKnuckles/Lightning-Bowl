import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BallCoverstockTypeaheadComponent } from './ball-coverstock-typeahead.component';

describe('BallCoverstockTypeaheadComponent', () => {
  let component: BallCoverstockTypeaheadComponent;
  let fixture: ComponentFixture<BallCoverstockTypeaheadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BallCoverstockTypeaheadComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BallCoverstockTypeaheadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
