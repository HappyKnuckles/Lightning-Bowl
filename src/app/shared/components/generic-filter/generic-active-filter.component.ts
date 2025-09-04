import { Component, Input } from '@angular/core';
import { IonChip } from '@ionic/angular/standalone';
import { NgIf } from '@angular/common';
import { FilterService } from './filter-service.interface';
import { UtilsService } from 'src/app/core/services/utils/utils.service';

@Component({
  selector: 'app-generic-active-filter',
  standalone: true,
  imports: [IonChip, NgIf],
  template: `
    <div class="filter-info">
      <ng-content></ng-content>
    </div>
  `,
  styleUrl: './generic-active-filter.component.scss',
})
export class GenericActiveFilterComponent<TFilter extends Record<string, unknown>, TFilteredItem> {
  @Input() filterService!: FilterService<TFilter, TFilteredItem>;
  @Input() utilsService?: UtilsService;

  /**
   * Check if a specific filter is active (differs from default)
   */
  isFilterActive(key: keyof TFilter): boolean {
    if (!this.filterService) {
      return false;
    }

    const defaultFilter = this.filterService.defaultFilters;
    const activeFilters = this.filterService.filters();
    const filterValue = activeFilters[key];
    const defaultValue = defaultFilter[key];

    // Handle special weight case (from ball filter)
    if (key === 'weight' && typeof filterValue === 'string') {
      return filterValue !== defaultValue;
    }

    // Handle date comparisons if utils service is available
    if (this.utilsService && (key === 'startDate' || key === 'endDate')) {
      return !this.utilsService.areDatesEqual(filterValue as string, defaultValue as string);
    }

    // Handle array comparisons
    if (Array.isArray(filterValue) && Array.isArray(defaultValue)) {
      if (this.utilsService) {
        return !this.utilsService.areArraysEqual(filterValue, defaultValue);
      }
      // Fallback array comparison
      return JSON.stringify(filterValue) !== JSON.stringify(defaultValue);
    }

    // Default comparison
    return filterValue !== defaultValue;
  }

  /**
   * Get the value of a specific filter
   */
  getFilterValue(key: keyof TFilter): unknown {
    return this.filterService?.filters()[key];
  }
}