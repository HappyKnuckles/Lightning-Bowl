import { Component } from '@angular/core';
import { BallFilter } from 'src/app/models/filter.model';
import { BallFilterService } from 'src/app/services/ball-filter/ball-filter.service';
import { UtilsService } from 'src/app/services/utils/utils.service';
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
  constructor(
    private ballFilterService: BallFilterService,
    private utilsService: UtilsService,
  ) {}
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
