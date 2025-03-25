import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeagueSelectorComponent } from './league-selector.component';
import { StorageService } from 'src/app/core/services/storage/storage.service';
const mockStorageService = {
  getItem: jasmine.createSpy('getItem').and.returnValue(Promise.resolve(null)),
  setItem: jasmine.createSpy('setItem').and.returnValue(Promise.resolve()),
};

describe('LeagueSelectorComponent', () => {
  let component: LeagueSelectorComponent;
  let fixture: ComponentFixture<LeagueSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeagueSelectorComponent],
      providers: [{ provide: StorageService, useValue: mockStorageService }],
    }).compileComponents();

    fixture = TestBed.createComponent(LeagueSelectorComponent);
    component = fixture.componentInstance;
    component.isAddPage = false;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
