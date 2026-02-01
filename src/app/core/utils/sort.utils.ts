import { Game } from 'src/app/core/models/game.model';

/**
 * Sort game history by date
 * @param gameHistory Array of games to sort
 * @param ascending Sort in ascending order (default: false for descending)
 * @returns Sorted array of games
 */
export function sortGameHistoryByDate(gameHistory: Game[], ascending = false): Game[] {
  return gameHistory.sort((a: { date: number }, b: { date: number }) => {
    if (ascending) {
      return a.date - b.date;
    } else return b.date - a.date;
  });
}

/**
 * Sort games by leagues
 * @param games Array of games to sort by league
 * @param includePractice Include practice games (default: false)
 * @returns Games grouped by league with leagues sorted by number of games
 */
export function sortGamesByLeagues(games: Game[], includePractice?: boolean): Record<string, Game[]> {
  const gamesByLeague = games.reduce((acc: Record<string, Game[]>, game: Game) => {
    const league = game.league || (includePractice ? 'Practice' : '');
    if (!league) return acc;
    if (!acc[league]) {
      acc[league] = [];
    }
    acc[league].push(game);
    return acc;
  }, {});

  const sortedEntries = Object.entries(gamesByLeague).sort((a, b) => b[1].length - a[1].length);

  return sortedEntries.reduce((acc: Record<string, Game[]>, [league, games]) => {
    acc[league] = games;
    return acc;
  }, {});
}
