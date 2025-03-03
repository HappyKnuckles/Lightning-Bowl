import { TestBed } from '@angular/core/testing';

import { BallService } from './ball.service';

describe('BallsimiliarService', () => {
  let service: BallService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BallService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
