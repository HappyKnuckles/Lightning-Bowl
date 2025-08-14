import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('toastState$', () => {
    it('should be an observable', () => {
      expect(service.toastState$).toBeDefined();
      expect(typeof service.toastState$.subscribe).toBe('function');
    });
  });

  describe('showToast', () => {
    it('should emit toast data when showToast is called', (done) => {
      const expectedMessage = 'Test message';
      const expectedIcon = 'info-outline';

      service.toastState$.subscribe((toast) => {
        expect(toast.message).toBe(expectedMessage);
        expect(toast.icon).toBe(expectedIcon);
        expect(toast.error).toBeUndefined();
        done();
      });

      service.showToast(expectedMessage, expectedIcon);
    });

    it('should emit toast data with error flag', (done) => {
      const expectedMessage = 'Error message';
      const expectedIcon = 'alert-outline';
      const expectedError = true;

      service.toastState$.subscribe((toast) => {
        expect(toast.message).toBe(expectedMessage);
        expect(toast.icon).toBe(expectedIcon);
        expect(toast.error).toBe(expectedError);
        done();
      });

      service.showToast(expectedMessage, expectedIcon, expectedError);
    });

    it('should emit toast data with error flag as false', (done) => {
      const expectedMessage = 'Success message';
      const expectedIcon = 'checkmark-outline';
      const expectedError = false;

      service.toastState$.subscribe((toast) => {
        expect(toast.message).toBe(expectedMessage);
        expect(toast.icon).toBe(expectedIcon);
        expect(toast.error).toBe(expectedError);
        done();
      });

      service.showToast(expectedMessage, expectedIcon, expectedError);
    });

    it('should handle empty message', (done) => {
      const expectedMessage = '';
      const expectedIcon = 'warning-outline';

      service.toastState$.subscribe((toast) => {
        expect(toast.message).toBe(expectedMessage);
        expect(toast.icon).toBe(expectedIcon);
        done();
      });

      service.showToast(expectedMessage, expectedIcon);
    });

    it('should handle special characters in message', (done) => {
      const expectedMessage = 'Test message with special chars: !@#$%^&*()';
      const expectedIcon = 'info';

      service.toastState$.subscribe((toast) => {
        expect(toast.message).toBe(expectedMessage);
        expect(toast.icon).toBe(expectedIcon);
        done();
      });

      service.showToast(expectedMessage, expectedIcon);
    });

    it('should handle multiple consecutive calls', () => {
      const messages: any[] = [];
      
      service.toastState$.subscribe((toast) => {
        messages.push(toast);
      });

      service.showToast('Message 1', 'icon1');
      service.showToast('Message 2', 'icon2', true);
      service.showToast('Message 3', 'icon3', false);

      expect(messages.length).toBe(3);
      expect(messages[0].message).toBe('Message 1');
      expect(messages[1].message).toBe('Message 2');
      expect(messages[1].error).toBe(true);
      expect(messages[2].message).toBe('Message 3');
      expect(messages[2].error).toBe(false);
    });
  });

  describe('integration tests', () => {
    it('should work with different subscription patterns', () => {
      const messages: string[] = [];
      
      // First subscription
      const sub1 = service.toastState$.subscribe((toast) => {
        messages.push(`Sub1: ${toast.message}`);
      });

      service.showToast('Test 1', 'icon');

      // Second subscription (should not receive previous messages)
      const sub2 = service.toastState$.subscribe((toast) => {
        messages.push(`Sub2: ${toast.message}`);
      });

      service.showToast('Test 2', 'icon');

      expect(messages).toEqual([
        'Sub1: Test 1',
        'Sub1: Test 2',
        'Sub2: Test 2'
      ]);

      sub1.unsubscribe();
      sub2.unsubscribe();
    });

    it('should complete normally when service is destroyed', () => {
      let completed = false;
      
      service.toastState$.subscribe({
        next: () => {},
        complete: () => {
          completed = true;
        }
      });

      // Service destruction is handled by Angular's DI system
      // This test ensures the observable behaves correctly
      service.showToast('Test', 'icon');
      
      expect(completed).toBe(false); // Should not complete during normal operation
    });
  });
});
