import { TestBed } from '@angular/core/testing';

import { LoadingService } from './loading.service';

describe('LoadingService', () => {
  let service: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoadingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isLoading signal', () => {
    it('should initialize with false', () => {
      expect(service.isLoading()).toBe(false);
    });

    it('should provide isLoading as a function', () => {
      expect(typeof service.isLoading).toBe('function');
    });
  });

  describe('setLoading', () => {
    it('should set loading state to true', () => {
      service.setLoading(true);
      expect(service.isLoading()).toBe(true);
    });

    it('should set loading state to false', () => {
      service.setLoading(false);
      expect(service.isLoading()).toBe(false);
    });

    it('should toggle loading state multiple times', () => {
      expect(service.isLoading()).toBe(false);

      service.setLoading(true);
      expect(service.isLoading()).toBe(true);

      service.setLoading(false);
      expect(service.isLoading()).toBe(false);

      service.setLoading(true);
      expect(service.isLoading()).toBe(true);
    });

    it('should handle setting same state multiple times', () => {
      service.setLoading(true);
      expect(service.isLoading()).toBe(true);

      service.setLoading(true);
      expect(service.isLoading()).toBe(true);

      service.setLoading(false);
      expect(service.isLoading()).toBe(false);

      service.setLoading(false);
      expect(service.isLoading()).toBe(false);
    });
  });

  describe('integration tests', () => {
    it('should maintain state throughout service lifecycle', () => {
      // Initial state
      expect(service.isLoading()).toBe(false);

      // Start loading
      service.setLoading(true);
      expect(service.isLoading()).toBe(true);

      // Simulate some async operation
      setTimeout(() => {
        expect(service.isLoading()).toBe(true);
      }, 0);

      // Stop loading
      service.setLoading(false);
      expect(service.isLoading()).toBe(false);
    });
  });
});
