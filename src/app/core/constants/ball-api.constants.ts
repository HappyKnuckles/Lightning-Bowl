/** Paths on the ball API (relative to `environment.ballApiEndpoint`). */
export const BALL_API = {
  /** Searchable, filterable, sortable, paged list. */
  balls: 'balls',
  /** The whole catalog (optionally one weight) as a plain array, for the offline copy. */
  export: 'balls/export',
  /** Balls with a similar expected reaction to the given ball. */
  similar: (ballId: string) => ({ path: `balls/${encodeURIComponent(ballId)}/similar`, params: {} as Record<string, string> }),
  brands: 'brands',
  cores: 'cores',
  coverstocks: 'coverstocks',
} as const;

/** Page size for the balls list. */
export const BALL_PAGE_SIZE = 50;
