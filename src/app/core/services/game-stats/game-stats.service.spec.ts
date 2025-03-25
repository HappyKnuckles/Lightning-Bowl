import { TestBed } from '@angular/core/testing';

import { GameStatsService } from './game-stats.service';

describe('GameStatsService', () => {
  let service: GameStatsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameStatsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
