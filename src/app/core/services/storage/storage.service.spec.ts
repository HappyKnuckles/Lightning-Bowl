import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';
import { Storage } from '@ionic/storage-angular';
import { SortUtilsService } from '../sort-utils/sort-utils.service';

const mockStorage = {
  create: jasmine.createSpy('create').and.returnValue(Promise.resolve()),
  get: jasmine.createSpy('get').and.returnValue(Promise.resolve(null)),
  set: jasmine.createSpy('set').and.returnValue(Promise.resolve()),
  remove: jasmine.createSpy('remove').and.returnValue(Promise.resolve()),
};

const mockSortUtilsService = {
  sortItems: jasmine.createSpy('sortItems'),
};

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        { provide: Storage, useValue: mockStorage },
        { provide: SortUtilsService, useValue: mockSortUtilsService },
      ],
    }).compileComponents();

    service = TestBed.inject(StorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call storage.create on initialization', async () => {
    expect(mockStorage.create).toHaveBeenCalled();
  });
});
