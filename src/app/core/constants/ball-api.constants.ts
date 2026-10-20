/**
 * Paths on the ball API (relative to `environment.ballApiEndpoint`).
 *
 * Points at the bowwwl proxy's query API (lightningbowl-bowwwl-proxy#27), which
 * names two endpoints differently from the standalone ball API.
 */
export const BALL_API = {
  /** Searchable, filterable, sortable, paged list. */
  balls: 'balls',
  /** One ball in all its weights (or one weight with `weight`). */
  ball: (ballId: string) => ({ path: 'ball', params: { id: ballId } as Record<string, string> }),
  /** Balls with a similar expected reaction to the given ball. */
  similar: (ballId: string) => ({ path: 'similar-balls', params: { ballId } as Record<string, string> }),
  brands: 'brands',
  cores: 'cores',
  coverstocks: 'coverstocks',
} as const;

/** Page size for the balls list. */
export const BALL_PAGE_SIZE = 50;

/** Ids or names per lookup request (each can match up to five weights). */
export const BALL_LOOKUP_CHUNK = 40;
