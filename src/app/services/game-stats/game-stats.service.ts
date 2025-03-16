import { computed, Injectable, Signal } from '@angular/core';
import { Game } from 'src/app/models/game.model';
import { SessionStats, Stats } from 'src/app/models/stats.model';
import { PrevStats } from 'src/app/models/stats.model';
import { GameFilterService } from '../game-filter/game-filter.service';
import { UtilsService } from '../utils/utils.service';
import { StorageService } from '../storage/storage.service';

const MAX_FRAMES = 10;
@Injectable({
  providedIn: 'root',
})
export class GameStatsService {
  // Previous Stats

  #prevStats = computed(() => {
    const gameHistory = this.storageService.games();
    const lastComparisonDate = parseInt(localStorage.getItem('lastComparisonDate') ?? '0');
    const today = Date.now();

    let lastGameDate = today;
    if (gameHistory.length > 0) {
      lastGameDate = gameHistory[0].date;
    }

    if (lastComparisonDate !== 0 && this.utilsService.isSameDay(lastComparisonDate, lastGameDate)) {
      return JSON.parse(localStorage.getItem('prevStats')!) ?? this.getDefaultPrevStats();
    }

    const filteredGameHistory = gameHistory.filter((game) => !this.utilsService.isSameDay(game.date, today));
    const stats: Stats = this.calculateBowlingStats(filteredGameHistory);
    let prevStats: PrevStats = this.getDefaultPrevStats();

    if (lastComparisonDate !== 0) {
      // If the previous game date is different, update the stats comparison
      if (!this.utilsService.isSameDay(lastComparisonDate, today) && this.utilsService.isDayBefore(lastComparisonDate, lastGameDate)) {
        // Save previous stats
        prevStats = prevStats = this.mapStatsToPrevStats(stats);

        localStorage.setItem('prevStats', JSON.stringify(prevStats));
        localStorage.setItem('lastComparisonDate', today.toString());
        return prevStats;
      }
    }

    if (lastComparisonDate === 0) {
      if (stats.totalGames > 0) {
        prevStats = this.mapStatsToPrevStats(stats);
      }

      localStorage.setItem('prevStats', JSON.stringify(prevStats));
      localStorage.setItem('lastComparisonDate', lastGameDate.toString());
      return prevStats;
    }
  });
  get prevStats() {
    return this.#prevStats;
  }

  // Stats
  #currentStats: Signal<Stats> = computed(() => {
    return this.calculateBowlingStats(this.gameFilterService.filteredGames());
  });
  get currentStats() {
    return this.#currentStats;
  }

  #overallStats: Signal<Stats> = computed(() => {
    return this.calculateBowlingStats(this.storageService.games());
  });
  get overallStats() {
    return this.#overallStats;
  }

  // TODO adjust and implement it completely
  seriesStats = {};
  constructor(
    private gameFilterService: GameFilterService,
    private utilsService: UtilsService,
    private storageService: StorageService,
  ) {}

  // calculatePrevStats(gameHistory: Game[]): void {
  //   const lastComparisonDate = parseInt(localStorage.getItem('lastComparisonDate') ?? '0');
  //   const today = Date.now();

  //   if (lastComparisonDate !== 0 && this.utilsService.isSameDay(lastComparisonDate, today)) {
  //     return;
  //   }

  //   let lastGameDate = today;
  //   if (gameHistory.length > 0) {
  //     lastGameDate = gameHistory[0].date;
  //   }

  //   // maybe change with lastgamedate
  //   const filteredGamehistory = gameHistory.filter((game) => !this.utilsService.isSameDay(game.date, today));
  //   const stats: Stats = this.calculateBowlingStats(filteredGamehistory);

  //   if (lastComparisonDate !== 0) {
  //     // If the previous game date is different, update the stats comparison
  //     if (!this.utilsService.isSameDay(lastComparisonDate, today) && this.utilsService.isDayBefore(lastComparisonDate, lastGameDate)) {
  //       // Save previous stats
  //       this.prevStats.set({
  //         strikePercentage: stats.strikePercentage,
  //         sparePercentage: stats.sparePercentage,
  //         openPercentage: stats.openPercentage,
  //         cleanGamePercentage: stats.cleanGamePercentage,
  //         averageStrikesPerGame: stats.averageStrikesPerGame,
  //         averageSparesPerGame: stats.averageSparesPerGame,
  //         averageOpensPerGame: stats.averageOpensPerGame,
  //         averageFirstCount: stats.averageFirstCount,
  //         cleanGameCount: stats.cleanGameCount,
  //         perfectGameCount: stats.perfectGameCount,
  //         averageScore: stats.averageScore,
  //         overallSpareRate: stats.overallSpareRate,
  //         spareRates: stats.spareRates,
  //         overallMissedRate: stats.overallMissedRate,
  //         average3SeriesScore: stats.average3SeriesScore!,
  //         average4SeriesScore: stats.average4SeriesScore!,
  //         average5SeriesScore: stats.average5SeriesScore!,
  //         high3Series: stats.high3Series!,
  //         high4Series: stats.high4Series!,
  //         high5Series: stats.high5Series!,
  //       })

  //       localStorage.setItem('prevStats', JSON.stringify(this.prevStats()));
  //       localStorage.setItem('lastComparisonDate', today.toString());
  //     }
  //   }

  //   // this.currentStats.update(() => this.calculateBowlingStats(gameHistory));

  //   if (lastComparisonDate === 0) {
  //     if (stats.totalGames > 0) {
  //       this.prevStats.set({
  //         strikePercentage: stats.strikePercentage,
  //         sparePercentage: stats.sparePercentage,
  //         openPercentage: stats.openPercentage,
  //         cleanGamePercentage: stats.cleanGamePercentage,
  //         averageStrikesPerGame: stats.averageStrikesPerGame,
  //         averageSparesPerGame: stats.averageSparesPerGame,
  //         averageOpensPerGame: stats.averageOpensPerGame,
  //         averageFirstCount: stats.averageFirstCount,
  //         cleanGameCount: stats.cleanGameCount,
  //         perfectGameCount: stats.perfectGameCount,
  //         averageScore: stats.averageScore,
  //         overallSpareRate: stats.overallSpareRate,
  //         spareRates: stats.spareRates,
  //         overallMissedRate: stats.overallMissedRate,
  //         average3SeriesScore: stats.average3SeriesScore!,
  //         average4SeriesScore: stats.average4SeriesScore!,
  //         average5SeriesScore: stats.average5SeriesScore!,
  //         high3Series: stats.high3Series!,
  //         high4Series: stats.high4Series!,
  //         high5Series: stats.high5Series!,
  //       });
  //     } else {
  //       this.prevStats.set({
  //         strikePercentage: 0,
  //         sparePercentage: 0,
  //         openPercentage: 0,
  //         cleanGamePercentage: 0,
  //         averageStrikesPerGame: 0,
  //         averageSparesPerGame: 0,
  //         averageOpensPerGame: 0,
  //         averageFirstCount: 0,
  //         cleanGameCount: 0,
  //         perfectGameCount: 0,
  //         averageScore: 0,
  //         overallSpareRate: 0,
  //         spareRates: Array(11).fill(0),
  //         overallMissedRate: 0,
  //         average3SeriesScore: 0,
  //         average4SeriesScore: 0,
  //         average5SeriesScore: 0,
  //         high3Series: 0,
  //         high4Series: 0,
  //         high5Series: 0,
  //       });
  //     }
  //     localStorage.setItem('prevStats', JSON.stringify(this.prevStats()));
  //     localStorage.setItem('lastComparisonDate', lastGameDate.toString());
  //   }
  // }

  calculateSeriesStats(gameHistory: Game[]): {
    average3SeriesScore: number;
    high3Series: number;
    average4SeriesScore: number;
    high4Series: number;
    average5SeriesScore: number;
    high5Series: number;
  } {
    const seriesScores: number[] = [];
    const series3Scores: number[] = [];
    const series4Scores: number[] = [];
    const series5Scores: number[] = [];
    let totalPins = 0;
    let totalStrikes = 0;
    let totalSpares = 0;
    let totalOpens = 0;
    const seriesSpecificStats: {
      seriesId: string;
      seriesScore: number;
      totalStrikes: number;
      totalSpares: number;
      totalOpens: number;
      averageStrikes: number;
      averageSpares: number;
      averageOpens: number;
    }[] = [];

    // Group games by series ID
    const seriesMap = new Map<string, Game[]>();

    gameHistory.forEach((game) => {
      if (game.seriesId) {
        if (!seriesMap.has(game.seriesId)) {
          seriesMap.set(game.seriesId, []);
        }
        seriesMap.get(game.seriesId)!.push(game);
      }
    });

    // Calculate stats for each series
    seriesMap.forEach((seriesGames, seriesId) => {
      const seriesScore = seriesGames.reduce((sum, game) => sum + game.totalScore, 0);
      seriesScores.push(seriesScore);
      totalPins += seriesScore;

      let seriesStrikes = 0;
      let seriesSpares = 0;
      let seriesOpens = 0;

      seriesGames.forEach((game) => {
        game.frames.forEach((frame: { throws: any }) => {
          const throws = frame.throws;

          // Count strikes
          if (throws[0].value === 10) {
            seriesStrikes++;
          }

          // Count spares
          if (throws.length === 2 && throws[0].value + throws[1].value === 10) {
            seriesSpares++;
          } else if (throws.length === 3 && throws[1].value + throws[2].value === 10) {
            seriesSpares++;
          } else {
            seriesOpens++;
          }
        });
      });

      totalStrikes += seriesStrikes;
      totalSpares += seriesSpares;
      totalOpens += seriesOpens;

      const seriesSpecificStat = {
        seriesId,
        seriesScore,
        totalStrikes: seriesStrikes,
        totalSpares: seriesSpares,
        totalOpens: seriesOpens,
        averageStrikes: seriesStrikes / seriesGames.length || 0,
        averageSpares: seriesSpares / seriesGames.length || 0,
        averageOpens: seriesOpens / seriesGames.length || 0,
      };

      seriesSpecificStats.push(seriesSpecificStat);

      // Add to specific series length arrays
      if (seriesGames.length === 3) {
        series3Scores.push(seriesScore);
      } else if (seriesGames.length === 4) {
        series4Scores.push(seriesScore);
      } else if (seriesGames.length === 5) {
        series5Scores.push(seriesScore);
      }
    });

    const totalSeries = seriesScores.length;
    const averageSeriesScore = totalPins / totalSeries || 0;
    const highSeries = Math.max(0, ...seriesScores);
    const lowSeries = Math.min(0, ...seriesScores);
    const averageStrikesPerSeries = totalStrikes / totalSeries || 0;
    const averageSparesPerSeries = totalSpares / totalSeries || 0;
    const averageOpensPerSeries = totalOpens / totalSeries || 0;

    const average3SeriesScore = series3Scores.reduce((sum, score) => sum + score, 0) / series3Scores.length || 0;
    const high3Series = Math.max(0, ...series3Scores);
    const average4SeriesScore = series4Scores.reduce((sum, score) => sum + score, 0) / series4Scores.length || 0;
    const high4Series = Math.max(0, ...series4Scores);
    const average5SeriesScore = series5Scores.reduce((sum, score) => sum + score, 0) / series5Scores.length || 0;
    const high5Series = Math.max(0, ...series5Scores);

    this.seriesStats = {
      totalSeries,
      totalPins,
      totalStrikes,
      totalSpares,
      averageSeriesScore,
      highSeries,
      lowSeries,
      averageStrikesPerSeries,
      averageSparesPerSeries,
      averageOpensPerSeries,
      seriesScores,
      seriesSpecificStats,
    };

    return {
      average3SeriesScore,
      high3Series,
      average4SeriesScore,
      high4Series,
      average5SeriesScore,
      high5Series,
    };
  }

  calculateBowlingStats(gameHistory: Game[]): Stats | SessionStats {
    let totalStrikes = 0;
    let totalSpares = 0;
    let totalSparesConverted = 0;
    let totalSparesMissed = 0;
    const pinCounts = Array(11).fill(0);
    const missedCounts = Array(11).fill(0);
    let firstThrowCount = 0;
    let perfectGameCount = 0;
    let cleanGameCount = 0;

    gameHistory.forEach((game: Game) => {
      if (game.isClean) {
        cleanGameCount++;
        if (game.isPerfect) {
          perfectGameCount++;
        }
      }

      game.frames.forEach((frame: { throws: any }, index: number) => {
        const throws = frame.throws;

        // Count the first throw in each frame for firstThrowAverage
        firstThrowCount += parseInt(throws[0].value);

        // Count strikes
        if (throws[0].value === 10) {
          totalStrikes++;
          // Additional logic for counting strikes in the 10th frame
          if (index === 9) {
            if (throws[1]?.value === 10) {
              totalStrikes++; // Increment by 1 if second throw is also a strike
              if (throws[2]?.value === 10) {
                totalStrikes++; // Increment by 1 if third throw is also a strike
              }
            }
          }
        } else if (index === 9 && throws.length === 3) {
          if (throws[2]?.value === 10) {
            totalStrikes++; // Increment by 1 if third throw is a strike
          }
        }

        // Handle pin counts for spares
        if (throws.length === 2) {
          if (throws[0].value + throws[1].value === 10) {
            const pinsLeft = 10 - throws[0].value;
            pinCounts[pinsLeft]++;
          } else {
            const pinsLeft = 10 - throws[0].value;
            missedCounts[pinsLeft]++;
          }
        } else if (throws.length === 3) {
          // Check for spares in the first two throws
          if (throws[0].value !== 10 && throws[0].value + throws[1].value === 10) {
            const pinsLeft = 10 - throws[0].value;
            pinCounts[pinsLeft]++;
          } else if (throws[1].value !== 10 && throws[1].value + throws[2].value === 10) {
            const pinsLeft = 10 - throws[1].value;
            pinCounts[pinsLeft]++;
          }

          // Check for missed pins
          if (throws[0].value !== 10 && throws[0].value + throws[1].value !== 10) {
            const pinsLeft = 10 - throws[0].value;
            missedCounts[pinsLeft]++;
          }
          if (throws[1].value !== 10 && throws[0].value + throws[1].value !== 10 && throws[1].value + throws[2].value !== 10) {
            const pinsLeft = 10 - throws[1].value;
            missedCounts[pinsLeft]++;
          }
        }
      });
    });

    for (let i = 1; i <= MAX_FRAMES; i++) {
      totalSparesMissed += missedCounts[i] || 0;
      totalSparesConverted += pinCounts[i] || 0;
    }

    totalSpares = totalSparesConverted;
    const totalPins = gameHistory.reduce((sum, game) => sum + game.totalScore, 0);
    const totalGames = gameHistory.length;
    const averageScore = totalPins / gameHistory.length || 0;
    const highGame = Math.max(...gameHistory.map((game) => game.totalScore));
    const lowGame = Math.min(...gameHistory.map((game) => game.totalScore));

    const cleanGamePercentage = (cleanGameCount / totalGames) * 100 || 0;

    const totalFrames = totalGames * 10;
    const strikeChances = gameHistory.length * 12;

    const averageStrikesPerGame = totalStrikes / totalGames || 0;
    const averageSparesPerGame = totalSpares / totalGames || 0;
    const averageOpensPerGame = totalSparesMissed / totalGames || 0;

    const strikePercentage = (totalStrikes / strikeChances) * 100 || 0;
    const sparePercentage = (totalSpares / totalFrames) * 100 || 0;
    const openPercentage = (totalSparesMissed / totalFrames) * 100 || 0;

    const averageFirstCount = firstThrowCount / totalFrames;

    const spareRates = pinCounts.map((pinCount, i) => this.getRate(pinCount, missedCounts[i]));
    const overallSpareRate = this.getRate(totalSparesConverted, totalSparesMissed);
    const spareConversionPercentage = (totalSparesConverted / (totalSparesConverted + totalSparesMissed)) * 100;
    const overallMissedRate = totalSparesMissed > 0 ? 100 - overallSpareRate : 0;
    const average3SeriesScore = this.calculateSeriesStats(gameHistory).average3SeriesScore;
    const high3Series = this.calculateSeriesStats(gameHistory).high3Series;
    const average4SeriesScore = this.calculateSeriesStats(gameHistory).average4SeriesScore;
    const high4Series = this.calculateSeriesStats(gameHistory).high4Series;
    const average5SeriesScore = this.calculateSeriesStats(gameHistory).average5SeriesScore;
    const high5Series = this.calculateSeriesStats(gameHistory).high5Series;

    return {
      totalStrikes,
      totalSpares,
      totalSparesConverted,
      totalSparesMissed,
      pinCounts,
      missedCounts,
      perfectGameCount,
      cleanGameCount,
      cleanGamePercentage,
      totalGames,
      averageScore,
      highGame,
      averageStrikesPerGame,
      averageSparesPerGame,
      averageOpensPerGame,
      strikePercentage,
      sparePercentage,
      openPercentage,
      averageFirstCount,
      spareRates,
      overallSpareRate,
      totalPins,
      overallMissedRate,
      spareConversionPercentage,
      lowGame,
      average3SeriesScore,
      high3Series,
      average4SeriesScore,
      high4Series,
      average5SeriesScore,
      high5Series,
    };
  }

  private mapStatsToPrevStats(stats: Stats): PrevStats {
    return {
      strikePercentage: stats.strikePercentage,
      sparePercentage: stats.sparePercentage,
      openPercentage: stats.openPercentage,
      cleanGamePercentage: stats.cleanGamePercentage,
      averageStrikesPerGame: stats.averageStrikesPerGame,
      averageSparesPerGame: stats.averageSparesPerGame,
      averageOpensPerGame: stats.averageOpensPerGame,
      averageFirstCount: stats.averageFirstCount,
      cleanGameCount: stats.cleanGameCount,
      perfectGameCount: stats.perfectGameCount,
      averageScore: stats.averageScore,
      overallSpareRate: stats.overallSpareRate,
      spareRates: stats.spareRates,
      overallMissedRate: stats.overallMissedRate,
      average3SeriesScore: stats.average3SeriesScore!,
      average4SeriesScore: stats.average4SeriesScore!,
      average5SeriesScore: stats.average5SeriesScore!,
      high3Series: stats.high3Series!,
      high4Series: stats.high4Series!,
      high5Series: stats.high5Series!,
    };
  }

  private getDefaultPrevStats(): PrevStats {
    return {
      strikePercentage: 0,
      sparePercentage: 0,
      openPercentage: 0,
      cleanGamePercentage: 0,
      averageStrikesPerGame: 0,
      averageSparesPerGame: 0,
      averageOpensPerGame: 0,
      averageFirstCount: 0,
      cleanGameCount: 0,
      perfectGameCount: 0,
      averageScore: 0,
      overallSpareRate: 0,
      overallMissedRate: 0,
      average3SeriesScore: 0,
      average4SeriesScore: 0,
      average5SeriesScore: 0,
      high3Series: 0,
      high4Series: 0,
      high5Series: 0,
      spareRates: Array(11).fill(0),
    };
  }

  private getRate(converted: number, missed: number): number {
    if (converted + missed === 0) {
      return 0;
    }
    return (converted / (converted + missed)) * 100;
  }
}
