import { computed, Injectable, Signal, signal } from '@angular/core';
import { UtilsService } from '../utils/utils.service';

/**
 * Generic base filter service that can be extended by specific filter services
 * @template T - The filter type (e.g., BallFilter, GameFilter)
 * @template U - The item type to be filtered (e.g., Ball, Game)
 */
@Injectable()
export abstract class BaseFilterService<T extends object, U> {
  abstract defaultFilters: T;
  
  activeFilterCount: Signal<number> = computed(() => {
    return Object.keys(this.filters()).reduce((count, key) => {
      const filterValue = this.filters()[key as keyof T];
      const defaultValue = this.defaultFilters[key as keyof T];
      if (key === 'startDate' || key === 'endDate') {
        if (!this.utilsService.areDatesEqual(filterValue as string, defaultValue as string)) {
          return count + 1;
        }
      } else if (Array.isArray(filterValue) && Array.isArray(defaultValue)) {
        if (!this.utilsService.areArraysEqual(filterValue, defaultValue)) {
          return count + 1;
        }
      } else if (filterValue !== defaultValue) {
        return count + 1;
      }
      return count;
    }, 0);
  });

  protected _filters = signal<T>({} as T);
  get filters() {
    return this._filters;
  }

  protected _filteredItems = computed(() => {
    const items = this.getAllItems();
    const filters = this.filters();
    return this.filterItems(items, filters);
  });
  get filteredItems() {
    return this._filteredItems;
  }

  constructor(protected utilsService: UtilsService) {
    // Initialize filters after constructor runs and defaultFilters is set
    setTimeout(() => this._filters.set(this.loadInitialFilters()), 0);
  }

  abstract getAllItems(): U[];
  abstract filterItems(items: U[], filters: T): U[];
  abstract getStorageKey(): string;

  saveFilters(): void {
    localStorage.setItem(this.getStorageKey(), JSON.stringify(this.filters()));
  }

  resetFilters(): void {
    this.filters.update(() => ({ ...this.defaultFilters }));
  }

  protected loadInitialFilters(): T {
    const storedFilter = localStorage.getItem(this.getStorageKey());
    return storedFilter ? JSON.parse(storedFilter) : { ...this.defaultFilters };
  }
}