import { DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { IonChip } from '@ionic/angular/standalone';
import { BaseFilterService } from 'src/app/core/services/base-filter/base-filter.service';
import { UtilsService } from 'src/app/core/services/utils/utils.service';
import { BaseFilterActiveComponent } from '../base-filter-active/base-filter-active.component';

export interface FilterDisplayConfig {
  key: string;
  label: string;
  type: 'boolean' | 'string' | 'array' | 'range' | 'date-range';
  trueBooleanText?: string;
  falseBooleanText?: string;
  rangeSeparator?: string;
  unit?: string;
}

@Component({
  selector: 'app-generic-filter-active',
  standalone: true,
  imports: [IonChip, NgIf, NgFor, DatePipe],
  template: `
    <div class="filter-info">
      <ion-chip *ngFor="let config of filterConfigs" 
               *ngIf="shouldShowFilter(config)">
        {{ getDisplayText(config) }}
      </ion-chip>
    </div>
  `,
  styleUrls: ['./generic-filter-active.component.scss'],
})
export class GenericFilterActiveComponent<T extends object> extends BaseFilterActiveComponent<T> implements OnInit {
  @Input() filterConfigs: FilterDisplayConfig[] = [];
  @Input() filterService!: BaseFilterService<T, any>;
  @Input() utilsService?: UtilsService;

  constructor() {
    super(null as any, undefined);
  }

  ngOnInit() {
    // Override the parent's service references with the input ones
    (this as any).filterService = this.filterService;
    (this as any).utilsService = this.utilsService;
  }

  shouldShowFilter(config: FilterDisplayConfig): boolean {
    if (config.type === 'range') {
      const minKey = config.key.replace('max', 'min').replace('Max', 'Min');
      const maxKey = config.key.replace('min', 'max').replace('Min', 'Max');
      return this.isFilterActive(minKey as keyof T) || this.isFilterActive(maxKey as keyof T);
    }
    
    if (config.type === 'date-range') {
      return this.isFilterActive('timeRange' as keyof T) || 
             this.isFilterActive('startDate' as keyof T) || 
             this.isFilterActive('endDate' as keyof T);
    }

    if (config.type === 'array') {
      const value = this.getFilterValue(config.key as keyof T);
      return this.isFilterActive(config.key as keyof T) && Array.isArray(value) && value.length > 0;
    }

    return this.isFilterActive(config.key as keyof T);
  }

  getDisplayText(config: FilterDisplayConfig): string {
    const value = this.getFilterValue(config.key as keyof T);

    switch (config.type) {
      case 'boolean':
        if (config.key === 'weight') {
          // Special case for weight - always show the value
          return `${config.label}: ${value}${config.unit || ''}`;
        }
        return value 
          ? (config.trueBooleanText || config.label)
          : (config.falseBooleanText || `Not ${config.label}`);

      case 'string':
        return `${config.label}: ${value}${config.unit || ''}`;

      case 'array':
        const arrayValue = Array.isArray(value) ? value : [];
        if (config.key === 'leagues' && (!arrayValue || arrayValue.length === 0 || arrayValue[0] === '')) {
          return 'No Leagues';
        }
        return `${config.label}: ${arrayValue.join(', ')}`;

      case 'range':
        const minKey = config.key.replace('max', 'min').replace('Max', 'Min');
        const maxKey = config.key.replace('min', 'max').replace('Min', 'Max');
        const minValue = this.getFilterValue(minKey as keyof T);
        const maxValue = this.getFilterValue(maxKey as keyof T);
        const separator = config.rangeSeparator || ' - ';
        return `${config.label}: ${minValue}${separator}${maxValue}${config.unit || ''}`;

      case 'date-range':
        const startDate = this.getFilterValue('startDate' as keyof T);
        const endDate = this.getFilterValue('endDate' as keyof T);
        return `${config.label}: ${new DatePipe('en-US').transform(startDate, 'mediumDate')} - ${new DatePipe('en-US').transform(endDate, 'mediumDate')}`;

      default:
        return `${config.label}: ${value}${config.unit || ''}`;
    }
  }

  override isFilterActive(key: keyof T): boolean {
    if (key === 'weight' && this.filterConfigs.some(c => c.key === 'weight')) {
      return true; // Weight filter is always considered active for ball filters
    }
    return super.isFilterActive(key);
  }
}