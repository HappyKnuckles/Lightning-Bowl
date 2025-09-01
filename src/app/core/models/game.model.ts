export interface Game {
  gameId: string;
  date: number;
  frames: any;
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

// Pin-level data for detailed analysis
export interface PinData {
  pinsKnocked: number[]; // Array of pin numbers (1-10) that were knocked down
  pinsStanding: number[]; // Array of pin numbers (1-10) that remained standing
}

export interface ThrowWithPins {
  value: number;
  throwIndex: number;
  pins?: PinData; // Optional pin-level data
}

export interface FrameWithPins {
  throws: ThrowWithPins[];
  frameIndex: number;
}

// interface Session {
//   isSeries?: boolean;
//   seriesId?: string;
//   note?: string;
// }

// TODO adjust code to use frame interface instead

// interface Frame {
//     frameIndex: number;
//     frameScore: number;
//     throws: Throw[];
// }

// export interface Throw {
//     throwIndex: number;
//     value: number;
// }
