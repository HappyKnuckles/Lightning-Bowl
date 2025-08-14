import { ConditionalNumberPipe } from './conditional-number.pipe';

describe('ConditionalNumberPipe', () => {
  let pipe: ConditionalNumberPipe;

  beforeEach(() => {
    pipe = new ConditionalNumberPipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  describe('transform', () => {
    it('should return integer as string without decimal places', () => {
      expect(pipe.transform(5)).toBe('5');
      expect(pipe.transform(0)).toBe('0');
      expect(pipe.transform(100)).toBe('100');
    });

    it('should return decimal number with 2 decimal places', () => {
      expect(pipe.transform(5.5)).toBe('5.50');
      expect(pipe.transform(3.14159)).toBe('3.14');
      expect(pipe.transform(0.1)).toBe('0.10');
    });

    it('should handle negative numbers', () => {
      expect(pipe.transform(-5)).toBe('-5');
      expect(pipe.transform(-3.14)).toBe('-3.14');
    });

    it('should handle very small decimal numbers', () => {
      expect(pipe.transform(0.001)).toBe('0.00');
      expect(pipe.transform(0.999)).toBe('1.00');
    });

    it('should handle numbers with exactly 2 decimal places', () => {
      expect(pipe.transform(5.25)).toBe('5.25');
      expect(pipe.transform(10.50)).toBe('10.50');
    });

    it('should handle floating point precision edge cases', () => {
      expect(pipe.transform(0.1 + 0.2)).toBe('0.30'); // 0.1 + 0.2 = 0.30000000000000004
    });
  });
});
