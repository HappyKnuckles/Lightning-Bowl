import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { GameGridComponent } from './game-grid.component';
import { StorageService } from 'src/app/services/storage/storage.service';
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
});
