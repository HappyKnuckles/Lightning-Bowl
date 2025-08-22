import { TestBed } from '@angular/core/testing';

import { PinStatsService } from './pin-stats.service';

describe('PinStatsService', () => {
  let service: PinStatsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PinStatsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
