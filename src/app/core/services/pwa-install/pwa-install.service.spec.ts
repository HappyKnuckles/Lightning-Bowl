import { TestBed } from '@angular/core/testing';
import { PwaInstallService } from './pwa-install.service';

describe('PwaInstallService', () => {
  let service: PwaInstallService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PwaInstallService);
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clear localStorage after each test
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should dismiss install prompt and store timestamp in localStorage', () => {
    const beforeDismiss = Date.now();
    
    service.dismissInstallPrompt();
    
    const storedTime = localStorage.getItem('pwa-install-dismissed');
    expect(storedTime).toBeTruthy();
    
    const dismissalTime = parseInt(storedTime!, 10);
    expect(dismissalTime).toBeGreaterThanOrEqual(beforeDismiss);
    expect(dismissalTime).toBeLessThanOrEqual(Date.now());
  });

  it('should return true when prompt was recently dismissed (within 24 hours)', () => {
    // Set a recent dismissal timestamp (1 hour ago)
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    localStorage.setItem('pwa-install-dismissed', oneHourAgo.toString());
    
    // Use reflection to access private method for testing
    const isRecentlyDismissed = (service as any).isRecentlyDismissed(5 * 60 * 1000); // 5 minutes
    const isDismissed = (service as any).isInstallPromptDismissed();
    
    expect(isDismissed).toBe(true);
    expect(isRecentlyDismissed).toBe(false); // More than 5 minutes ago
  });

  it('should return false when prompt was dismissed more than 24 hours ago', () => {
    // Set an old dismissal timestamp (25 hours ago)
    const twentyFiveHoursAgo = Date.now() - (25 * 60 * 60 * 1000);
    localStorage.setItem('pwa-install-dismissed', twentyFiveHoursAgo.toString());
    
    const isDismissed = (service as any).isInstallPromptDismissed();
    
    expect(isDismissed).toBe(false);
  });

  it('should return true for recent dismissal within specified time window', () => {
    // Set a recent dismissal timestamp (2 minutes ago)
    const twoMinutesAgo = Date.now() - (2 * 60 * 1000);
    localStorage.setItem('pwa-install-dismissed', twoMinutesAgo.toString());
    
    const isRecentlyDismissed = (service as any).isRecentlyDismissed(5 * 60 * 1000); // 5 minutes
    
    expect(isRecentlyDismissed).toBe(true);
  });

  it('should return false when no dismissal is stored', () => {
    const isDismissed = (service as any).isInstallPromptDismissed();
    const isRecentlyDismissed = (service as any).isRecentlyDismissed(5 * 60 * 1000);
    
    expect(isDismissed).toBe(false);
    expect(isRecentlyDismissed).toBe(false);
  });
});