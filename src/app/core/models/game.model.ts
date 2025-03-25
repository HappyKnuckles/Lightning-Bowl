export interface Game {
  gameId: string;
  date: number;
  frames: any; // Replace 'any' with the appropriate type if known
  totalScore: number;
  frameScores: number[];
  isClean: boolean;
  isPerfect: boolean;
  isPractice: boolean;
  isSeries?: boolean;
  seriesId?: string;
  note?: string;
  league?: string;
  balls?: string[];
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
