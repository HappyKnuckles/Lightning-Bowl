import { Injectable } from '@angular/core';
import { Game } from 'src/app/core/models/game.model';
import { SeriesStats, SessionStats, Stats, SinglePinLeaveStats, DisplayLeaveStat } from 'src/app/core/models/stats.model';
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

  private getPickupColor(conversionRate: number): string {
    if (conversionRate > 95) return '#4faeff';
    if (conversionRate > 75) return '#008000';
    if (conversionRate > 50) return '#809300';
    if (conversionRate > 33) return '#FFA500';
    return '#FF0000';
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

    const leaveMap = new Map<string, { pins: number[]; occurrences: number; pickups: number }>();
    const singlePinLeaveMap = new Map<number, { pin: number; occurrences: number; pickups: number }>();

    const streakCounts = Array(12).fill(0);
    const recordStrikeStreak = (len: number) => {
      if (len >= 3 && len <= 11) streakCounts[len]++;
    };

    let strikeOpportunities = 0;
    let strikeFollowUps = 0;
    let previousWasStrike = false;
    let previousGameDate: string | null = null;

    const processLeave = (firstThrow: any, spareThrow: any) => {
      if (firstThrow && firstThrow.value !== 10 && firstThrow.pinsLeftStanding) {
        const pinsLeft = firstThrow.pinsLeftStanding.sort((a: number, b: number) => a - b);
        if (pinsLeft.length === 0) return;
        const key = pinsLeft.join(',');

        if (!leaveMap.has(key)) {
          leaveMap.set(key, { pins: pinsLeft, occurrences: 0, pickups: 0 });
        }
        const leave = leaveMap.get(key)!;
        leave.occurrences++;

        if (pinsLeft.length === 1) {
          const pin = pinsLeft[0];
          if (!singlePinLeaveMap.has(pin)) {
            singlePinLeaveMap.set(pin, { pin, occurrences: 0, pickups: 0 });
          }
          const singlePinLeave = singlePinLeaveMap.get(pin)!;
          singlePinLeave.occurrences++;
          if (spareThrow && firstThrow.value + spareThrow.value === 10) {
            singlePinLeave.pickups++;
          }
        }

        if (spareThrow && firstThrow.value + spareThrow.value === 10) {
          leave.pickups++;
        }
      }
    };

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
        previousWasStrike = false;
      }

      let strikesInThisGame = 0;
      let isAllSpares = true;

      game.frames.forEach((frame: any, idx: number) => {
        const throws = (frame.throws || []).map((t: any) => parseInt(t.value, 10));
        firstThrowCount += throws[0] || 0;
        const throw1 = throws[0];
        const throw2 = throws.length > 1 ? throws[1] : undefined;
        const throw3 = throws.length > 2 ? throws[2] : undefined;

        const isStrike = throw1 === 10;
        const isSpare = !isStrike && throw2 !== undefined && throw1 + throw2 === 10;
        const isOpen = !isStrike && !isSpare;

        if (previousWasStrike) {
          strikeOpportunities++;
          if (isStrike) strikeFollowUps++;
        }
        previousWasStrike = isStrike;

        if (isStrike || !isSpare) isAllSpares = false;

        if (isOpen) {
          currentOpenStreak++;
        } else {
          longestOpenStreak = Math.max(longestOpenStreak, currentOpenStreak);
          currentOpenStreak = 0;
        }

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
          if (idx === MAX_FRAMES - 1 && isSpare && throw3 === 10) {
            totalStrikes++;
          }
        }
        longestStrikeStreak = Math.max(longestStrikeStreak, currentStrikeStreak);

        if (isSpare) {
          pinCounts[10 - throw1]++;
        } else if (isOpen) {
          missedCounts[10 - throw1]++;
        }

        if (isStrike && idx === MAX_FRAMES - 1) {
          if (throw2 !== undefined && throw2 < 10) {
            if (throw3 !== undefined) {
              if (throw2 + throw3 === 10) {
                pinCounts[10 - throw2]++;
              } else if (throw2 + throw3 < 10) {
                missedCounts[10 - throw2]++;
              }
            } else {
              missedCounts[10 - throw2]++;
            }
          }
        }

        if (game.isPinMode && frame.throws) {
          processLeave(frame.throws[0], frame.throws[1]);
          if (idx === 9 && isStrike) {
            processLeave(frame.throws[1], frame.throws[2]);
          }

          if (frame.throws[0] && idx < 9) {
            totalFirstBalls++;
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

          if (!isStrike && frame.throws[0] && frame.throws[0].pinsLeftStanding) {
            const pinsLeft = frame.throws[0].pinsLeftStanding;
            const pinsLeftCount = pinsLeft.length;
            const isSplit = this.validationService.isSplit(pinsLeft);
            if (pinsLeftCount === 1) singlePinSpareOpportunities++;
            else if (pinsLeftCount > 1) {
              multiPinSpareOpportunities++;
              if (!isSplit) nonSplitSpareOpportunities++;
              else {
                splitOpportunities++;
                if (this.validationService.isMakeableSplit(pinsLeft)) makeableSplitOpportunities++;
              }
            }
            if (isSpare) {
              if (pinsLeftCount === 1) singlePinSpares++;
              else if (pinsLeftCount > 1) {
                multiPinSpares++;
                if (!isSplit) nonSplitSpares++;
                else {
                  splits++;
                  if (this.validationService.isMakeableSplit(pinsLeft)) makeableSplits++;
                }
              }
            }
          }

          if (idx === MAX_FRAMES - 1 && isStrike && throw2 !== undefined && throw2 < 10 && frame.throws[1] && frame.throws[1].pinsLeftStanding) {
            const pinsLeft = frame.throws[1].pinsLeftStanding;
            const pinsLeftCount = pinsLeft.length;
            const isSplit = this.validationService.isSplit(pinsLeft);
            if (pinsLeftCount === 1) singlePinSpareOpportunities++;
            else if (pinsLeftCount > 1) {
              multiPinSpareOpportunities++;
              if (!isSplit) nonSplitSpareOpportunities++;
              else {
                splitOpportunities++;
                if (this.validationService.isMakeableSplit(pinsLeft)) makeableSplitOpportunities++;
              }
            }
            if (throw3 !== undefined && throw2 + throw3 === 10) {
              if (pinsLeftCount === 1) singlePinSpares++;
              else if (pinsLeftCount > 1) {
                multiPinSpares++;
                if (!isSplit) nonSplitSpares++;
                else {
                  splits++;
                  if (this.validationService.isMakeableSplit(pinsLeft)) makeableSplits++;
                }
              }
            }
          }
        }
      });

      if (isAllSpares) allSparesGameCount++;

      if (game.totalScore === 200) {
        let ok = true;
        game.frames.forEach((frame: any, idx: number) => {
          const arr = (frame.throws || []).map((t: any) => parseInt(t.value, 10));
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

    recordStrikeStreak(currentStrikeStreak);
    longestOpenStreak = Math.max(longestOpenStreak, currentOpenStreak);

    for (let i = 1; i <= MAX_FRAMES; i++) {
      totalSparesMissed += missedCounts[i] || 0;
      totalSparesConverted += pinCounts[i] || 0;
    }

    const mostCommonLeaves: DisplayLeaveStat[] = Array.from(leaveMap.values())
      .map((leave) => {
        const pickupPercentage = leave.occurrences > 0 ? (leave.pickups / leave.occurrences) * 100 : 0;
        return {
          ...leave,
          primaryMetricLabel: 'Pickups',
          primaryMetricValue: leave.pickups,
          secondaryMetricLabel: 'Pickup %',
          secondaryMetricValue: `${pickupPercentage.toFixed(0)}%`,
          secondaryMetricColor: this.getPickupColor(pickupPercentage),
        };
      })
      .sort((a, b) => b.occurrences - a.occurrences)
      .slice(0, 10);

    const mostHitSpares: DisplayLeaveStat[] = [];
    const mostMissedSpares: DisplayLeaveStat[] = [];

    const singlePinLeaves: SinglePinLeaveStats[] = Array.from(singlePinLeaveMap.values()).map((l) => ({
      ...l,
      pickupPercentage: l.occurrences > 0 ? (l.pickups / l.occurrences) * 100 : 0,
    }));

    const multiPinLeaves: { key: string; pins: number[]; occurrences: number; pickups: number; pickupPercentage: number }[] = [];
    Array.from(leaveMap.entries()).forEach(([key, leave]) => {
      if (leave.pins.length <= 1) return;
      multiPinLeaves.push({
        key,
        pins: leave.pins.slice().sort((a, b) => a - b),
        occurrences: leave.occurrences,
        pickups: leave.pickups,
        pickupPercentage: leave.occurrences > 0 ? (leave.pickups / leave.occurrences) * 100 : 0,
      });
    });

    const wilsonLowerBound = (successes: number, trials: number, z = 1.96) => {
      if (trials === 0) return 0;
      const phat = successes / trials;
      const z2 = z * z;
      const denom = 1 + z2 / trials;
      const centre = phat + z2 / (2 * trials);
      const margin = z * Math.sqrt((phat * (1 - phat) + z2 / (4 * trials)) / trials);
      return (centre - margin) / denom;
    };
    const EPS = 1e-12;

    const selectTopHitsByWilson = (leaves: { occurrences: number; pickups: number; pin?: number; pins?: number[]; pickupPercentage?: number }[]) => {
      if (!leaves || leaves.length === 0) return [];
      const scored = leaves.map((l) => {
        const n = l.occurrences;
        const k = l.pickups;
        const score = wilsonLowerBound(k, n);
        const misses = n - k;
        return { l, score, n, k, misses };
      });

      const maxScore = Math.max(...scored.map((s) => s.score));
      let candidates = scored.filter((s) => Math.abs(s.score - maxScore) <= EPS);

      if (candidates.length > 1) {
        const maxOcc = Math.max(...candidates.map((c) => c.n));
        candidates = candidates.filter((c) => c.n === maxOcc);
      }
      if (candidates.length > 1) {
        const minMisses = Math.min(...candidates.map((c) => c.misses));
        candidates = candidates.filter((c) => c.misses === minMisses);
      }
      return candidates.map((c) => c.l);
    };

    const selectTopMissesByWilson = (
      leaves: { occurrences: number; pickups: number; pin?: number; pins?: number[]; pickupPercentage?: number }[],
    ) => {
      if (!leaves || leaves.length === 0) return [];
      const scored = leaves.map((l) => {
        const n = l.occurrences;
        const misses = n - l.pickups;
        const score = wilsonLowerBound(misses, n);
        return { l, score, n, pickups: l.pickups, misses };
      });

      const maxScore = Math.max(...scored.map((s) => s.score));
      let candidates = scored.filter((s) => Math.abs(s.score - maxScore) <= EPS);

      if (candidates.length > 1) {
        const maxOcc = Math.max(...candidates.map((c) => c.n));
        candidates = candidates.filter((c) => c.n === maxOcc);
      }
      if (candidates.length > 1) {
        const minPickups = Math.min(...candidates.map((c) => c.pickups));
        candidates = candidates.filter((c) => c.pickups === minPickups);
      }
      return candidates.map((c) => c.l);
    };

    if (singlePinLeaves.length > 0) {
      const singleTopHits = selectTopHitsByWilson(singlePinLeaves).filter((s) => s.occurrences > 0 && s.pickups > 0);
      singleTopHits.forEach((s) =>
        mostHitSpares.push({
          pins: [s.pin!],
          occurrences: s.occurrences,
          primaryMetricLabel: 'Pickups',
          primaryMetricValue: s.pickups,
          secondaryMetricLabel: 'Pickup %',
          secondaryMetricValue: `${((s.pickups / s.occurrences) * 100).toFixed(0)}%`,
          secondaryMetricColor: this.getPickupColor(s.occurrences > 0 ? (s.pickups / s.occurrences) * 100 : 0),
        }),
      );

      const singleTopMisses = selectTopMissesByWilson(singlePinLeaves).filter((s) => s.occurrences > 0 && s.occurrences - s.pickups > 0);
      singleTopMisses.forEach((s) => {
        const misses = s.occurrences - s.pickups;
        mostMissedSpares.push({
          pins: [s.pin!],
          occurrences: s.occurrences,
          primaryMetricLabel: 'Misses',
          primaryMetricValue: misses,
          secondaryMetricLabel: 'Miss Rate',
          secondaryMetricValue: `${((misses / s.occurrences) * 100).toFixed(0)}%`,
          secondaryMetricColor: this.getPickupColor(s.occurrences > 0 ? (s.pickups / s.occurrences) * 100 : 0),
        });
      });
    }

    if (multiPinLeaves.length > 0) {
      const multiTopHits = selectTopHitsByWilson(multiPinLeaves).filter((s) => s.occurrences > 0 && s.pickups > 0);
      multiTopHits.forEach((s) =>
        mostHitSpares.push({
          pins: s.pins!,
          occurrences: s.occurrences,
          primaryMetricLabel: 'Pickups',
          primaryMetricValue: s.pickups,
          secondaryMetricLabel: 'Pickup %',
          secondaryMetricValue: `${((s.pickups / s.occurrences) * 100).toFixed(0)}%`,
          secondaryMetricColor: this.getPickupColor(s.occurrences > 0 ? (s.pickups / s.occurrences) * 100 : 0),
        }),
      );

      const multiTopMisses = selectTopMissesByWilson(multiPinLeaves).filter((s) => s.occurrences > 0 && s.occurrences - s.pickups > 0);
      multiTopMisses.forEach((s) => {
        const misses = s.occurrences - s.pickups;
        mostMissedSpares.push({
          pins: s.pins!,
          occurrences: s.occurrences,
          primaryMetricLabel: 'Misses',
          primaryMetricValue: misses,
          secondaryMetricLabel: 'Miss Rate',
          secondaryMetricValue: `${((misses / s.occurrences) * 100).toFixed(0)}%`,
          secondaryMetricColor: this.getPickupColor(s.occurrences > 0 ? (s.pickups / s.occurrences) * 100 : 0),
        });
      });
    }

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

    const strikeToStrikePercentage = strikeOpportunities ? (strikeFollowUps / strikeOpportunities) * 100 : 0;

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
      mostCommonLeaves,
      mostHitSpares,
      mostMissedSpares,
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
