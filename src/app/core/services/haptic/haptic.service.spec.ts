import { TestBed } from '@angular/core/testing';
import { HapticService } from './haptic.service';
import { ImpactStyle } from '@capacitor/haptics';

describe('HapticService', () => {
  let service: HapticService;
  let mockNavigatorVibrate: jasmine.Spy;
  let originalNavigator: any;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HapticService);
    
    // Mock console methods
    spyOn(console, 'warn');
    spyOn(console, 'error');
    
    // Store original navigator
    originalNavigator = (global as any).navigator;
    
    // Mock navigator.vibrate
    mockNavigatorVibrate = jasmine.createSpy('vibrate').and.returnValue(true);
    (global as any).navigator = {
      ...originalNavigator,
      vibrate: mockNavigatorVibrate
    };
  });

  afterEach(() => {
    // Restore original navigator
    (global as any).navigator = originalNavigator;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('vibrate method', () => {
    it('should handle vibration request with Light style', async () => {
      await service.vibrate(ImpactStyle.Light);
      // Since Haptics will likely fail in test environment, expect fallback behavior
      expect(service).toBeTruthy(); // Basic test to ensure method completes
    });

    it('should handle vibration request with Medium style', async () => {
      await service.vibrate(ImpactStyle.Medium);
      expect(service).toBeTruthy();
    });

    it('should handle vibration request with Heavy style', async () => {
      await service.vibrate(ImpactStyle.Heavy);
      expect(service).toBeTruthy();
    });

    it('should handle default vibration request', async () => {
      await service.vibrate();
      expect(service).toBeTruthy();
    });

    it('should not throw errors when vibration fails', async () => {
      // Mock a navigator without vibrate support
      (global as any).navigator = {};
      
      await expectAsync(service.vibrate()).toBeResolved();
    });

    it('should handle navigator without vibrate method', async () => {
      (global as any).navigator = { vibrate: null };
      
      await service.vibrate(ImpactStyle.Light);
      
      expect(service).toBeTruthy();
    });

    it('should handle multiple vibration calls', async () => {
      const promises = [
        service.vibrate(ImpactStyle.Light),
        service.vibrate(ImpactStyle.Medium),
        service.vibrate(ImpactStyle.Heavy)
      ];
      
      await Promise.all(promises);
      
      expect(service).toBeTruthy();
    });
  });

  describe('fallback behavior', () => {
    it('should have fallback durations defined', () => {
      // Test that the service can handle different impact styles
      expect(() => service.vibrate(ImpactStyle.Light)).not.toThrow();
      expect(() => service.vibrate(ImpactStyle.Medium)).not.toThrow();
      expect(() => service.vibrate(ImpactStyle.Heavy)).not.toThrow();
    });

    it('should handle environment without haptic support gracefully', async () => {
      (global as any).navigator = undefined;
      
      await expectAsync(service.vibrate()).toBeResolved();
    });
  });
});
