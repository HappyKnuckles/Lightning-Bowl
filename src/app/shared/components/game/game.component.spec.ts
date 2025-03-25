import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { GameComponent } from './game.component';
import { StorageService } from 'src/app/core/services/storage/storage.service';
const mockStorageService = {
  getItem: jasmine.createSpy('getItem').and.returnValue(Promise.resolve(null)),
  setItem: jasmine.createSpy('setItem').and.returnValue(Promise.resolve()),
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
});
