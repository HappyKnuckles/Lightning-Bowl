import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { FilterService } from './filter-service.interface';

/**
 * Generic base component for filter modals
 */
@Component({
  selector: 'app-generic-filter',
  standalone: true,
  template: `<ng-content></ng-content>`,
})
export class GenericFilterComponent<TFilter extends Record<string, unknown>, TFilteredItem> {
  @Input() filterService!: FilterService<TFilter, TFilteredItem>;

  constructor(protected modalCtrl: ModalController) {}

  /**
   * Cancel filter changes and restore from storage
   */
  cancel(): Promise<boolean> {
    const storageKey = this.getStorageKey();
    const storedFilter = localStorage.getItem(storageKey);
    
    if (storedFilter) {
      this.filterService.filters.update(() => JSON.parse(storedFilter));
    } else {
      this.filterService.filters.update(() => ({ ...this.filterService.defaultFilters }));
    }
    
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  /**
   * Reset filters to default values
   */
  reset(): void {
    this.filterService.resetFilters();
  }

  /**
   * Confirm and save filter changes
   */
  confirm(): Promise<boolean> {
    this.filterService.saveFilters();
    return this.modalCtrl.dismiss('confirm');
  }

  /**
   * Update a specific filter value
   */
  updateFilter<T extends keyof TFilter>(key: T, value: unknown): void {
    this.filterService.filters.update((filters) => ({
      ...filters,
      [key]: value,
    }));
  }

  /**
   * Get the storage key for this filter type - to be overridden by subclasses
   */
  protected getStorageKey(): string {
    return 'generic-filter';
  }
}