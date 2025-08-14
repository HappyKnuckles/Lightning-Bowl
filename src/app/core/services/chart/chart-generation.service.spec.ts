import { TestBed } from '@angular/core/testing';
import { ChartGenerationService } from './chart-generation.service';
import { Pattern } from '../../models/pattern.model';

describe('ChartService', () => {
  let service: ChartGenerationService;

  const mockPattern: Partial<Pattern> = {
    url: 'test-pattern',
    title: 'Test Pattern',
    category: 'Test Category',
    forwards_data: [{
      number: '1',
      start: '1L',
      stop: '5L',
      load: '1',
      mics: '1',
      speed: '1',
      buf: '1',
      tank: '1',
      total_oil: '10',
      distance_start: '0',
      distance_end: '20'
    }],
    reverse_data: []
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChartGenerationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should generate pattern preview data URI', () => {
    const result = service.generatePatternPreviewDataUri(mockPattern);
    
    expect(result).toBeTruthy();
    expect(result).toContain('data:image/svg+xml;base64,');
  });

  it('should generate preview with custom size', () => {
    const previewSize = 80;
    const result = service.generatePatternPreviewDataUri(mockPattern, previewSize);
    
    expect(result).toBeTruthy();
    expect(result).toContain('data:image/svg+xml;base64,');
  });

  it('should handle empty pattern data gracefully', () => {
    const emptyPattern: Partial<Pattern> = {
      forwards_data: [],
      reverse_data: []
    };
    
    const result = service.generatePatternPreviewDataUri(emptyPattern);
    expect(result).toBeTruthy();
    expect(result).toContain('data:image/svg+xml;base64,');
  });
});
