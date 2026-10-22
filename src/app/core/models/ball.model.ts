import type { components } from './generated/ball-api';

// Ball API types are generated from its OpenAPI spec (`npm run generate:ball-api`).
type ApiSchemas = components['schemas'];

/**
 * A ball (in one weight) as the ball API returns it. `first_seen_at` is
 * optional because balls saved before the ball API (e.g. in the arsenal) don't
 * have it; `position` is the app's own arsenal order.
 */
export type Ball = Omit<ApiSchemas['Ball'], 'first_seen_at'> & {
  first_seen_at?: string;
  position?: number;
};

export type Core = ApiSchemas['Core'];

export type Coverstock = ApiSchemas['Coverstock'];

export type Brand = ApiSchemas['Brand'];

export interface BallMetrics {
  hookScore: number;
  lengthScore: number;
  flareScore: number;
  hookLabel: string;
  lengthLabel: string;
  flareLabel: string;
  laneCondition: string;
  laneConditionColor: string;
}

export interface BallTraits {
  isPlastic: boolean;
  isUrethane: boolean;
  isSolid: boolean;
  isHybrid: boolean;
  isPearl: boolean;
  finishGrit: number | null;
  isPolished: boolean;
  rg: number;
  diff: number;
}

/** One page of balls from the ball API (Spring `PagedModel` shape). */
export type BallPage = Omit<ApiSchemas['BallPage'], 'content'> & { content: Ball[] };

/** Query-string values for `GET balls`; arrays become repeated parameters. */
export type BallQueryParams = Record<string, string | string[]>;
