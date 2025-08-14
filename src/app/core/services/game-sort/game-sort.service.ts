import { Injectable, signal, computed } from '@angular/core';
import { Game } from 'src/app/core/models/game.model';
import { GameSortField, GameSortOption, SortDirection } from 'src/app/core/models/sort.model';

@Injectable({
  providedIn: 'root'
})
export class GameSortService {
  #selectedSort = signal<GameSortOption>({
    field: GameSortField.DATE,
    direction: SortDirection.DESC,
    label: 'Date (Newest First)'
  });

  get selectedSort() {
    return this.#selectedSort;
  }

  readonly gameSortOptions: GameSortOption[] = [
    { field: GameSortField.TOTAL_SCORE, direction: SortDirection.ASC, label: 'Score (Low to High)' },
    { field: GameSortField.TOTAL_SCORE, direction: SortDirection.DESC, label: 'Score (High to Low)' },
    { field: GameSortField.DATE, direction: SortDirection.ASC, label: 'Date (Oldest First)' },
    { field: GameSortField.DATE, direction: SortDirection.DESC, label: 'Date (Newest First)' },
    { field: GameSortField.LEAGUE, direction: SortDirection.ASC, label: 'League (A-Z)' },
    { field: GameSortField.LEAGUE, direction: SortDirection.DESC, label: 'League (Z-A)' },
    { field: GameSortField.IS_PRACTICE, direction: SortDirection.ASC, label: 'League Games First' },
    { field: GameSortField.IS_PRACTICE, direction: SortDirection.DESC, label: 'Practice Games First' },
    { field: GameSortField.IS_CLEAN, direction: SortDirection.ASC, label: 'Non-Clean Games First' },
    { field: GameSortField.IS_CLEAN, direction: SortDirection.DESC, label: 'Clean Games First' },
    { field: GameSortField.IS_PERFECT, direction: SortDirection.ASC, label: 'Non-Perfect Games First' },
    { field: GameSortField.IS_PERFECT, direction: SortDirection.DESC, label: 'Perfect Games First' },
  ];

  sortGames(games: Game[], sortOption?: GameSortOption): Game[] {
    const option = sortOption || this.#selectedSort();
    const sortedGames = [...games];

    return sortedGames.sort((a, b) => {
      let comparison = 0;

      switch (option.field) {
        case GameSortField.TOTAL_SCORE:
          comparison = a.totalScore - b.totalScore;
          break;
        case GameSortField.DATE:
          comparison = a.date - b.date;
          break;
        case GameSortField.LEAGUE:
          const leagueA = a.league || '';
          const leagueB = b.league || '';
          comparison = leagueA.localeCompare(leagueB);
          break;
        case GameSortField.IS_PRACTICE:
          comparison = (a.isPractice ? 1 : 0) - (b.isPractice ? 1 : 0);
          break;
        case GameSortField.IS_CLEAN:
          comparison = (a.isClean ? 1 : 0) - (b.isClean ? 1 : 0);
          break;
        case GameSortField.IS_PERFECT:
          comparison = (a.isPerfect ? 1 : 0) - (b.isPerfect ? 1 : 0);
          break;
        default:
          comparison = 0;
      }

      return option.direction === SortDirection.DESC ? -comparison : comparison;
    });
  }

  updateSelectedSort(sortOption: GameSortOption): void {
    this.#selectedSort.set(sortOption);
  }
}