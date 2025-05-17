import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatternFilterComponent } from './pattern-filter.component';

describe('PatternFilterComponent', () => {
  let component: PatternFilterComponent;
  let fixture: ComponentFixture<PatternFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatternFilterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PatternFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
