// src/app/core/services/game-stats/game-stats.service.ts (The original file, now a facade)

import { computed, Injectable, Signal } from '@angular/core';
import { Game } from 'src/app/core/models/game.model';
import { BestBallStats, PrevStats, SeriesStats, Stats } from 'src/app/core/models/stats.model';

import { GameFilterService } from '../game-filter/game-filter.service';
import { StorageService } from '../storage/storage.service';
import { BallStatsService } from './ball-stats.service';
import { SeriesStatsService } from './series-stats.service';
import { StatsCalculationService } from './stats-calculation.service';
import { StatsPersistenceService } from './stats-persistance.service';

@Injectable({
  providedIn: 'root',
})
export class GameStatsService {
  constructor(
    private gameFilterService: GameFilterService,
    private storageService: StorageService,
    private statsCalculationService: StatsCalculationService,
    private seriesStatsService: SeriesStatsService,
    private ballStatsService: BallStatsService,
    private statsPersistenceService: StatsPersistenceService,
  ) {}

  get prevStats(): Signal<PrevStats> {
    return this.statsPersistenceService.prevStats;
  }

  #bestBallStats: Signal<BestBallStats> = computed(() => {
    return this.ballStatsService.calculateBestBallStats(this.gameFilterService.filteredGames());
  });

  #mostPlayedBallStats: Signal<BestBallStats> = computed(() => {
    return this.ballStatsService.calculateMostPlayedBall(this.gameFilterService.filteredGames());
  });

  get mostPlayedBallStats(): Signal<BestBallStats> {
    return this.#mostPlayedBallStats;
  }
  get bestBallStats(): Signal<BestBallStats> {
    return this.#bestBallStats;
  }

  #currentStats: Signal<Stats> = computed(() => {
    const games = this.gameFilterService.filteredGames();
    const seriesStats = this.seriesStatsService.calculateSeriesStats(games);
    return this.statsCalculationService.calculateBowlingStats(games, seriesStats) as Stats;
  });
  get currentStats(): Signal<Stats> {
    return this.#currentStats;
  }

  #overallStats: Signal<Stats> = computed(() => {
    const games = this.storageService.games();
    const seriesStats = this.seriesStatsService.calculateSeriesStats(games);
    return this.statsCalculationService.calculateBowlingStats(games, seriesStats) as Stats;
  });
  get overallStats(): Signal<Stats> {
    return this.#overallStats;
  }

  get seriesStats(): SeriesStats {
    this.seriesStatsService.calculateSeriesStats(this.storageService.games());
    return this.seriesStatsService.seriesStats;
  }

  calculateSeriesStats(gameHistory: Game[]): SeriesStats {
    return this.seriesStatsService.calculateSeriesStats(gameHistory);
  }

  calculateBowlingStats(gameHistory: Game[]): Stats {
    const seriesStats = this.seriesStatsService.calculateSeriesStats(gameHistory);
    return this.statsCalculationService.calculateBowlingStats(gameHistory, seriesStats) as Stats;
  }

  calculateBestBallStats(gameHistory: Game[]): BestBallStats {
    return this.ballStatsService.calculateBestBallStats(gameHistory);
  }

  calculateMostPlayedBall(gameHistory: Game[]): BestBallStats {
    return this.ballStatsService.calculateMostPlayedBall(gameHistory);
  }

  calculateGamesForTargetAverage(targetAvg: number, steps = 15): { score: number; gamesNeeded: number }[] {
    return this.statsCalculationService.calculateGamesForTargetAverage(targetAvg, this.overallStats(), steps);
  }
}
