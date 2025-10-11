/**
 * Debounce utility for performance optimization
 * Delays execution of a function until after a specified time has elapsed since the last invocation
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle utility for performance optimization
 * Ensures a function is called at most once per specified time period
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Batches multiple calls into a single execution
 * Useful for operations that can be performed more efficiently in batches
 */
export class BatchProcessor<T> {
  private queue: T[] = [];
  private timeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private processBatch: (items: T[]) => void,
    private delay = 100
  ) {}

  add(item: T): void {
    this.queue.push(item);

    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.timeout = setTimeout(() => {
      if (this.queue.length > 0) {
        this.processBatch([...this.queue]);
        this.queue = [];
      }
      this.timeout = null;
    }, this.delay);
  }

  flush(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    if (this.queue.length > 0) {
      this.processBatch([...this.queue]);
      this.queue = [];
    }
  }
}
