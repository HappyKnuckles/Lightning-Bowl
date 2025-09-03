import { Injectable } from '@angular/core';
import { GameFilter, TimeRange } from 'src/app/core/models/filter.model';
import { Game } from 'src/app/core/models/game.model';
import { UtilsService } from '../utils/utils.service';
import { StorageService } from '../storage/storage.service';
import { BaseFilterService } from '../base-filter/base-filter.service';

@Injectable({
  providedIn: 'root',
})
export class GameFilterService extends BaseFilterService<GameFilter, Game> {
  defaultFilters: GameFilter = {
    excludePractice: false,
    minScore: 0,
    maxScore: 300,
    isClean: false,
    isPerfect: false,
    leagues: ['all'],
    balls: ['all'],
    patterns: ['all'],
    timeRange: TimeRange.ALL,
    startDate: '',
    endDate: '',
  };

  get filteredGames() {
    return this.filteredItems;
  }

  constructor(
    protected override utilsService: UtilsService,
    private storageService: StorageService,
  ) {
    super(utilsService);
    this.setDefaultFilters();
  }

  getAllItems(): Game[] {
    return this.storageService.games();
  }

  getStorageKey(): string {
    return 'game-filter';
  }

  filterItems(games: Game[], filters: GameFilter): Game[] {
    return this.filterGames(games, filters);
  }

  filterGames(games: Game[], filters: GameFilter): Game[] {
    const filteredGames = games.filter((game) => {
      const formatDate = (date: string) => date.split('T')[0];
      const gameDate = formatDate(new Date(game.date).toISOString());
      const startDate = formatDate(filters.startDate!);
      const endDate = formatDate(filters.endDate!);

      return (
        gameDate >= startDate &&
        gameDate <= endDate &&
        game.totalScore >= filters.minScore &&
        game.totalScore <= filters.maxScore &&
        (filters.excludePractice ? !game.isPractice : true) &&
        (!filters.isPerfect || game.isPerfect) &&
        (!filters.isClean || game.isClean) &&
        (filters.leagues.includes('all') || filters.leagues.length === 0 || filters.leagues.includes(game.league || '')) &&
        (filters.patterns.includes('all') || filters.patterns.length === 0 || game.patterns!.some((pattern) => filters.patterns.includes(pattern))) &&
        (filters.balls.includes('all') || filters.balls.length === 0 || game.balls!.some((ball) => filters.balls.includes(ball)))
      );
    });
    return filteredGames;
  }

  setDefaultFilters(): void {
    const startDate = localStorage.getItem('first-game');
    const defaultStartDate = startDate ? new Date(parseInt(startDate)).toISOString() : new Date(0).toISOString();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    this.defaultFilters = {
      ...this.defaultFilters,
      startDate: defaultStartDate,
      endDate: endDate.toISOString(),
    };

    this.filters.set(this.loadInitialFilters());
  }

  protected override loadInitialFilters(): GameFilter {
    localStorage.removeItem('filter');
    const storedFilter = localStorage.getItem('game-filter');
    return storedFilter ? JSON.parse(storedFilter) : { ...this.defaultFilters };
  }
}
