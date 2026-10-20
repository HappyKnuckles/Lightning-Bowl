export const STORAGE_PREFIX = {
  game: 'game',
  league: 'league',
  arsenal: 'arsenal',
  searchHistory: 'search_history',
} as const;

export const StorageKeys = {
  game: (gameId: string): string => `${STORAGE_PREFIX.game}${gameId}`,
  league: (leagueName: string): string => `${STORAGE_PREFIX.league}_${leagueName}`,
  arsenal: (ballId: string | number, coreWeight: string | number): string => `${STORAGE_PREFIX.arsenal}_${ballId}_${coreWeight}`,
  searchHistory: (context: string): string => `${STORAGE_PREFIX.searchHistory}_${context}`,
  /** Balls resolved from the ball API that aren't in the arsenal or favorites (see BallsStore.knownBalls). */
  ballCache: 'ball_cache',
} as const;
