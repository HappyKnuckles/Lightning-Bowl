import { TestBed } from '@angular/core/testing';
import { SortUtilsService } from './sort-utils.service';

describe('SortUtilsService', () => {
  let service: SortUtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SortUtilsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
