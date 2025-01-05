import { Injectable, signal } from '@angular/core';
import { Game } from 'src/app/models/game.model';
import { SessionStats, Stats } from 'src/app/models/stats.model';
import { PrevStats } from 'src/app/models/stats.model';

const MAX_FRAMES = 10;
@Injectable({
  providedIn: 'root',
})
export class GameStatsService {
  // Previous Stats
  prevStats: PrevStats = {
    strikePercentage: 0,
    sparePercentage: 0,
    openPercentage: 0,
    cleanGamePercentage: 0,
    averageStrikesPerGame: 0,
    averageSparesPerGame: 0,
    averageOpensPerGame: 0,
    averageFirstCount: 0,
    averageSeriesScore: 0,
    cleanGameCount: 0,
    perfectGameCount: 0,
    averageScore: 0,
    overallSpareRate: 0,
    overallMissedRate: 0,
    average3SeriesScore: 0,
    average4SeriesScore: 0,
    average5SeriesScore: 0,
    spareRates: [] as number[],
  };

  // Stats
  #currentStats = signal<Stats>({
    totalGames: 0,
    totalPins: 0,
    perfectGameCount: 0,
    cleanGameCount: 0,
    cleanGamePercentage: 0,
    totalStrikes: 0,
    totalSpares: 0,
    totalSparesMissed: 0,
    totalSparesConverted: 0,
    pinCounts: Array(11).fill(0),
    missedCounts: Array(11).fill(0),
    averageStrikesPerGame: 0,
    averageSparesPerGame: 0,
    averageOpensPerGame: 0,
    strikePercentage: 0,
    sparePercentage: 0,
    openPercentage: 0,
    spareConversionPercentage: 0,
    averageFirstCount: 0,
    averageScore: 0,
    highGame: 0,
    spareRates: [],
    overallSpareRate: 0,
    overallMissedRate: 0,
    lowGame: 0,
    average3SeriesScore: 0,
    high3Series: 0,
    average4SeriesScore: 0,
    high4Series: 0,
    average5SeriesScore: 0,
    high5Series: 0,
  });

  // Session Stats
  #sessionStats = signal<SessionStats>({
    totalGames: 0,
    totalPins: 0,
    perfectGameCount: 0,
    cleanGameCount: 0,
    cleanGamePercentage: 0,
    totalStrikes: 0,
    totalSpares: 0,
    totalSparesMissed: 0,
    totalSparesConverted: 0,
    pinCounts: Array(11).fill(0),
    missedCounts: Array(11).fill(0),
    averageStrikesPerGame: 0,
    averageSparesPerGame: 0,
    averageOpensPerGame: 0,
    strikePercentage: 0,
    sparePercentage: 0,
    openPercentage: 0,
    spareConversionPercentage: 0,
    averageFirstCount: 0,
    averageScore: 0,
    highGame: 0,
    lowGame: 0,
    spareRates: [],
    overallSpareRate: 0,
    overallMissedRate: 0,
  });

  get currentStats() {
    return this.#currentStats;
  }

  get sessionStats() {
    return this.#sessionStats;
  }

  constructor() {}

  calculateStats(gameHistory: Game[]): void {
    const lastComparisonDate = localStorage.getItem('lastComparisonDate') ?? '0';
    const today = Date.now();

    let lastGameDate = 0;
    if (gameHistory.length > 0) {
      lastGameDate = gameHistory[gameHistory.length - 1].date;
    }

    if (lastComparisonDate !== '0') {
      // If the previous game date is different, update the stats comparison
      if (!this.isSameDay(parseInt(lastComparisonDate), today) && this.isDayBefore(parseInt(lastComparisonDate), lastGameDate)) {
        // Save previous stats
        this.prevStats = {
          strikePercentage: this.currentStats().strikePercentage,
          sparePercentage: this.currentStats().sparePercentage,
          openPercentage: this.currentStats().openPercentage,
          cleanGamePercentage: this.currentStats().cleanGamePercentage,
          averageStrikesPerGame: this.currentStats().averageStrikesPerGame,
          averageSparesPerGame: this.currentStats().averageSparesPerGame,
          averageOpensPerGame: this.currentStats().averageOpensPerGame,
          averageFirstCount: this.currentStats().averageFirstCount,
          cleanGameCount: this.currentStats().cleanGameCount,
          perfectGameCount: this.currentStats().perfectGameCount,
          averageScore: this.currentStats().averageScore,
          overallSpareRate: this.currentStats().overallSpareRate,
          spareRates: this.currentStats().spareRates,
          overallMissedRate: this.currentStats().overallMissedRate,
          average3SeriesScore: this.currentStats().average3SeriesScore!,
          average4SeriesScore: this.currentStats().average4SeriesScore!,
          average5SeriesScore: this.currentStats().average5SeriesScore!,
          high3Series: this.currentStats().high3Series!,
          high4Series: this.currentStats().high4Series!,
          high5Series: this.currentStats().high5Series!,
        };

        localStorage.setItem('prevStats', JSON.stringify(this.prevStats));
        localStorage.setItem('lastComparisonDate', lastGameDate.toString());
      }
    }

    this.currentStats.update(() => this.calculateBowlingStats(gameHistory));

    if (lastComparisonDate === '0') {
      if (this.currentStats().totalGames > 0) {
        this.prevStats = {
          strikePercentage: this.currentStats().strikePercentage,
          sparePercentage: this.currentStats().sparePercentage,
          openPercentage: this.currentStats().openPercentage,
          cleanGamePercentage: this.currentStats().cleanGamePercentage,
          averageStrikesPerGame: this.currentStats().averageStrikesPerGame,
          averageSparesPerGame: this.currentStats().averageSparesPerGame,
          averageOpensPerGame: this.currentStats().averageOpensPerGame,
          averageFirstCount: this.currentStats().averageFirstCount,
          cleanGameCount: this.currentStats().cleanGameCount,
          perfectGameCount: this.currentStats().perfectGameCount,
          averageScore: this.currentStats().averageScore,
          overallSpareRate: this.currentStats().overallSpareRate,
          spareRates: this.currentStats().spareRates,
          overallMissedRate: this.currentStats().overallMissedRate,
          average3SeriesScore: this.currentStats().average3SeriesScore!,
          average4SeriesScore: this.currentStats().average4SeriesScore!,
          average5SeriesScore: this.currentStats().average5SeriesScore!,
        };
      } else {
        this.prevStats = {
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
          spareRates: Array(11).fill(0),
          overallMissedRate: 0,
          average3SeriesScore: 0,
          average4SeriesScore: 0,
          average5SeriesScore: 0,
        };
      }
      localStorage.setItem('prevStats', JSON.stringify(this.prevStats));
      localStorage.setItem('lastComparisonDate', lastGameDate.toString());
    }
  }

  calculateStatsBasedOnDate(gameHistory: Game[], date: number): void {
    const filteredGames = gameHistory.filter((game) => this.isSameDay(game.date, date));
    this.sessionStats.update(() => this.calculateBowlingStats(filteredGames) as SessionStats);
  }

  // TODO adjust and implement it completely
  seriesStats = {};
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

  private getRate(converted: number, missed: number): number {
    if (converted + missed === 0) {
      return 0;
    }
    return (converted / (converted + missed)) * 100;
  }

  private isSameDay(timestamp1: number, timestamp2: number): boolean {
    const date1 = new Date(timestamp1);
    const date2 = new Date(timestamp2);

    return date1.getDate() === date2.getDate() && date1.getMonth() === date2.getMonth() && date1.getFullYear() === date2.getFullYear();
  }

  private isDayBefore(timestamp1: number, timestamp2: number): boolean {
    const date1 = new Date(timestamp1);
    const date2 = new Date(timestamp2);

    if (date1.getFullYear() < date2.getFullYear()) {
      return true;
    } else if (date1.getFullYear() === date2.getFullYear()) {
      if (date1.getMonth() < date2.getMonth()) {
        return true;
      } else if (date1.getMonth() === date2.getMonth()) {
        return date1.getDate() < date2.getDate();
      }
    }

    return false;
  }
}
