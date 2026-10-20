import { TestBed } from '@angular/core/testing';

import { BallFilterService } from './ball-filter.service';

describe('BallFilterService', () => {
  let service: BallFilterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BallFilterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('starts with the full default filters when nothing is saved', () => {
    // Guards against field reordering: `filters` must not be built before the defaults exist.
    localStorage.removeItem('ball-filter');
    TestBed.resetTestingModule();
    const fresh = TestBed.inject(BallFilterService);

    expect(fresh.filters()).toEqual(fresh.defaultFilters);
    expect(fresh.filters().brands).toEqual([]);
    expect(fresh.activeFilterCount()).toBe(0);
  });
});
