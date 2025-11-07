// src/app/core/services/stats-calculation/stats-calculation.service.ts

import { Injectable } from '@angular/core';
import { Game } from 'src/app/core/models/game.model';
import { SeriesStats, SessionStats, Stats } from 'src/app/core/models/stats.model';
import { BowlingGameValidationService } from '../game-utils/bowling-game-validation.service';

const MAX_FRAMES = 10;

@Injectable({
  providedIn: 'root',
})
export class StatsCalculationService {
  constructor(private validationService: BowlingGameValidationService) {}

  private getRate(converted: number, missed: number): number {
    if (converted + missed === 0) {
      return 0;
    }
    return (converted / (converted + missed)) * 100;
  }

  calculateBowlingStats(gameHistory: Game[], seriesStats: SeriesStats): Stats | SessionStats {
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
    const highGame = Math.max(0, ...gameHistory.map((g) => g.totalScore));
    const lowGame = Math.min(300, ...gameHistory.map((g) => g.totalScore));
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
    const markPercentage = ((totalFrames - totalSparesMissed) / totalFrames) * 100 || 0;

    const msPerDay = 1000 * 60 * 60 * 24;
    const times = gameHistory.map((g) => new Date(g.date).getTime());
    const minT = times.length > 0 ? Math.min(...times) : 0;
    const maxT = times.length > 0 ? Math.max(...times) : 0;
    const totalDays = times.length > 0 ? Math.ceil((maxT - minT) / msPerDay) + 1 : 0;
    const weeks = totalDays / 7;
    const months = totalDays / 30;
    const distinctDays = new Set(gameHistory.map((g) => new Date(g.date).toDateString())).size;
    const averageGamesPerWeek = totalGames / weeks || 0;
    const averageGamesPerMonth = totalGames / months || 0;
    const averageSessionsPerWeek = distinctDays / weeks || 0;
    const averageSessionsPerMonth = distinctDays / months || 0;
    const averageGamesPerSession = totalGames / distinctDays || 0;

    // Strike-to-strike percentage
    const strikeToStrikePercentage = strikeOpportunities ? (strikeFollowUps / strikeOpportunities) * 100 : 0;

    // Pin-specific percentages
    const pocketHitPercentage = totalFirstBalls > 0 ? (pocketHits / totalFirstBalls) * 100 : 0;
    const singlePinSparePercentage = singlePinSpareOpportunities > 0 ? (singlePinSpares / singlePinSpareOpportunities) * 100 : 0;
    const multiPinSparePercentage = multiPinSpareOpportunities > 0 ? (multiPinSpares / multiPinSpareOpportunities) * 100 : 0;
    const nonSplitSparePercentage = nonSplitSpareOpportunities > 0 ? (nonSplitSpares / nonSplitSpareOpportunities) * 100 : 0;
    const splitConversionPercentage = splitOpportunities > 0 ? (splits / splitOpportunities) * 100 : 0;
    const makeableSplitPercentage = makeableSplitOpportunities > 0 ? (makeableSplits / makeableSplitOpportunities) * 100 : 0;

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
      // Inject series stats here
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

  calculateGamesForTargetAverage(targetAvg: number, stats: Stats, steps = 15): { score: number; gamesNeeded: number }[] {
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
}
