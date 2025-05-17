export interface GameFilter {
  excludePractice: boolean;
  minScore: number;
  maxScore: number;
  isClean: boolean;
  isPerfect: boolean;
  leagues: string[];
  balls: string[];
  patterns: string[];
  timeRange: TimeRange;
  startDate?: string;
  endDate?: string;
}

export interface BallFilter {
  brands: string[];
  coverstocks: string[];
  coverstockTypes: CoverstockType[];
  cores: string[];
  market: Market;
  weight: string;
  coreType: CoreType;
  availability: boolean;
  releaseDate: string;
  minRg: number;
  maxRg: number;
  minDiff: number;
  maxDiff: number;
  inArsenal: boolean;
}

export interface PatternFilter {
  minVolume: number;
  maxVolume: number;
  minLength: number;
  maxLength: number;
  category: string[];
  minRatio: number;
  maxRatio: number;
  minPump: number;
  maxPump: number;
  minForwardVolume: number;
  maxForwardVolume: number;
  minReverseVolume: number;
  maxReverseVolume: number;
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

export enum Market {
  ALL = 'All',
  US = 'US',
  INT = 'Overseas',
}

export enum CoverstockType {
  HYBRID_REACTIVE = 'Hybrid Reactive',
  PEARL_REACTIVE = 'Pearl Reactive',
  SOLID_REACTIVE = 'Solid Reactive',
  PARTICLE_REACTIVE = 'Particle Reactive',
  URETHANE_PEARL = 'Urethane Pearl',
  POLYESTER = 'Polyester',
  URETHANE_SOLID = 'Urethane Solid',
  NOT_URETHANE = 'Not Urethane',
  MICROCELL_POLYMER = 'Microcell Polymer',
  URETHANE_HYBRID = 'Urethane Hybrid',
  PARTICLE_PEARL_REACTIVE = 'Particle/Pearl Reactive',
  URETHANE_PARTICLE = 'Urethane Particle',
  RUBBER = 'Rubber',
}

export enum CoreType {
  ALL = 'All',
  ASYMMETRIC = 'Asymmetric',
  SYMMETRIC = 'Symmetric',
}

// export enum Availability{
//   ALL = 'all',
//   AVAILABLE = 'available',
//   DISCONTINUED = 'discontinued',
// }
