import { Signal, WritableSignal } from '@angular/core';

/**
 * Generic interface that all filter services should implement
 */
export interface FilterService<TFilter, TFilteredItem> {
  /**
   * Default filter values
   */
  defaultFilters: TFilter;

  /**
   * Signal containing current filter values - should be WritableSignal
   */
  readonly filters: WritableSignal<TFilter>;

  /**
   * Signal containing count of active (non-default) filters
   */
  readonly activeFilterCount: Signal<number>;

  /**
   * Save current filters to storage
   */
  saveFilters(): void;

  /**
   * Reset filters to default values
   */
  resetFilters(): void;
}