import { Injectable } from '@angular/core';
import { BallFilter, CoreType, CoverstockType, Market } from 'src/app/core/models/filter.model';
import { UtilsService } from '../utils/utils.service';
import { Ball } from 'src/app/core/models/ball.model';
import { StorageService } from '../storage/storage.service';
import { BaseFilterService } from '../base-filter/base-filter.service';

@Injectable({
  providedIn: 'root',
})
export class BallFilterService extends BaseFilterService<BallFilter, Ball> {
  defaultFilters: BallFilter = {
    brands: [],
    coverstocks: [],
    coverstockTypes: [],
    cores: [],
    market: Market.ALL,
    coreType: CoreType.ALL,
    availability: false,
    releaseDate: 'all',
    weight: '15',
    minRg: 0,
    maxRg: 3,
    minDiff: 0,
    maxDiff: 0.1,
    inArsenal: false,
  };

  get filteredBalls() {
    return this.filteredItems;
  }

  constructor(
    protected override utilsService: UtilsService,
    private storageService: StorageService,
  ) {
    super(utilsService);
  }

  getAllItems(): Ball[] {
    return this.storageService.allBalls();
  }

  getStorageKey(): string {
    return 'ball-filter';
  }

  filterItems(balls: Ball[], filters: BallFilter): Ball[] {
    return this.filterBalls(balls, filters);
  }

  filterBalls(balls: Ball[], filters: BallFilter): Ball[] {
    const filteredBalls = balls.filter((ball) => {
      return (
        (filters.brands.length === 0 || filters.brands.includes(ball.brand_name)) &&
        (filters.cores.length === 0 || filters.cores.includes(ball.core_name)) &&
        (filters.coverstocks.length === 0 || filters.coverstocks.includes(ball.ball_name)) &&
        (filters.coverstockTypes.length === 0 || filters.coverstockTypes.includes(ball.coverstock_type as CoverstockType)) &&
        (filters.market === Market.ALL || filters.market === ball.us_int) &&
        (filters.coreType === CoreType.ALL || filters.coreType === ball.core_type) &&
        (!filters.availability || ball.availability === 'Available') &&
        (filters.releaseDate === 'all' || filters.releaseDate === ball.release_date) &&
        filters.minRg <= parseFloat(ball.core_rg) &&
        filters.maxRg >= parseFloat(ball.core_rg) &&
        filters.minDiff <= parseFloat(ball.core_diff) &&
        filters.maxDiff >= parseFloat(ball.core_diff) &&
        (!filters.inArsenal || this.storageService.arsenal().some((arsenalBall) => arsenalBall.ball_id === ball.ball_id))
      );
    });
    return filteredBalls;
  }
}
