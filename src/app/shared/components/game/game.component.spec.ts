import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { GameComponent } from './game.component';
import { StorageService } from 'src/app/core/services/storage/storage.service';
const mockStorageService = {
  getItem: jasmine.createSpy('getItem').and.returnValue(Promise.resolve(null)),
  setItem: jasmine.createSpy('setItem').and.returnValue(Promise.resolve()),
  allPatterns: jasmine.createSpy('allPatterns').and.returnValue([
    { url: 'pattern-1-url', title: 'House Pattern', category: 'Standard' },
    { url: 'pattern-2-url', title: 'Sport Pattern', category: 'Challenge' }
  ])
};
describe('GameComponent', () => {
  let component: GameComponent;
  let fixture: ComponentFixture<GameComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [GameComponent],
      providers: [{ provide: StorageService, useValue: mockStorageService }],
    }).compileComponents();

    fixture = TestBed.createComponent(GameComponent);
    component = fixture.componentInstance;
    component.games = [];
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return "None" when no patterns are provided', () => {
    const result = component.getPatternDisplayNames([]);
    expect(result).toBe('None');
  });

  it('should return pattern titles when patterns are provided', () => {
    const result = component.getPatternDisplayNames(['pattern-1-url', 'pattern-2-url']);
    expect(result).toBe('House Pattern, Sport Pattern');
  });

  it('should handle unknown pattern URLs gracefully', () => {
    const result = component.getPatternDisplayNames(['unknown-pattern-url']);
    expect(result).toBe('unknown-pattern-url');
  });

  it('should handle mixed known and unknown pattern URLs', () => {
    const result = component.getPatternDisplayNames(['pattern-1-url', 'unknown-pattern-url']);
    expect(result).toBe('House Pattern, unknown-pattern-url');
  });
});
