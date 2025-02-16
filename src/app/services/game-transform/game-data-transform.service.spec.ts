import { TestBed } from '@angular/core/testing';

import { GameDataTransformerService } from './transform-game-data.service';

describe('TransformGameDataService', () => {
  let service: GameDataTransformerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameDataTransformerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
