import { Injectable, signal } from '@angular/core';
import { GameFilter, TimeRange } from 'src/app/models/filter.model';
import { Game } from 'src/app/models/game.model';
import { BehaviorSubject } from 'rxjs';
import { UtilsService } from '../utils/utils.service';

@Injectable({
  providedIn: 'root',
})
export class GameFilterService {
  defaultFilters: GameFilter = {
    excludePractice: false,
    minScore: 0,
    maxScore: 300,
    isClean: false,
    isPerfect: false,
    leagues: ['all'],
    balls: ['all'],
    timeRange: TimeRange.ALL,
    startDate: '',
    endDate: '',
  };
  leagues: string[] = [];
  activeFilterCount: number = 0;
  private filteredGamesSubject = new BehaviorSubject<Game[]>([]);
  filteredGames$ = this.filteredGamesSubject.asObservable();
  #filters = signal<GameFilter>({ ...this.defaultFilters });
  get filters() {
    return this.#filters;
  }
  constructor(private utilsService: UtilsService) {}

  filterGames(games: Game[]): void {
    localStorage.setItem('game-filter', JSON.stringify(this.filters()));
    this.updateActiveFilterCount();

    const filteredGames = games.filter((game) => {
      const formatDate = (date: string) => date.split('T')[0];
      const gameDate = formatDate(new Date(game.date).toISOString());
      const startDate = formatDate(this.filters().startDate!);
      const endDate = formatDate(this.filters().endDate!);
      const isWithinDateRange = gameDate >= startDate && gameDate <= endDate;
      const isWithinScoreRange = game.totalScore >= this.filters().minScore && game.totalScore <= this.filters().maxScore;
      const matchesPracticeFilter = this.filters().excludePractice ? !game.isPractice : true;
      const matchesPerfectFilter = !this.filters().isPerfect || game.isPerfect;
      const matchesCleanFilter = !this.filters().isClean || game.isClean;

      let matchesLeagueFilter = true;
      if (!this.filters().leagues.includes('all')) {
        matchesLeagueFilter = this.filters().leagues.includes(game.league!);
      }
      if (this.filters().leagues.includes('')) {
        matchesLeagueFilter = game.league === '' || game.league === undefined || this.filters().leagues.includes(game.league);
      }

      let matchesBallFilter = true;
      if (!this.filters().balls.includes('all')) {
        matchesBallFilter = this.filters().balls.some((ball) => game.balls?.includes(ball));
      }
      if (this.filters().balls.includes('')) {
        matchesBallFilter = game.balls?.length === 0 || game.balls === undefined || this.filters().balls.some((ball) => game.balls?.includes(ball));
      }

      return (
        isWithinDateRange &&
        isWithinScoreRange &&
        matchesPracticeFilter &&
        matchesPerfectFilter &&
        matchesCleanFilter &&
        matchesLeagueFilter &&
        matchesBallFilter
      );
    });

    this.filteredGamesSubject.next(filteredGames);
  }

  resetFilters(): void {
    this.filters.update(() => ({ ...this.defaultFilters }));
    this.updateActiveFilterCount();
  }

  setDefaultFilters(games: Game[]): void {
    if (games.length > 0) {
      this.defaultFilters.startDate = new Date(games[games.length - 1].date).toISOString();
    } else {
      this.defaultFilters.startDate = new Date().toISOString();
    }
    const currentDate = new Date();
    const oneWeekLater = new Date(currentDate.setDate(currentDate.getDate() + 7));
    this.defaultFilters.endDate = oneWeekLater.toISOString();
    this.filters.update(() => this.loadInitialFilters());
    this.filters.update((filters) => ({ ...filters, endDate: this.defaultFilters.endDate }));
  }

  private updateActiveFilterCount(): void {
    this.activeFilterCount = Object.keys(this.filters()).reduce((count, key) => {
      const filterValue = this.filters()[key as keyof GameFilter];
      const defaultValue = this.defaultFilters[key as keyof GameFilter];

      if (key === 'startDate' || key === 'endDate') {
        if (!this.utilsService.areDatesEqual(filterValue as string, defaultValue as string)) {
          return count + 1;
        }
      } else if (Array.isArray(filterValue) && Array.isArray(defaultValue)) {
        if (!this.utilsService.areArraysEqual(filterValue, defaultValue)) {
          return count + 1;
        }
      } else if (filterValue !== defaultValue) {
        return count + 1;
      }
      return count;
    }, 0);
  }

  private loadInitialFilters(): GameFilter {
    localStorage.removeItem('filter');
    const storedFilter = localStorage.getItem('game-filter');
    return storedFilter ? JSON.parse(storedFilter) : { ...this.defaultFilters };
  }
}
