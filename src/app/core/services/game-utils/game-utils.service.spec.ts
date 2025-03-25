import { TestBed } from '@angular/core/testing';

import { GameUtilsService } from './game-utils.service';

describe('GameUtilsService', () => {
  let service: GameUtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameUtilsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
