import { TestBed } from '@angular/core/testing';

import { ImageProcesserService } from './image-processer.service';

describe('ImageProcesserService', () => {
  let service: ImageProcesserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImageProcesserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
