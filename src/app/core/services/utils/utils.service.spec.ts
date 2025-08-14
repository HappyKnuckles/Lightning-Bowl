import { TestBed } from '@angular/core/testing';

import { UtilsService } from './utils.service';

describe('UtilsService', () => {
  let service: UtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UtilsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('transformDate', () => {
    it('should transform date to YYYY-MM-DD format', () => {
      const date = new Date(2023, 0, 15); // January 15, 2023
      const result = service.transformDate(date);
      expect(result).toBe('2023-01-15');
    });

    it('should pad single digit months and days with zero', () => {
      const date = new Date(2023, 8, 5); // September 5, 2023 (month is 0-indexed)
      const result = service.transformDate(date);
      expect(result).toBe('2023-09-05');
    });

    it('should handle leap year dates', () => {
      const date = new Date(2024, 1, 29); // February 29, 2024
      const result = service.transformDate(date);
      expect(result).toBe('2024-02-29');
    });
  });

  describe('areDatesEqual', () => {
    it('should return true for same dates', () => {
      const date1 = '2023-01-15T10:30:00Z';
      const date2 = '2023-01-15T14:45:30Z';
      expect(service.areDatesEqual(date1, date2)).toBe(true);
    });

    it('should return false for different dates', () => {
      const date1 = '2023-01-15T10:30:00Z';
      const date2 = '2023-01-16T10:30:00Z';
      expect(service.areDatesEqual(date1, date2)).toBe(false);
    });

    it('should handle dates without time component', () => {
      const date1 = '2023-01-15';
      const date2 = '2023-01-15';
      expect(service.areDatesEqual(date1, date2)).toBe(true);
    });

    it('should ignore time differences on same date', () => {
      const date1 = '2023-01-15T00:00:00Z';
      const date2 = '2023-01-15T23:59:59Z';
      expect(service.areDatesEqual(date1, date2)).toBe(true);
    });
  });

  describe('isSameDay', () => {
    it('should return true for same day timestamps', () => {
      const date1 = new Date(2023, 0, 15, 10, 30).getTime();
      const date2 = new Date(2023, 0, 15, 14, 45).getTime();
      expect(service.isSameDay(date1, date2)).toBe(true);
    });

    it('should return false for different days', () => {
      const date1 = new Date(2023, 0, 15).getTime();
      const date2 = new Date(2023, 0, 16).getTime();
      expect(service.isSameDay(date1, date2)).toBe(false);
    });

    it('should return false for same day different month', () => {
      const date1 = new Date(2023, 0, 15).getTime(); // January 15
      const date2 = new Date(2023, 1, 15).getTime(); // February 15
      expect(service.isSameDay(date1, date2)).toBe(false);
    });

    it('should return false for same day different year', () => {
      const date1 = new Date(2023, 0, 15).getTime();
      const date2 = new Date(2024, 0, 15).getTime();
      expect(service.isSameDay(date1, date2)).toBe(false);
    });

    it('should ignore time differences on same date', () => {
      const date1 = new Date(2023, 0, 15, 0, 0, 0).getTime();
      const date2 = new Date(2023, 0, 15, 23, 59, 59).getTime();
      expect(service.isSameDay(date1, date2)).toBe(true);
    });
  });

  describe('isDayBefore', () => {
    it('should return true when first date is before second date', () => {
      const date1 = new Date(2023, 0, 14).getTime(); // January 14
      const date2 = new Date(2023, 0, 15).getTime(); // January 15
      expect(service.isDayBefore(date1, date2)).toBe(true);
    });

    it('should return false when first date is after second date', () => {
      const date1 = new Date(2023, 0, 16).getTime();
      const date2 = new Date(2023, 0, 15).getTime();
      expect(service.isDayBefore(date1, date2)).toBe(false);
    });

    it('should return false when dates are the same day', () => {
      const date1 = new Date(2023, 0, 15).getTime();
      const date2 = new Date(2023, 0, 15).getTime();
      expect(service.isDayBefore(date1, date2)).toBe(false);
    });

    it('should return true when first year is before second year', () => {
      const date1 = new Date(2022, 11, 31).getTime(); // Dec 31, 2022
      const date2 = new Date(2023, 0, 1).getTime();   // Jan 1, 2023
      expect(service.isDayBefore(date1, date2)).toBe(true);
    });

    it('should return true when first month is before second month in same year', () => {
      const date1 = new Date(2023, 0, 31).getTime(); // Jan 31, 2023
      const date2 = new Date(2023, 1, 1).getTime();  // Feb 1, 2023
      expect(service.isDayBefore(date1, date2)).toBe(true);
    });

    it('should return false when year is greater', () => {
      const date1 = new Date(2024, 0, 1).getTime();
      const date2 = new Date(2023, 11, 31).getTime();
      expect(service.isDayBefore(date1, date2)).toBe(false);
    });

    it('should return false when month is greater in same year', () => {
      const date1 = new Date(2023, 1, 1).getTime(); // Feb
      const date2 = new Date(2023, 0, 31).getTime(); // Jan
      expect(service.isDayBefore(date1, date2)).toBe(false);
    });
  });

  describe('areArraysEqual', () => {
    it('should return true for identical arrays', () => {
      const arr1 = [1, 2, 3];
      const arr2 = [1, 2, 3];
      expect(service.areArraysEqual(arr1, arr2)).toBe(true);
    });

    it('should return true for arrays with same elements in different order', () => {
      const arr1 = [3, 1, 2];
      const arr2 = [1, 2, 3];
      expect(service.areArraysEqual(arr1, arr2)).toBe(true);
    });

    it('should return false for arrays with different lengths', () => {
      const arr1 = [1, 2];
      const arr2 = [1, 2, 3];
      expect(service.areArraysEqual(arr1, arr2)).toBe(false);
    });

    it('should return false for arrays with different elements', () => {
      const arr1 = [1, 2, 3];
      const arr2 = [1, 2, 4];
      expect(service.areArraysEqual(arr1, arr2)).toBe(false);
    });

    it('should handle empty arrays', () => {
      const arr1: unknown[] = [];
      const arr2: unknown[] = [];
      expect(service.areArraysEqual(arr1, arr2)).toBe(true);
    });

    it('should handle string arrays', () => {
      const arr1 = ['apple', 'banana', 'cherry'];
      const arr2 = ['banana', 'cherry', 'apple'];
      expect(service.areArraysEqual(arr1, arr2)).toBe(true);
    });

    it('should handle mixed type arrays', () => {
      const arr1 = [1, 'two', 3];
      const arr2 = ['two', 1, 3];
      expect(service.areArraysEqual(arr1, arr2)).toBe(true);
    });

    it('should return false for one empty and one non-empty array', () => {
      const arr1: unknown[] = [];
      const arr2 = [1];
      expect(service.areArraysEqual(arr1, arr2)).toBe(false);
    });
  });
});
