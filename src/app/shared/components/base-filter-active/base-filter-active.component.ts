import { Component } from '@angular/core';
import { BaseFilterService } from 'src/app/core/services/base-filter/base-filter.service';
import { UtilsService } from 'src/app/core/services/utils/utils.service';

/**
 * Generic base filter active component that can be extended by specific filter active components
 * @template T - The filter type (e.g., BallFilter, GameFilter)
 */
@Component({
  template: '',
})
export abstract class BaseFilterActiveComponent<T extends object> {
  constructor(
    protected filterService: BaseFilterService<T, any>,
    protected utilsService?: UtilsService,
  ) {}

  isFilterActive(key: keyof T): boolean {
    const defaultFilter = this.filterService.defaultFilters;
    const activeFilters = this.filterService.filters();
    const filterValue = activeFilters[key];
    const defaultValue = defaultFilter[key];

    if (key === 'startDate' || key === 'endDate') {
      return this.utilsService ? !this.utilsService.areDatesEqual(filterValue as string, defaultValue as string) : filterValue !== defaultValue;
    } else if (Array.isArray(filterValue) && Array.isArray(defaultValue)) {
      return this.utilsService ? !this.utilsService.areArraysEqual(filterValue, defaultValue) : JSON.stringify(filterValue) !== JSON.stringify(defaultValue);
    } else {
      return filterValue !== defaultValue;
    }
  }

  getFilterValue(key: keyof T): any {
    return this.filterService.filters()[key];
  }
}