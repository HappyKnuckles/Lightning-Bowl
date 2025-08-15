export interface Throw {
  throwIndex: number;
  value: number;
}

export interface Frame {
  frameIndex: number;
  throws: Throw[];
}

export interface Game {
  gameId: string;
  date: number;
  frames: Frame[];
  totalScore: number;
  frameScores: number[];
  isClean: boolean;
  isPerfect: boolean;
  isPractice: boolean;
  isSeries?: boolean;
  seriesId?: string;
  note?: string;
  league?: string;
  patterns: string[];
  balls?: string[];
}
