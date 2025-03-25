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
});
