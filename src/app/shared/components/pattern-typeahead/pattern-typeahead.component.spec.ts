import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatternTypeaheadComponent } from './pattern-typeahead.component';

describe('PatternTypeaheadComponent', () => {
  let component: PatternTypeaheadComponent;
  let fixture: ComponentFixture<PatternTypeaheadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatternTypeaheadComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PatternTypeaheadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
