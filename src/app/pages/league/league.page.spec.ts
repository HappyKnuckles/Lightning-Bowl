import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LeaguePage } from './league.page';
import { StorageService } from 'src/app/core/services/storage/storage.service';
const mockStorageService = {
  getItem: jasmine.createSpy('getItem').and.returnValue(Promise.resolve(null)),
  setItem: jasmine.createSpy('setItem').and.returnValue(Promise.resolve()),
};
describe('LeaguePage', () => {
  let component: LeaguePage;
  let fixture: ComponentFixture<LeaguePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeaguePage],
      providers: [{ provide: StorageService, useValue: mockStorageService }],
    }).compileComponents();
    fixture = TestBed.createComponent(LeaguePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
