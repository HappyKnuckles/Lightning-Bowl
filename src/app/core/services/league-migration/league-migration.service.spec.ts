import { TestBed } from '@angular/core/testing';

import { LeagueMigrationService } from './league-migration.service';

describe('LeagueMigrationService', () => {
  let service: LeagueMigrationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LeagueMigrationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});