import { TestBed } from '@angular/core/testing';
import { ExcelService } from './excel.service';
import { HapticService } from '../haptic/haptic.service';
import { StorageService } from '../storage/storage.service';
import { ToastService } from '../toast/toast.service';

describe('ExcelService', () => {
  let service: ExcelService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ToastService,
          useValue: {
            showToast: jasmine.createSpy('showToast'),
          },
        },
        {
          provide: HapticService,
          useValue: {
            triggerHaptic: jasmine.createSpy('triggerHaptic'),
          },
        },
        {
          provide: StorageService,
          useValue: {
            get: jasmine.createSpy('get').and.returnValue(Promise.resolve(null)),
            set: jasmine.createSpy('set').and.returnValue(Promise.resolve()),
          },
        },
      ],
    });
    service = TestBed.inject(ExcelService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
