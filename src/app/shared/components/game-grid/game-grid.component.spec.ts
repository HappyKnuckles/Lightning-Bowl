import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { GameGridComponent } from './game-grid.component';
import { StorageService } from 'src/app/core/services/storage/storage.service';
import { of } from 'rxjs';

const mockStorageService = {
  getItem: jasmine.createSpy('getItem').and.returnValue(Promise.resolve(null)),
  setItem: jasmine.createSpy('setItem').and.returnValue(Promise.resolve()),
  loadLeagues: jasmine.createSpy('loadLeagues').and.returnValue(Promise.resolve([])),
  loadGameHistory: jasmine.createSpy('loadGameHistory').and.returnValue(Promise.resolve([])),
  newGameAdded: of(null),
  gameDeleted: of(null),
  gameEditLeague: of(null),
  newLeagueAdded: of(null),
  leagueDeleted: of(null),
  leagueChanged: of(null),
  allPatterns: jasmine.createSpy('allPatterns').and.returnValue([
    { url: 'pattern-1-url', title: 'Test Pattern 1', category: 'Test Category 1' },
    { url: 'pattern-2-url', title: 'Test Pattern 2', category: 'Test Category 2' }
  ])
};
describe('TrackGridComponent', () => {
  let component: GameGridComponent;
  let fixture: ComponentFixture<GameGridComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [GameGridComponent],
      providers: [{ provide: StorageService, useValue: mockStorageService }],
    }).compileComponents();

    fixture = TestBed.createComponent(GameGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return "None" when no patterns are selected', () => {
    component.game().patterns = [];
    const result = component.getPatternDisplayNames();
    expect(result).toBe('None');
  });

  it('should return pattern titles when patterns are selected', () => {
    component.game().patterns = ['pattern-1-url', 'pattern-2-url'];
    const result = component.getPatternDisplayNames();
    expect(result).toBe('Test Pattern 1, Test Pattern 2');
  });

  it('should handle unknown pattern URLs gracefully', () => {
    component.game().patterns = ['unknown-url'];
    const result = component.getPatternDisplayNames();
    expect(result).toBe('unknown-url');
  });
});
