import { computed, Injectable, Signal } from '@angular/core';
import { Game } from 'src/app/core/models/game.model';
import { BestBallStats, PrevStats, SeriesStats, Stats } from 'src/app/core/models/stats.model';

import { GameFilterService } from '../game-filter/game-filter.service';
import { StorageService } from '../storage/storage.service';

import { StatsPersistenceService } from './stats-persistance.service';
import { OverallStatsCalculatorService } from './game-stats-calculator/overall-stats-calculator.service';
import { BallStatsCalculatorService } from './game-stats-calculator/ball-stats-calculator.service';
import { SeriesStatsCalculatorService } from './game-stats-calculator/series-stats-calculator.service';

@Injectable({
  providedIn: 'root',
})
export class GameStatsService {
  constructor(
    private gameFilterService: GameFilterService,
    private storageService: StorageService,
    private overallStatsCalculatorService: OverallStatsCalculatorService,
    private seriesStatsCalculatorService: SeriesStatsCalculatorService,
    private ballStatsCalculatorService: BallStatsCalculatorService,
    private statsPersistenceService: StatsPersistenceService,
  ) {}

  get prevStats(): Signal<PrevStats> {
    return this.statsPersistenceService.prevStats;
  }

  #bestBallStats: Signal<BestBallStats> = computed(() => {
    return this.ballStatsCalculatorService.calculateBestBallStats(this.gameFilterService.filteredGames());
  });

  #mostPlayedBallStats: Signal<BestBallStats> = computed(() => {
    return this.ballStatsCalculatorService.calculateMostPlayedBall(this.gameFilterService.filteredGames());
  });

  get mostPlayedBallStats(): Signal<BestBallStats> {
    return this.#mostPlayedBallStats;
  }
  get bestBallStats(): Signal<BestBallStats> {
    return this.#bestBallStats;
  }

  #currentStats: Signal<Stats> = computed(() => {
    const games = this.gameFilterService.filteredGames();
    const seriesStats = this.seriesStatsCalculatorService.calculateSeriesStats(games);
    return this.overallStatsCalculatorService.calculateBowlingStats(games, seriesStats) as Stats;
  });
  get currentStats(): Signal<Stats> {
    return this.#currentStats;
  }

  #overallStats: Signal<Stats> = computed(() => {
    const games = this.storageService.games();
    const seriesStats = this.seriesStatsCalculatorService.calculateSeriesStats(games);
    return this.overallStatsCalculatorService.calculateBowlingStats(games, seriesStats) as Stats;
  });
  get overallStats(): Signal<Stats> {
    return this.#overallStats;
  }

  get seriesStats(): SeriesStats {
    this.seriesStatsCalculatorService.calculateSeriesStats(this.storageService.games());
    return this.seriesStatsCalculatorService.seriesStats;
  }

  calculateSeriesStats(gameHistory: Game[]): SeriesStats {
    return this.seriesStatsCalculatorService.calculateSeriesStats(gameHistory);
  }

  calculateBowlingStats(gameHistory: Game[]): Stats {
    const seriesStats = this.seriesStatsCalculatorService.calculateSeriesStats(gameHistory);
    return this.overallStatsCalculatorService.calculateBowlingStats(gameHistory, seriesStats) as Stats;
  }

  calculateBestBallStats(gameHistory: Game[]): BestBallStats {
    return this.ballStatsCalculatorService.calculateBestBallStats(gameHistory);
  }

  calculateMostPlayedBall(gameHistory: Game[]): BestBallStats {
    return this.ballStatsCalculatorService.calculateMostPlayedBall(gameHistory);
  }

  calculateGamesForTargetAverage(targetAvg: number, steps = 15): { score: number; gamesNeeded: number }[] {
    return this.overallStatsCalculatorService.calculateGamesForTargetAverage(targetAvg, this.overallStats(), steps);
  }
}
