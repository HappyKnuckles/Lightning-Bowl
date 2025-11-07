import { computed, Injectable, Signal } from '@angular/core';
import { Game } from 'src/app/core/models/game.model';
import { BestBallStats, SessionStats, Stats } from 'src/app/core/models/stats.model';
import { PrevStats } from 'src/app/core/models/stats.model';
import { GameFilterService } from '../game-filter/game-filter.service';
import { UtilsService } from '../utils/utils.service';
import { StorageService } from '../storage/storage.service';
import { BowlingGameValidationService } from '../game-utils/bowling-game-validation.service';

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

  #bestBallStats: Signal<BestBallStats> = computed(() => {
    return this.calculateBestBallStats(this.gameFilterService.filteredGames());
  });
  #mostPlayedBallStats: Signal<BestBallStats> = computed(() => {
    return this.calculateMostPlayedBall(this.gameFilterService.filteredGames());
  });
  get mostPlayedBallStats() {
    return this.#mostPlayedBallStats;
  }

  get bestBallStats() {
    return this.#bestBallStats;
  }
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
    private validationService: BowlingGameValidationService,
  ) {}

  calculateBestBallStats(gameHistory: Game[]): BestBallStats {
    const allBallStats = this._calculateAllBallStats(gameHistory);
    const ballNames = Object.keys(allBallStats);
    const defaultBall: BestBallStats = { ballName: '', ballImage: '', ballAvg: 0, ballHighestGame: 0, ballLowestGame: 0, gameCount: 0 };

    if (ballNames.length === 0) {
      return defaultBall;
    }

    return ballNames.reduce((best, currentBallName) => {
      return allBallStats[currentBallName].ballAvg > best.ballAvg ? allBallStats[currentBallName] : best;
    }, defaultBall);
  }

  calculateMostPlayedBall(gameHistory: Game[]): BestBallStats {
    const allBallStats = this._calculateAllBallStats(gameHistory);
    const ballNames = Object.keys(allBallStats);
    const defaultBall: BestBallStats = { ballName: '', ballImage: '', ballAvg: 0, ballHighestGame: 0, ballLowestGame: 0, gameCount: 0 };

    if (ballNames.length === 0) {
      return defaultBall;
    }

    return ballNames.reduce((mostPlayed, currentBallName) => {
      return allBallStats[currentBallName].gameCount > mostPlayed.gameCount ? allBallStats[currentBallName] : mostPlayed;
    }, defaultBall);
  }

  calculateSeriesStats(gameHistory: Game[]): {
    average3SeriesScore: number;
    high3Series: number;
    average4SeriesScore: number;
    high4Series: number;
    average5SeriesScore: number;
    high5Series: number;
    average6SeriesScore: number;
    high6Series: number;
  } {
    const seriesScores: number[] = [];
    const series3Scores: number[] = [];
    const series4Scores: number[] = [];
    const series5Scores: number[] = [];
    const series6Scores: number[] = [];
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
      } else if (seriesGames.length === 6) {
        series6Scores.push(seriesScore);
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
    const average6SeriesScore = series6Scores.reduce((sum, score) => sum + score, 0) / series6Scores.length || 0;
    const high6Series = Math.max(0, ...series6Scores);

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
      average6SeriesScore,
      high6Series,
    };
  }

  calculateBowlingStats(gameHistory: Game[]): Stats | SessionStats {
    // Initialize counters
    let totalStrikes = 0;
    let totalSparesConverted = 0;
    let totalSparesMissed = 0;
    const pinCounts = Array(11).fill(0);
    const missedCounts = Array(11).fill(0);
    let firstThrowCount = 0;
    let perfectGameCount = 0;
    let cleanGameCount = 0;
    let longestStrikeStreak = 0;
    let currentStrikeStreak = 0;
    let longestOpenStreak = 0;
    let currentOpenStreak = 0;
    let dutch200Count = 0;
    let varipapa300Count = 0;
    let strikeoutCount = 0;
    let allSparesGameCount = 0;

    // Pin-specific counters (only for pin mode games)
    let pocketHits = 0;
    let totalFirstBalls = 0;
    let singlePinSpares = 0;
    let singlePinSpareOpportunities = 0;
    let multiPinSpares = 0;
    let multiPinSpareOpportunities = 0;
    let nonSplitSpares = 0;
    let nonSplitSpareOpportunities = 0;
    let splits = 0;
    let splitOpportunities = 0;
    let makeableSplits = 0;
    let makeableSplitOpportunities = 0;

    // Track most common leaves for "most left" statistics
    // const leaveMap = new Map<string, { pins: number[]; occurrences: number; pickups: number }>();

    // Streak counts for exactly n consecutive strikes (3 to 11)
    const streakCounts = Array(12).fill(0);
    const recordStrikeStreak = (len: number) => {
      if (len >= 3 && len <= 11) streakCounts[len]++;
    };

    // Strike-to-strike metrics
    let strikeOpportunities = 0;
    let strikeFollowUps = 0;
    let previousWasStrike = false;

    // Track date boundaries
    let previousGameDate: string | null = null;

    // Process each game
    gameHistory.forEach((game) => {
      if (game.isClean) {
        cleanGameCount++;
        if (game.isPerfect) perfectGameCount++;
      }
      const gameDate = new Date(game.date).toDateString();
      if (gameDate !== previousGameDate) {
        recordStrikeStreak(currentStrikeStreak);
        longestOpenStreak = Math.max(longestOpenStreak, currentOpenStreak);
        currentStrikeStreak = 0;
        currentOpenStreak = 0;
        previousGameDate = gameDate;
        previousWasStrike = false; // reset for strike-to-strike
      }

      let strikesInThisGame = 0;
      let isAllSpares = true;

      game.frames.forEach((frame: { throws: any[] }, idx: number) => {
        const throws = frame.throws.map((t: any) => parseInt(t.value, 10));
        firstThrowCount += throws[0] || 0;
        const throw1 = throws[0];
        const throw2 = throws.length > 1 ? throws[1] : undefined;
        const throw3 = throws.length > 2 ? throws[2] : undefined;

        const isStrike = throw1 === 10;
        const isSpare = !isStrike && throw2 !== undefined && throw1 + throw2 === 10;
        const isOpen = !isStrike && !isSpare;

        // Strike-to-strike tracking
        if (previousWasStrike) {
          strikeOpportunities++;
          if (isStrike) strikeFollowUps++;
        }
        previousWasStrike = isStrike;

        if (isStrike || !isSpare) isAllSpares = false;

        // Open streak
        if (isOpen) {
          currentOpenStreak++;
        } else {
          longestOpenStreak = Math.max(longestOpenStreak, currentOpenStreak);
          currentOpenStreak = 0;
        }

        // Strike streak
        if (isStrike) {
          totalStrikes++;
          currentStrikeStreak++;
          strikesInThisGame++;
          if (idx === MAX_FRAMES - 1 && throws.length >= 2) {
            if (throw2 === 10) {
              totalStrikes++;
              currentStrikeStreak++;
              strikesInThisGame++;
            }
            if (throw3 === 10) {
              totalStrikes++;
              currentStrikeStreak++;
              strikesInThisGame++;
            }
            if (throw1 === 10 && throw2 === 10 && throw3 === 10) strikeoutCount++;
          }
          if (currentStrikeStreak === 12 && strikesInThisGame < 12) varipapa300Count++;
        } else {
          recordStrikeStreak(currentStrikeStreak);
          currentStrikeStreak = 0;
          // Count strike on fill ball in 10th if previous was spare
          if (idx === MAX_FRAMES - 1 && isSpare && throw3 === 10) {
            totalStrikes++;
          }
        }
        longestStrikeStreak = Math.max(longestStrikeStreak, currentStrikeStreak);

        // Pin counts
        if (isSpare) {
          // Frame was a spare on the first two balls (e.g., 7 /)
          // This applies to frames 1-9 and the first two balls of the 10th if throw1 < 10.
          pinCounts[10 - throw1]++;
        } else if (isOpen) {
          // Frame was open on the first one or two balls (e.g., 7 2 or 7 -)
          // This applies to frames 1-9 and the first two balls of the 10th if throw1 < 10.
          missedCounts[10 - throw1]++;
        }
        // If `isStrike` is true, the above `isSpare` and `isOpen` are false.
        // We then need to check the 10th frame specifically for a spare/open opportunity
        // on the 2nd and 3rd balls if the first was a strike.
        if (isStrike && idx === MAX_FRAMES - 1) {
          // First ball was a strike in the 10th frame.
          // Check for spare/open on the 2nd and 3rd balls.
          if (throw2 !== undefined && throw2 < 10) {
            // Second ball was not a strike
            if (throw3 !== undefined) {
              if (throw2 + throw3 === 10) {
                // Spare on 2nd/3rd balls (e.g., X 7 /)
                pinCounts[10 - throw2]++;
              } else if (throw2 + throw3 < 10) {
                // Open on 2nd/3rd balls (e.g., X 7 2)
                missedCounts[10 - throw2]++;
              }
            } else {
              // Only two balls after initial strike, second was not a strike (e.g. X 7 -)
              missedCounts[10 - throw2]++;
            }
          }
          // If throw2 was also a strike (X X ...), then throw3 is a fill ball; no new spare/open opportunity here.
        }

        // Pin-specific statistics (only for pin mode games)
        if (game.isPinMode && frame.throws) {
          // Check for pocket hit on first throw (not 10th frame bonus balls)
          if (frame.throws[0] && idx < 9) {
            totalFirstBalls++;

            // Pocket hit is when pin 1 is knocked down AND either pin 2 or 3 is knocked down
            if (frame.throws[0].pinsLeftStanding) {
              const pinsLeft = frame.throws[0].pinsLeftStanding;
              const pin1Down = !pinsLeft.includes(1);
              const pin2Down = !pinsLeft.includes(2);
              const pin3Down = !pinsLeft.includes(3);

              if (pin1Down && (pin2Down || pin3Down)) {
                pocketHits++;
              }
            }
          }

          // Process first throw if not a strike
          if (!isStrike && frame.throws[0] && frame.throws[0].pinsLeftStanding) {
            const pinsLeft = frame.throws[0].pinsLeftStanding;
            const pinsLeftCount = pinsLeft.length;
            const isSplit = this.validationService.isSplit(pinsLeft);

            // // Track this leave for "most left" statistics
            // const key = [...pinsLeft].sort((a: number, b: number) => a - b).join(',');
            // if (!leaveMap.has(key)) {
            //   leaveMap.set(key, { pins: [...pinsLeft].sort((a: number, b: number) => a - b), occurrences: 0, pickups: 0 });
            // }
            // const leave = leaveMap.get(key)!;
            // leave.occurrences++;
            // if (isSpare) {
            //   leave.pickups++;
            // }

            // Count opportunity
            if (pinsLeftCount === 1) {
              singlePinSpareOpportunities++;
            } else if (pinsLeftCount > 1) {
              multiPinSpareOpportunities++;
              if (!isSplit) {
                nonSplitSpareOpportunities++;
              } else {
                splitOpportunities++;
                // Check if split is makeable
                if (this.validationService.isMakeableSplit(pinsLeft)) {
                  makeableSplitOpportunities++;
                }
              }
            }

            // Count conversion if spare
            if (isSpare) {
              if (pinsLeftCount === 1) {
                singlePinSpares++;
              } else if (pinsLeftCount > 1) {
                multiPinSpares++;
                if (!isSplit) {
                  nonSplitSpares++;
                } else {
                  splits++;
                  // Check if makeable split was converted
                  if (this.validationService.isMakeableSplit(pinsLeft)) {
                    makeableSplits++;
                  }
                }
              }
            }
          }

          // Process 10th frame additional throws
          if (idx === MAX_FRAMES - 1 && isStrike && throw2 !== undefined && throw2 < 10 && frame.throws[1] && frame.throws[1].pinsLeftStanding) {
            const pinsLeft = frame.throws[1].pinsLeftStanding;
            const pinsLeftCount = pinsLeft.length;
            const isSplit = this.validationService.isSplit(pinsLeft);

            // // Track this leave for "most left" statistics
            // const key = [...pinsLeft].sort((a: number, b: number) => a - b).join(',');
            // if (!leaveMap.has(key)) {
            //   leaveMap.set(key, { pins: [...pinsLeft].sort((a: number, b: number) => a - b), occurrences: 0, pickups: 0 });
            // }
            // const leave = leaveMap.get(key)!;
            // leave.occurrences++;
            // if (throw3 !== undefined && throw2 + throw3 === 10) {
            //   leave.pickups++;
            // }

            // Count opportunity
            if (pinsLeftCount === 1) {
              singlePinSpareOpportunities++;
            } else if (pinsLeftCount > 1) {
              multiPinSpareOpportunities++;
              if (!isSplit) {
                nonSplitSpareOpportunities++;
              } else {
                splitOpportunities++;
                // Check if split is makeable
                if (this.validationService.isMakeableSplit(pinsLeft)) {
                  makeableSplitOpportunities++;
                }
              }
            }

            // Count conversion if spare made
            if (throw3 !== undefined && throw2 + throw3 === 10) {
              if (pinsLeftCount === 1) {
                singlePinSpares++;
              } else if (pinsLeftCount > 1) {
                multiPinSpares++;
                if (!isSplit) {
                  nonSplitSpares++;
                } else {
                  splits++;
                  // Check if makeable split was converted
                  if (this.validationService.isMakeableSplit(pinsLeft)) {
                    makeableSplits++;
                  }
                }
              }
            }
          }
        }
      });

      if (isAllSpares) allSparesGameCount++;

      // Dutch 200 detection
      if (game.totalScore === 200) {
        let ok = true;
        game.frames.forEach((frame: { throws: any[] }, idx: number) => {
          const arr = frame.throws.map((t: any) => parseInt(t.value, 10));
          if (idx < 9) {
            const want = idx % 2 === 0 ? arr[0] === 10 : arr.length >= 2 && arr[0] !== 10 && arr[0] + arr[1] === 10;
            if (!want) ok = false;
          } else {
            if (arr.length < 3 || arr[0] + arr[1] !== 10 || arr[2] !== 10) ok = false;
          }
        });
        if (ok) dutch200Count++;
      }
    });

    // Finalize streaks
    recordStrikeStreak(currentStrikeStreak);
    longestOpenStreak = Math.max(longestOpenStreak, currentOpenStreak);

    // Compute spare totals
    for (let i = 1; i <= MAX_FRAMES; i++) {
      totalSparesMissed += missedCounts[i] || 0;
      totalSparesConverted += pinCounts[i] || 0;
    }

    // Core aggregated stats
    const totalPins = gameHistory.reduce((s, g) => s + g.totalScore, 0);
    const totalGames = gameHistory.length;
    const averageScore = totalPins / totalGames || 0;
    const highGame = Math.max(...gameHistory.map((g) => g.totalScore));
    const lowGame = Math.min(...gameHistory.map((g) => g.totalScore));
    const cleanGamePercentage = (cleanGameCount / totalGames) * 100 || 0;
    const totalFrames = totalGames * 10;
    const strikeChances = totalGames * 12;
    const averageStrikesPerGame = totalStrikes / totalGames || 0;
    const averageSparesPerGame = totalSparesConverted / totalGames || 0;
    const averageOpensPerGame = totalSparesMissed / totalGames || 0;
    const strikePercentage = (totalStrikes / strikeChances) * 100 || 0;
    const sparePercentage = (totalSparesConverted / totalFrames) * 100 || 0;
    const openPercentage = (totalSparesMissed / totalFrames) * 100 || 0;
    const averageFirstCount = firstThrowCount / totalFrames;
    const spareRates = pinCounts.map((c, i) => this.getRate(c, missedCounts[i]));
    const overallSpareRate = this.getRate(totalSparesConverted, totalSparesMissed);
    const spareConversionPercentage = (totalSparesConverted / (totalSparesConverted + totalSparesMissed)) * 100;
    const overallMissedRate = totalSparesMissed > 0 ? 100 - overallSpareRate : 0;
    const seriesStats = this.calculateSeriesStats(gameHistory);
    const markPercentage = ((totalFrames - totalSparesMissed) / totalFrames) * 100 || 0;
    // Frequency metrics
    const msPerDay = 1000 * 60 * 60 * 24;
    const times = gameHistory.map((g) => new Date(g.date).getTime());
    const minT = Math.min(...times),
      maxT = Math.max(...times);
    const totalDays = Math.ceil((maxT - minT) / msPerDay) + 1;
    const weeks = totalDays / 7,
      months = totalDays / 30;
    const distinctDays = new Set(gameHistory.map((g) => new Date(g.date).toDateString())).size;
    const averageGamesPerWeek = totalGames / weeks;
    const averageGamesPerMonth = totalGames / months;
    const averageSessionsPerWeek = distinctDays / weeks;
    const averageSessionsPerMonth = distinctDays / months;
    const averageGamesPerSession = totalGames / distinctDays;

    // Strike-to-strike percentage
    const strikeToStrikePercentage = strikeOpportunities ? (strikeFollowUps / strikeOpportunities) * 100 : 0;

    // Pin-specific percentages
    const pocketHitPercentage = totalFirstBalls > 0 ? (pocketHits / totalFirstBalls) * 100 : 0;
    const singlePinSparePercentage = singlePinSpareOpportunities > 0 ? (singlePinSpares / singlePinSpareOpportunities) * 100 : 0;
    const multiPinSparePercentage = multiPinSpareOpportunities > 0 ? (multiPinSpares / multiPinSpareOpportunities) * 100 : 0;
    const nonSplitSparePercentage = nonSplitSpareOpportunities > 0 ? (nonSplitSpares / nonSplitSpareOpportunities) * 100 : 0;
    const splitConversionPercentage = splitOpportunities > 0 ? (splits / splitOpportunities) * 100 : 0;
    const makeableSplitPercentage = makeableSplitOpportunities > 0 ? (makeableSplits / makeableSplitOpportunities) * 100 : 0;

    // // Calculate "most left" statistics from leaveMap
    // const leavesArray: LeaveStats[] = Array.from(leaveMap.values()).map((leave) => ({
    //   ...leave,
    //   pickupPercentage: leave.occurrences > 0 ? (leave.pickups / leave.occurrences) * 100 : 0,
    // }));

    // // Most left single pin (most common single pin leave)
    // const singlePinLeaves = leavesArray.filter((leave) => leave.pins.length === 1);
    // const mostLeftSinglePin = singlePinLeaves.length > 0
    //   ? singlePinLeaves.sort((a, b) => b.occurrences - a.occurrences)[0]
    //   : undefined;

    // // Most left spare (most common spare opportunity that was left, regardless of conversion)
    // const mostLeftSpare = leavesArray.length > 0
    //   ? leavesArray.sort((a, b) => b.occurrences - a.occurrences)[0]
    //   : undefined;

    // // Most hit spare (spare with highest conversion rate among those with significant attempts)
    // const significantLeaves = leavesArray.filter((leave) => leave.occurrences >= 3); // At least 3 attempts
    // const mostHitSpare = significantLeaves.length > 0
    //   ? significantLeaves.sort((a, b) => b.pickupPercentage - a.pickupPercentage)[0]
    //   : undefined;

    return {
      totalStrikes,
      totalSpares: totalSparesConverted,
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
      lowGame,
      averageStrikesPerGame,
      averageSparesPerGame,
      averageOpensPerGame,
      markPercentage,
      strikePercentage,
      sparePercentage,
      openPercentage,
      averageFirstCount,
      spareRates,
      overallSpareRate,
      totalPins,
      overallMissedRate,
      spareConversionPercentage,
      longestStrikeStreak,
      longestOpenStreak,
      dutch200Count,
      varipapa300Count,
      strikeoutCount,
      allSparesGameCount,
      turkeyCount: streakCounts[3],
      bagger4Count: streakCounts[4],
      bagger5Count: streakCounts[5],
      bagger6Count: streakCounts[6],
      bagger7Count: streakCounts[7],
      bagger8Count: streakCounts[8],
      bagger9Count: streakCounts[9],
      bagger10Count: streakCounts[10],
      bagger11Count: streakCounts[11],
      streakCounts,
      average3SeriesScore: seriesStats.average3SeriesScore,
      high3Series: seriesStats.high3Series,
      average4SeriesScore: seriesStats.average4SeriesScore,
      high4Series: seriesStats.high4Series,
      average5SeriesScore: seriesStats.average5SeriesScore,
      high5Series: seriesStats.high5Series,
      average6SeriesScore: seriesStats.average6SeriesScore,
      high6Series: seriesStats.high6Series,
      averageGamesPerWeek,
      averageGamesPerMonth,
      averageSessionsPerWeek,
      averageSessionsPerMonth,
      averageGamesPerSession,
      strikeToStrikePercentage,
      // Pin-specific stats
      pocketHits,
      totalFirstBalls,
      pocketHitPercentage,
      singlePinSpares,
      singlePinSpareOpportunities,
      multiPinSpares,
      multiPinSpareOpportunities,
      nonSplitSpares,
      nonSplitSpareOpportunities,
      splits,
      splitOpportunities,
      singlePinSparePercentage,
      multiPinSparePercentage,
      nonSplitSparePercentage,
      splitConversionPercentage,
      makeableSplits,
      makeableSplitOpportunities,
      makeableSplitPercentage,
    };
  }

  calculateGamesForTargetAverage(targetAvg: number, steps = 15): { score: number; gamesNeeded: number }[] {
    const stats = this.overallStats();
    const N0 = stats.totalGames;
    const A0 = stats.averageScore;
    const MAX_SCORE = 300;

    if (N0 === 0 || targetAvg <= A0) {
      return [{ score: Math.ceil(A0 / 5) * 5, gamesNeeded: 0 }];
    }

    const startScore = Math.ceil(A0 / 5) * 5;
    const allScores: number[] = [];
    for (let s = startScore; s <= MAX_SCORE; s += 5) {
      allScores.push(s);
    }

    const L = allScores.length;
    const results: { score: number; gamesNeeded: number }[] = [];
    for (let j = 0; j < steps; j++) {
      const idx = Math.round((j * (L - 1)) / (steps - 1));
      const S = allScores[idx];

      let gamesNeeded = Infinity;
      if (S > targetAvg) {
        const k = (N0 * (targetAvg - A0)) / (S - targetAvg);
        gamesNeeded = k > 0 ? Math.ceil(k) : Infinity;
      }

      if (isFinite(gamesNeeded)) {
        results.push({ score: S, gamesNeeded });
      }
    }

    return results;
  }

  private mapStatsToPrevStats(stats: Stats): PrevStats {
    return {
      markPercentage: stats.markPercentage,
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
      strikeToStrikePercentage: stats.strikeToStrikePercentage,
      overallSpareRate: stats.overallSpareRate,
      spareRates: stats.spareRates,
      overallMissedRate: stats.overallMissedRate,
      pocketHitPercentage: stats.pocketHitPercentage,
      singlePinSparePercentage: stats.singlePinSparePercentage,
      multiPinSparePercentage: stats.multiPinSparePercentage,
      nonSplitSparePercentage: stats.nonSplitSparePercentage,
      splitConversionPercentage: stats.splitConversionPercentage,
      makeableSplitPercentage: stats.makeableSplitPercentage,
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
      markPercentage: 0,
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
      strikeToStrikePercentage: 0,
      overallSpareRate: 0,
      overallMissedRate: 0,
      pocketHitPercentage: 0,
      singlePinSparePercentage: 0,
      multiPinSparePercentage: 0,
      nonSplitSparePercentage: 0,
      splitConversionPercentage: 0,
      makeableSplitPercentage: 0,
      average3SeriesScore: 0,
      average4SeriesScore: 0,
      average5SeriesScore: 0,
      high3Series: 0,
      high4Series: 0,
      high5Series: 0,
      spareRates: Array(11).fill(0),
    };
  }

  private _calculateAllBallStats(gameHistory: Game[]): Record<string, BestBallStats> {
    const gamesWithBalls = gameHistory.filter((game) => game.balls && game.balls.length > 0);
    const tempStats: Record<
      string,
      { totalScore: number; gameCount: number; highestGame: number; lowestGame: number; cleanGames: number; totalStrikes: number }
    > = {};

    gamesWithBalls.forEach((game) => {
      const uniqueBallsInGame = new Set(game.balls);

      const isCleanGame = game.frames.every((frame: { throws: any[] }) => {
        const totalPinsInFrame = frame.throws.reduce((sum: number, throwData: { value: number }) => sum + throwData.value, 0);
        return totalPinsInFrame >= 10;
      });

      let totalStrikesInGame = 0;
      game.frames.forEach((frame: { throws: any[] }, index: number) => {
        if (index < 9) {
          if (frame.throws[0]?.value === 10) {
            totalStrikesInGame++;
          }
        } else if (index === 9) {
          frame.throws.forEach((throwData: { value: number }) => {
            if (throwData.value === 10) {
              totalStrikesInGame++;
            }
          });
        }
      });

      uniqueBallsInGame.forEach((ballName) => {
        if (!tempStats[ballName]) {
          tempStats[ballName] = { totalScore: 0, gameCount: 0, highestGame: 0, lowestGame: 301, cleanGames: 0, totalStrikes: 0 };
        }
        const stats = tempStats[ballName];
        stats.totalScore += game.totalScore;
        stats.gameCount++;
        stats.totalStrikes += totalStrikesInGame;
        if (game.totalScore > stats.highestGame) {
          stats.highestGame = game.totalScore;
        }
        if (game.totalScore < stats.lowestGame) {
          stats.lowestGame = game.totalScore;
        }
        if (isCleanGame) {
          stats.cleanGames++;
        }
      });
    });

    const finalStats: Record<string, BestBallStats> = {};
    for (const ballName in tempStats) {
      const stats = tempStats[ballName];
      const ballImage = this.storageService.allBalls().find((b) => b.ball_name === ballName)?.ball_image || '';
      const totalPossibleStrikes = stats.gameCount * 12; // 12 possible strikes per game
      const strikeRate = totalPossibleStrikes > 0 ? Math.round((stats.totalStrikes / totalPossibleStrikes) * 100) : 0;

      finalStats[ballName] = {
        ballName: ballName,
        ballImage: ballImage,
        ballAvg: stats.gameCount > 0 ? Math.round(stats.totalScore / stats.gameCount) : 0,
        ballHighestGame: stats.highestGame,
        ballLowestGame: stats.lowestGame === 301 ? 0 : stats.lowestGame,
        gameCount: stats.gameCount,
        cleanGameCount: stats.cleanGames,
        strikeRate: strikeRate,
      };
    }
    return finalStats;
  }

  private getRate(converted: number, missed: number): number {
    if (converted + missed === 0) {
      return 0;
    }
    return (converted / (converted + missed)) * 100;
  }
}
