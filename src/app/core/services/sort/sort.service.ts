import { Injectable } from '@angular/core';
import { Ball } from '../../models/ball.model';
import { Pattern } from '../../models/pattern.model';
import { LeagueData } from '../../models/league.model';
import {
  BallSortField,
  PatternSortField,
  SortDirection,
  BallSortOption,
  PatternSortOption,
  GameSortField,
  GameSortOption,
} from '../../models/sort.model';
import { Game } from '../../models/game.model';

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
    { field: BallSortField.CORE_TYPE, direction: SortDirection.DESC, label: 'Core Type (Z-A)' },
    { field: BallSortField.COVERSTOCK_TYPE, direction: SortDirection.ASC, label: 'Coverstock (A-Z)' },
    { field: BallSortField.COVERSTOCK_TYPE, direction: SortDirection.DESC, label: 'Coverstock (Z-A)' },
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

  readonly GAME_SORT_OPTIONS: GameSortOption[] = [
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
    { field: GameSortField.IS_PERFECT, direction: SortDirection.DESC, label: 'Perfect Games First' },
  ];

  // Helper method to get league name from LeagueData
  private getLeagueName(league: LeagueData | undefined): string {
    if (!league) return '';
    return typeof league === 'string' ? league : league.Name;
  }

  sortGames(games: Game[], sortOption?: GameSortOption): Game[] {
    const option = sortOption;
    const sortedGames = [...games];

    return sortedGames.sort((a, b) => {
      let comparison = 0;

      switch (option!.field) {
        case GameSortField.TOTAL_SCORE:
          comparison = a.totalScore - b.totalScore;
          break;
        case GameSortField.DATE:
          comparison = a.date - b.date;
          break;
        case GameSortField.LEAGUE: {
          const leagueA = this.getLeagueName(a.league);
          const leagueB = this.getLeagueName(b.league);
          comparison = leagueA.localeCompare(leagueB);
          break;
        }
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

      return option!.direction === SortDirection.DESC ? -comparison : comparison;
    });
  }
  sortBalls(balls: Ball[], sortOption: BallSortOption): Ball[] {
    return [...balls].sort((a, b) => {
      const { field, direction } = sortOption;
      let aValue: string | number = a[field];
      let bValue: string | number = b[field];

      // Handle numeric fields
      if (field === BallSortField.CORE_RG || field === BallSortField.CORE_DIFF || field === BallSortField.CORE_INT_DIFF) {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      }
      // Handle date fields
      else if (field === BallSortField.RELEASE_DATE) {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      // Handle string fields
      else if (typeof aValue === 'string' && typeof bValue === 'string') {
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
      let aValue: string | number | undefined | null = a[field];
      let bValue: string | number | undefined | null = b[field];

      // Handle numeric fields
      if (
        field === PatternSortField.DISTANCE ||
        field === PatternSortField.VOLUME ||
        field === PatternSortField.FORWARD ||
        field === PatternSortField.REVERSE ||
        field === PatternSortField.PUMP
      ) {
        aValue = parseFloat(aValue as string) || 0;
        bValue = parseFloat(bValue as string) || 0;
      }
      // Handle ratio field (extract numeric value from "X:Y" format)
      else if (field === PatternSortField.RATIO && aValue && bValue) {
        const aRatio = this.extractRatioValue(aValue as string);
        const bRatio = this.extractRatioValue(bValue as string);
        aValue = aRatio;
        bValue = bRatio;
      }
      // Handle string fields
      else if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      // Ensure values are defined for comparison
      if (aValue === undefined || aValue === null) aValue = '';
      if (bValue === undefined || bValue === null) bValue = '';

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
