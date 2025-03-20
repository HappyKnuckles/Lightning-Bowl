
export interface GameFilter {
  excludePractice: boolean;
  minScore: number;
  maxScore: number;
  isClean: boolean;
  isPerfect: boolean;
  leagues: string[];
  balls: string[];
  timeRange: TimeRange;
  startDate?: string;
  endDate?: string;
}

export interface BallFilter {
  brands: string[];
  coverstocks: string[];
  cores: string[];
  market: Market;
  coreType: CoreType;
  availability: string;
  releaseDate: string;
  minRg: number;
  maxRg: number;
  minDiff: number;
  maxDiff: number;
  inArsenal: boolean;
}

export enum TimeRange {
  TODAY = 0,
  WEEK = 1,
  MONTH = 2,
  QUARTER = 3,
  HALF = 4,
  YEAR = 5,
  ALL = 6,
}

export enum Market{
  ALL = 'all',
  US = 'us',
  INT = 'int',
}

export enum CoreType{
  ALL = 'all',
  ASYMMETRIC = 'asymmetric',
  SYMMETRIC = 'symmetric',
}