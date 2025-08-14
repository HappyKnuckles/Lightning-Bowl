import { Injectable } from '@angular/core';
import { Ball } from '../models/ball.model';
import { Pattern } from '../models/pattern.model';
import { BallSortField, PatternSortField, SortDirection, BallSortOption, PatternSortOption } from '../models/sort.model';

@Injectable({
  providedIn: 'root',
})
export class SortService {
  // Default sort options for balls
  readonly BALL_SORT_OPTIONS: BallSortOption[] = [
    { field: BallSortField.BALL_NAME, direction: SortDirection.ASC, label: 'Name (A-Z)' },
    { field: BallSortField.BALL_NAME, direction: SortDirection.DESC, label: 'Name (Z-A)' },
    { field: BallSortField.BRAND_NAME, direction: SortDirection.ASC, label: 'Brand (A-Z)' },
    { field: BallSortField.BRAND_NAME, direction: SortDirection.DESC, label: 'Brand (Z-A)' },
    { field: BallSortField.RELEASE_DATE, direction: SortDirection.DESC, label: 'Newest First' },
    { field: BallSortField.RELEASE_DATE, direction: SortDirection.ASC, label: 'Oldest First' },
    { field: BallSortField.CORE_RG, direction: SortDirection.ASC, label: 'RG (Low to High)' },
    { field: BallSortField.CORE_RG, direction: SortDirection.DESC, label: 'RG (High to Low)' },
    { field: BallSortField.CORE_DIFF, direction: SortDirection.ASC, label: 'Diff (Low to High)' },
    { field: BallSortField.CORE_DIFF, direction: SortDirection.DESC, label: 'Diff (High to Low)' },
    { field: BallSortField.CORE_TYPE, direction: SortDirection.ASC, label: 'Core Type (A-Z)' },
    { field: BallSortField.COVERSTOCK_TYPE, direction: SortDirection.ASC, label: 'Coverstock (A-Z)' },
  ];

  // Default sort options for patterns
  readonly PATTERN_SORT_OPTIONS: PatternSortOption[] = [
    { field: PatternSortField.TITLE, direction: SortDirection.ASC, label: 'Title (A-Z)' },
    { field: PatternSortField.TITLE, direction: SortDirection.DESC, label: 'Title (Z-A)' },
    { field: PatternSortField.CATEGORY, direction: SortDirection.ASC, label: 'Category (A-Z)' },
    { field: PatternSortField.DISTANCE, direction: SortDirection.ASC, label: 'Distance (Low to High)' },
    { field: PatternSortField.DISTANCE, direction: SortDirection.DESC, label: 'Distance (High to Low)' },
    { field: PatternSortField.RATIO, direction: SortDirection.ASC, label: 'Ratio (Low to High)' },
    { field: PatternSortField.RATIO, direction: SortDirection.DESC, label: 'Ratio (High to Low)' },
    { field: PatternSortField.VOLUME, direction: SortDirection.ASC, label: 'Volume (Low to High)' },
    { field: PatternSortField.VOLUME, direction: SortDirection.DESC, label: 'Volume (High to Low)' },
  ];

  sortBalls(balls: Ball[], sortOption: BallSortOption): Ball[] {
    return [...balls].sort((a, b) => {
      const { field, direction } = sortOption;
      let aValue = a[field];
      let bValue = b[field];

      // Handle numeric fields
      if (field === BallSortField.CORE_RG || field === BallSortField.CORE_DIFF || field === BallSortField.CORE_INT_DIFF) {
        aValue = parseFloat(aValue as string) || 0;
        bValue = parseFloat(bValue as string) || 0;
      }

      // Handle date fields
      if (field === BallSortField.RELEASE_DATE) {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      }

      // Handle string fields
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      let comparison = 0;
      if (aValue < bValue) {
        comparison = -1;
      } else if (aValue > bValue) {
        comparison = 1;
      }

      return direction === SortDirection.DESC ? -comparison : comparison;
    });
  }

  sortPatterns(patterns: Pattern[], sortOption: PatternSortOption): Pattern[] {
    return [...patterns].sort((a, b) => {
      const { field, direction } = sortOption;
      let aValue = a[field];
      let bValue = b[field];

      // Handle numeric fields
      if (field === PatternSortField.DISTANCE || field === PatternSortField.VOLUME || 
          field === PatternSortField.FORWARD || field === PatternSortField.REVERSE ||
          field === PatternSortField.PUMP) {
        aValue = parseFloat(aValue as string) || 0;
        bValue = parseFloat(bValue as string) || 0;
      }

      // Handle ratio field (extract numeric value from "X:Y" format)
      if (field === PatternSortField.RATIO && aValue && bValue) {
        const aRatio = this.extractRatioValue(aValue as string);
        const bRatio = this.extractRatioValue(bValue as string);
        aValue = aRatio;
        bValue = bRatio;
      }

      // Handle string fields
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      let comparison = 0;
      if (aValue < bValue) {
        comparison = -1;
      } else if (aValue > bValue) {
        comparison = 1;
      }

      return direction === SortDirection.DESC ? -comparison : comparison;
    });
  }

  private extractRatioValue(ratio: string): number {
    if (!ratio) return 0;
    const parts = ratio.split(':');
    if (parts.length >= 2) {
      const numerator = parseFloat(parts[0]) || 0;
      const denominator = parseFloat(parts[1]) || 1;
      return numerator / denominator;
    }
    return parseFloat(ratio) || 0;
  }
}