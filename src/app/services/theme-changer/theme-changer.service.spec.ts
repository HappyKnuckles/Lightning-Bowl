import { TestBed } from '@angular/core/testing';

import { ThemeChangerService } from './theme-changer.service';

describe('ThemeChangerService', () => {
  let service: ThemeChangerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeChangerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
