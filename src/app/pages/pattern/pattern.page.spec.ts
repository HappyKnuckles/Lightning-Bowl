import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PatternPage } from './pattern.page';

describe('PatternPage', () => {
  let component: PatternPage;
  let fixture: ComponentFixture<PatternPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PatternPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
