import { DatePipe, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { IonChip } from '@ionic/angular/standalone';
import { GameFilter } from 'src/app/models/filter.model';
import { GameFilterService } from 'src/app/services/game-filter/game-filter.service';
import { UtilsService } from 'src/app/services/utils/utils.service';

@Component({
  selector: 'app-game-filter-active',
  standalone: true,
  imports: [IonChip, NgIf, DatePipe],
  templateUrl: './game-filter-active.component.html',
  styleUrl: './game-filter-active.component.scss',
})
export class GameFilterActiveComponent {
  constructor(
    private gameFilterService: GameFilterService,
    private utilsService: UtilsService,
  ) {}
  isFilterActive(key: keyof GameFilter): boolean {
    const defaultFilter = this.gameFilterService.defaultFilters;
    const activeFilters = this.gameFilterService.filters();
    const filterValue = activeFilters[key];
    const defaultValue = defaultFilter[key];

    if (key === 'startDate' || key === 'endDate') {
      return !this.utilsService.areDatesEqual(filterValue as string, defaultValue as string);
    } else if (Array.isArray(filterValue) && Array.isArray(defaultValue)) {
      return !this.utilsService.areArraysEqual(filterValue, defaultValue);
    } else {
      return filterValue !== defaultValue;
    }
  }

  getFilterValue(key: keyof GameFilter): any {
    return this.gameFilterService.filters()[key];
  }
}
