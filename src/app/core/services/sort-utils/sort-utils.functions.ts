import { Game } from '../../models/game.model';
import { Ball } from '../../models/ball.model';
import { Pattern } from '../../models/pattern.model';

/**
 * Sort games by date (newest first)
 */
export function sortGamesByDateDesc(games: Game[]): Game[] {
  return [...games].sort((a, b) => b.date - a.date);
}

/**
 * Sort games by date (oldest first)
 */
export function sortGamesByDateAsc(games: Game[]): Game[] {
  return [...games].sort((a, b) => a.date - b.date);
}

/**
 * Sort game history by date (supports reverse parameter for compatibility)
 * @param games - Array of games to sort
 * @param reverse - If true, sorts oldest first; if false or undefined, sorts newest first
 */
export function sortGameHistoryByDate(games: Game[], reverse = false): Game[] {
  return reverse ? sortGamesByDateAsc(games) : sortGamesByDateDesc(games);
}

/**
 * Sort games by leagues, then by date within each league
 */
export function sortGamesByLeagues(games: Game[], reverse = false): Record<string, Game[]> {
  const gamesByLeague: Record<string, Game[]> = {};

  games.forEach((game) => {
    const leagueName = game.league || 'No League';
    if (!gamesByLeague[leagueName]) {
      gamesByLeague[leagueName] = [];
    }
    gamesByLeague[leagueName].push(game);
  });

  // Sort games within each league by date
  Object.keys(gamesByLeague).forEach((league) => {
    gamesByLeague[league] = sortGameHistoryByDate(gamesByLeague[league], reverse);
  });

  return gamesByLeague;
}

/**
 * Sort games by score (highest first)
 */
export function sortGamesByScoreDesc(games: Game[]): Game[] {
  return [...games].sort((a, b) => b.totalScore - a.totalScore);
}

/**
 * Sort games by score (lowest first)
 */
export function sortGamesByScoreAsc(games: Game[]): Game[] {
  return [...games].sort((a, b) => a.totalScore - b.totalScore);
}

/**
 * Sort balls alphabetically by name
 */
export function sortBallsByName(balls: Ball[]): Ball[] {
  return [...balls].sort((a, b) => {
    const nameA = a.ball_name?.toLowerCase() || '';
    const nameB = b.ball_name?.toLowerCase() || '';
    return nameA.localeCompare(nameB);
  });
}

/**
 * Sort balls by brand, then by name
 */
export function sortBallsByBrand(balls: Ball[]): Ball[] {
  return [...balls].sort((a, b) => {
    const brandA = a.brand_name?.toLowerCase() || '';
    const brandB = b.brand_name?.toLowerCase() || '';
    const brandCompare = brandA.localeCompare(brandB);

    if (brandCompare !== 0) {
      return brandCompare;
    }

    const nameA = a.ball_name?.toLowerCase() || '';
    const nameB = b.ball_name?.toLowerCase() || '';
    return nameA.localeCompare(nameB);
  });
}

/**
 * Sort patterns alphabetically by title
 */
export function sortPatternsByName(patterns: Pattern[]): Pattern[] {
  return [...patterns].sort((a, b) => {
    const nameA = a.title?.toLowerCase() || '';
    const nameB = b.title?.toLowerCase() || '';
    return nameA.localeCompare(nameB);
  });
}

/**
 * Sort patterns by volume (highest first)
 */
export function sortPatternsByVolume(patterns: Pattern[]): Pattern[] {
  return [...patterns].sort((a, b) => {
    const volA = parseFloat(a.volume) || 0;
    const volB = parseFloat(b.volume) || 0;
    return volB - volA;
  });
}

/**
 * Generic sort function for arrays
 */
export function sortBy<T>(items: T[], compareFn: (a: T, b: T) => number): T[] {
  return [...items].sort(compareFn);
}
