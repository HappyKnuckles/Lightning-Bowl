import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatternInfoComponent } from './pattern-info.component';
import { Pattern } from 'src/app/core/models/pattern.model';

describe('PatternInfoComponent', () => {
  let component: PatternInfoComponent;
  let fixture: ComponentFixture<PatternInfoComponent>;

  const mockPattern: Pattern = {
    url: 'test-pattern-url',
    title: 'Test Pattern Name',
    category: 'Sport',
    distance: '42',
    ratio: '3.5:1',
    volume: '25',
    forward: '12.5',
    reverse: '12.5',
    pump: '100',
    forwards_data: [],
    reverse_data: []
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatternInfoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PatternInfoComponent);
    component = fixture.componentInstance;
    
    // Set the required pattern input
    fixture.componentRef.setInput('pattern', mockPattern);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the pattern title, not the URL', () => {
    const compiled = fixture.nativeElement;
    
    // Check that the pattern title is displayed
    expect(compiled.textContent).toContain('Test Pattern Name');
    
    // Check that the pattern URL is not displayed as the main title
    expect(compiled.textContent).not.toContain('test-pattern-url');
  });

  it('should have correct pattern data', () => {
    expect(component.pattern()).toEqual(mockPattern);
    expect(component.pattern().title).toBe('Test Pattern Name');
    expect(component.pattern().url).toBe('test-pattern-url');
  });
});
