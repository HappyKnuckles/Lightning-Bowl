import { Component } from '@angular/core';
import { BallFilter } from 'src/app/core/models/filter.model';
import { BallFilterService } from 'src/app/core/services/ball-filter/ball-filter.service';
import { IonChip } from '@ionic/angular/standalone';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-ball-filter-active',
  standalone: true,
  imports: [IonChip, NgIf],
  templateUrl: './ball-filter-active.component.html',
  styleUrl: './ball-filter-active.component.scss',
})
export class BallFilterActiveComponent {
  constructor(private ballFilterService: BallFilterService) {}
  isFilterActive(key: keyof BallFilter): boolean {
    const defaultFilter = this.ballFilterService.defaultFilters;
    const activeFilters = this.ballFilterService.filters();
    const filterValue = activeFilters[key];
    const defaultValue = defaultFilter[key];

    if (key === 'weight') {
      return true;
    }
    return filterValue !== defaultValue;
  }

  getFilterValue(key: keyof BallFilter): any {
    return this.ballFilterService.filters()[key];
  }
}
