/// <reference lib="webworker" />

import { Game } from '../models/game.model';

addEventListener('message', ({ data }) => {
  const { type, payload } = data;

  switch (type) {
    case 'PROCESS_GAME_HISTORY': {
      const result = processGameHistory(payload.games);
      postMessage({ type: 'GAME_HISTORY_PROCESSED', payload: result });
      break;
    }
    case 'SORT_GAMES': {
      const sorted = sortGamesByDate(payload.games, payload.ascending);
      postMessage({ type: 'GAMES_SORTED', payload: sorted });
      break;
    }
    default:
      console.warn('Unknown worker message type:', type);
  }
});

function processGameHistory(gameHistory: Game[]): { games: Game[]; needsUpdate: boolean } {
  let needsUpdate = false;

  // Process each game
  gameHistory.forEach((game) => {
    const legacyGame = game as Game & { pattern?: string };
    
    // Convert legacy single pattern string to patterns array
    if (legacyGame.pattern && !game.patterns) {
      game.patterns = [legacyGame.pattern];
      delete legacyGame.pattern;
      needsUpdate = true;
    } else if (!game.patterns) {
      game.patterns = [];
      needsUpdate = true;
    }

    // Remove old pattern property if it still exists
    if (legacyGame.pattern !== undefined) {
      delete legacyGame.pattern;
      needsUpdate = true;
    }

    // Sort patterns and balls arrays alphabetically
    if (game.patterns && Array.isArray(game.patterns)) {
      const originalPatternsStr = JSON.stringify(game.patterns);
      game.patterns.sort();
      if (JSON.stringify(game.patterns) !== originalPatternsStr) {
        needsUpdate = true;
      }
    }
    if (game.balls && Array.isArray(game.balls)) {
      const originalBallsStr = JSON.stringify(game.balls);
      game.balls.sort();
      if (JSON.stringify(game.balls) !== originalBallsStr) {
        needsUpdate = true;
      }
    }
  });

  return { games: gameHistory, needsUpdate };
}

function sortGamesByDate(games: Game[], ascending: boolean): Game[] {
  return games.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return ascending ? dateA - dateB : dateB - dateA;
  });
}
