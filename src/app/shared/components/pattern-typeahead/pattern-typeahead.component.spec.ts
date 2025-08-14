import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PatternTypeaheadComponent } from './pattern-typeahead.component';
import { ChartGenerationService } from '../../../core/services/chart/chart-generation.service';
import { PatternService } from '../../../core/services/pattern/pattern.service';
import { LoadingService } from '../../../core/services/loader/loading.service';
import { DomSanitizer } from '@angular/platform-browser';
import { ModalController } from '@ionic/angular';
import { Pattern } from '../../../core/models/pattern.model';
import { signal } from '@angular/core';

describe('PatternTypeaheadComponent', () => {
  let component: PatternTypeaheadComponent;
  let fixture: ComponentFixture<PatternTypeaheadComponent>;
  let chartService: jasmine.SpyObj<ChartGenerationService>;
  let patternService: jasmine.SpyObj<PatternService>;
  let loadingService: jasmine.SpyObj<LoadingService>;
  let sanitizer: jasmine.SpyObj<DomSanitizer>;
  let modalCtrl: jasmine.SpyObj<ModalController>;

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

  beforeEach(async () => {
    const chartServiceSpy = jasmine.createSpyObj('ChartGenerationService', ['generatePatternPreviewDataUri', 'generatePatternChartDataUri']);
    const patternServiceSpy = jasmine.createSpyObj('PatternService', ['searchPattern']);
    const loadingServiceSpy = jasmine.createSpyObj('LoadingService', ['setLoading']);
    const sanitizerSpy = jasmine.createSpyObj('DomSanitizer', ['bypassSecurityTrustUrl']);
    const modalCtrlSpy = jasmine.createSpyObj('ModalController', ['dismiss']);

    await TestBed.configureTestingModule({
      imports: [PatternTypeaheadComponent],
      providers: [
        { provide: ChartGenerationService, useValue: chartServiceSpy },
        { provide: PatternService, useValue: patternServiceSpy },
        { provide: LoadingService, useValue: loadingServiceSpy },
        { provide: DomSanitizer, useValue: sanitizerSpy },
        { provide: ModalController, useValue: modalCtrlSpy }
      ]
    }).compileComponents();

    chartService = TestBed.inject(ChartGenerationService) as jasmine.SpyObj<ChartGenerationService>;
    patternService = TestBed.inject(PatternService) as jasmine.SpyObj<PatternService>;
    loadingService = TestBed.inject(LoadingService) as jasmine.SpyObj<LoadingService>;
    sanitizer = TestBed.inject(DomSanitizer) as jasmine.SpyObj<DomSanitizer>;
    modalCtrl = TestBed.inject(ModalController) as jasmine.SpyObj<ModalController>;

    fixture = TestBed.createComponent(PatternTypeaheadComponent);
    component = fixture.componentInstance;
    
    // Set up input signals properly
    fixture.componentRef.setInput('patterns', [mockPattern]);
    fixture.componentRef.setInput('prevSelectedPatterns', []);
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should generate chart images on initialization', () => {
    chartService.generatePatternPreviewDataUri.and.returnValue('data:image/svg+xml;base64,test');
    chartService.generatePatternChartDataUri.and.returnValue('data:image/svg+xml;base64,test-horizontal');
    sanitizer.bypassSecurityTrustUrl.and.returnValue('safe-url' as any);

    component.ngOnInit();

    expect(chartService.generatePatternPreviewDataUri).toHaveBeenCalledWith(mockPattern, 60, true, false);
    expect(sanitizer.bypassSecurityTrustUrl).toHaveBeenCalled();
  });

  it('should handle pattern selection correctly', () => {
    const event = { detail: { checked: true } } as CustomEvent;
    const patternTitle = 'Test Pattern';

    component.checkboxChange(event, patternTitle);

    expect(component.selectedPatterns).toContain(patternTitle);
  });
});
