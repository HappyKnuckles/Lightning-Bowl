import { Injectable } from '@angular/core';

interface PerformanceMetric {
  name: string;
  startTime: number;
  duration?: number;
}

@Injectable({
  providedIn: 'root',
})
export class PerformanceMonitorService {
  private metrics = new Map<string, PerformanceMetric>();
  private readonly METRIC_RETENTION_TIME = 60000; // 1 minute
  private cleanupInterval: any;

  constructor() {
    // Periodic cleanup of old metrics
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldMetrics();
    }, 30000);
  }

  /**
   * Start measuring a performance metric
   */
  startMeasure(name: string): void {
    this.metrics.set(name, {
      name,
      startTime: performance.now(),
    });
  }

  /**
   * End measuring and return duration
   */
  endMeasure(name: string): number | null {
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`No metric found for: ${name}`);
      return null;
    }

    const duration = performance.now() - metric.startTime;
    metric.duration = duration;

    // Log slow operations (> 16ms blocks a frame at 60fps)
    if (duration > 16) {
      console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  /**
   * Measure an async operation
   */
  async measureAsync<T>(name: string, operation: () => Promise<T>): Promise<T> {
    this.startMeasure(name);
    try {
      const result = await operation();
      this.endMeasure(name);
      return result;
    } catch (error) {
      this.endMeasure(name);
      throw error;
    }
  }

  /**
   * Measure a synchronous operation
   */
  measureSync<T>(name: string, operation: () => T): T {
    this.startMeasure(name);
    try {
      const result = operation();
      this.endMeasure(name);
      return result;
    } catch (error) {
      this.endMeasure(name);
      throw error;
    }
  }

  /**
   * Schedule non-critical work during idle time
   */
  scheduleIdleTask(callback: () => void, timeout = 1000): void {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(callback, { timeout });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(callback, 0);
    }
  }

  /**
   * Get performance summary
   */
  getSummary(): { name: string; duration: number }[] {
    const summary: { name: string; duration: number }[] = [];
    this.metrics.forEach((metric) => {
      if (metric.duration !== undefined) {
        summary.push({ name: metric.name, duration: metric.duration });
      }
    });
    return summary.sort((a, b) => b.duration - a.duration);
  }

  private cleanupOldMetrics(): void {
    const now = performance.now();
    const keysToDelete: string[] = [];

    this.metrics.forEach((metric, key) => {
      if (metric.duration !== undefined && now - metric.startTime > this.METRIC_RETENTION_TIME) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.metrics.delete(key));
  }

  ngOnDestroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}
