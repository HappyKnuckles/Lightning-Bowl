/// <reference lib="webworker" />

import { Game } from '../models/game.model';
import { Stats, SessionStats } from '../models/stats.model';

const MAX_FRAMES = 10;

addEventListener('message', ({ data }) => {
  const { type, payload } = data;

  switch (type) {
    case 'CALCULATE_STATS': {
      const stats = calculateBowlingStats(payload.games);
      postMessage({ type: 'STATS_RESULT', payload: stats });
      break;
    }
    case 'CALCULATE_BALL_STATS': {
      const ballStats = calculateAllBallStats(payload.games);
      postMessage({ type: 'BALL_STATS_RESULT', payload: ballStats });
      break;
    }
    default:
      console.warn('Unknown worker message type:', type);
  }
});

function calculateBowlingStats(gameHistory: Game[]): Stats | SessionStats {
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
      previousWasStrike = false;
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
        if (idx === MAX_FRAMES - 1 && isSpare && throw3 === 10) {
          totalStrikes++;
        }
      }
      longestStrikeStreak = Math.max(longestStrikeStreak, currentStrikeStreak);

      // Pin counts
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
          }
        }
      }

      // Spare tracking
      if (isSpare) {
        totalSparesConverted++;
      } else if (!isStrike && throw2 !== undefined) {
        totalSparesMissed++;
      }
    });

    if (isAllSpares) allSparesGameCount++;
    if (strikesInThisGame >= 6) {
      const evenStrikes = game.frames.filter((_, i) => i % 2 === 0 && i < 9).every((f: any) => f.throws[0]?.value === 10);
      const oddStrikes = game.frames.filter((_, i) => i % 2 === 1 && i < 9).every((f: any) => f.throws[0]?.value === 10);
      if (evenStrikes || oddStrikes) dutch200Count++;
    }
  });

  recordStrikeStreak(currentStrikeStreak);
  longestOpenStreak = Math.max(longestOpenStreak, currentOpenStreak);

  const totalGames = gameHistory.length;
  const totalPins = gameHistory.reduce((sum, game) => sum + game.score, 0);
  const averageScore = totalPins / totalGames || 0;
  const highGame = Math.max(0, ...gameHistory.map((g) => g.score));
  const lowGame = totalGames > 0 ? Math.min(...gameHistory.map((g) => g.score)) : 0;

  const spareConversionRate = totalSparesConverted / (totalSparesConverted + totalSparesMissed) || 0;
  const firstBallAverage = firstThrowCount / (totalGames * MAX_FRAMES) || 0;
  const strikeToStrikeRate = strikeFollowUps / strikeOpportunities || 0;

  return {
    totalGames,
    totalPins,
    totalStrikes,
    totalSparesConverted,
    totalSparesMissed,
    averageScore,
    highGame,
    lowGame,
    perfectGameCount,
    cleanGameCount,
    longestStrikeStreak,
    longestOpenStreak,
    pinCounts,
    missedCounts,
    spareConversionRate,
    firstBallAverage,
    dutch200Count,
    varipapa300Count,
    strikeoutCount,
    allSparesGameCount,
    streakCounts,
    strikeToStrikeRate,
  };
}

function calculateAllBallStats(gameHistory: Game[]): Record<string, any> {
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

      tempStats[ballName].totalScore += game.score;
      tempStats[ballName].gameCount++;
      tempStats[ballName].highestGame = Math.max(tempStats[ballName].highestGame, game.score);
      tempStats[ballName].lowestGame = Math.min(tempStats[ballName].lowestGame, game.score);
      if (isCleanGame) {
        tempStats[ballName].cleanGames++;
      }
      tempStats[ballName].totalStrikes += totalStrikesInGame;
    });
  });

  const allBallStats: Record<string, any> = {};
  Object.keys(tempStats).forEach((ballName) => {
    const stats = tempStats[ballName];
    allBallStats[ballName] = {
      ballAvg: stats.totalScore / stats.gameCount,
      ballHighestGame: stats.highestGame,
      ballLowestGame: stats.lowestGame === 301 ? 0 : stats.lowestGame,
      gameCount: stats.gameCount,
      cleanGames: stats.cleanGames,
      avgStrikes: stats.totalStrikes / stats.gameCount,
    };
  });

  return allBallStats;
}
