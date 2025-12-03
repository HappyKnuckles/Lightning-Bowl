/**
 * Represents a single throw/ball in a bowling frame
 */
export interface Throw {
  /** The number of pins knocked down (0-10) */
  value: number;
  /** 1-based index of this throw within the frame */
  throwIndex: number;
  /** Whether this throw resulted in a split */
  isSplit?: boolean;
  /** Array of pin numbers still standing after this throw */
  pinsLeftStanding?: number[];
  /** Array of pin numbers knocked down by this throw */
  pinsHit?: number[];
}

/**
 * Represents a single frame in a bowling game
 */
export interface Frame {
  /** 1-based index of this frame (1-10) */
  frameIndex: number;
  /** Array of throws in this frame */
  throws: Throw[];
  /** Whether this frame is invalid (used for validation UI) */
  isInvalid?: boolean;
}

/**
 * Represents a complete bowling game
 */
export interface Game {
  /** Unique identifier for the game */
  gameId: string;
  /** Timestamp when the game was played */
  date: number;
  /** Array of 10 frames */
  frames: Frame[];
  /** Total score for the game */
  totalScore: number;
  /** Cumulative scores for each frame */
  frameScores: number[];
  /** Whether all frames were strikes or spares (no open frames) */
  isClean: boolean;
  /** Whether the game is a perfect 300 */
  isPerfect: boolean;
  /** Whether this is a practice game */
  isPractice: boolean;
  /** Whether this game is part of a series */
  isSeries?: boolean;
  /** Unique identifier for the series this game belongs to */
  seriesId?: string;
  /** Optional notes about the game */
  note?: string;
  /** League or tournament name */
  league?: string;
  /** Oil patterns used during the game */
  patterns: string[];
  /** Bowling balls used during the game */
  balls?: string[];
}

/**
 * Helper function to create a Throw object
 */
export function createThrow(value: number, throwIndex: number): Throw {
  return {
    value,
    throwIndex,
  };
}

/**
 * Helper function to create an empty frame
 */
export function createEmptyFrame(frameIndex: number): Frame {
  return {
    frameIndex,
    throws: [],
  };
}

/**
 * Helper function to create 10 empty frames
 */
export function createEmptyFrames(): Frame[] {
  return Array.from({ length: 10 }, (_, i) => createEmptyFrame(i + 1));
}

/**
 * Helper function to create an empty game
 */
export function createEmptyGame(): Game {
  return {
    gameId: '',
    date: 0,
    frames: createEmptyFrames(),
    totalScore: 0,
    frameScores: [],
    isClean: false,
    isPerfect: false,
    isPractice: true,
    note: '',
    league: '',
    patterns: [],
    balls: [],
  };
}

/**
 * Get throw value from a frame at a specific index
 * Returns undefined if throw doesn't exist
 */
export function getThrowValue(frame: Frame | undefined, throwIndex: number): number | undefined {
  if (!frame || !frame.throws || throwIndex < 0 || throwIndex >= frame.throws.length) {
    return undefined;
  }
  return frame.throws[throwIndex]?.value;
}

/**
 * Get all throw values from a frame as an array of numbers
 */
export function getThrowValues(frame: Frame | undefined): number[] {
  if (!frame || !frame.throws) {
    return [];
  }
  return frame.throws.map((t) => t.value);
}

/**
 * Check if a frame is a strike (first throw = 10)
 */
export function isStrike(frame: Frame | undefined): boolean {
  return getThrowValue(frame, 0) === 10;
}

/**
 * Check if a frame is a spare (first two throws sum to 10, but not a strike)
 */
export function isSpare(frame: Frame | undefined): boolean {
  const first = getThrowValue(frame, 0);
  const second = getThrowValue(frame, 1);
  if (first === undefined || second === undefined) return false;
  return first !== 10 && first + second === 10;
}

/**
 * Check if a frame is complete (has all required throws)
 */
export function isFrameComplete(frame: Frame | undefined, frameIndex: number): boolean {
  if (!frame || !frame.throws) return false;

  // For frames 1-9 (0-8 in 0-indexed)
  if (frameIndex < 9) {
    // Strike = complete with 1 throw
    if (isStrike(frame)) return true;
    // Otherwise need 2 throws
    return frame.throws.length >= 2;
  }

  // For the 10th frame (index 9)
  const first = getThrowValue(frame, 0);
  const second = getThrowValue(frame, 1);

  if (first === undefined) return false;
  if (second === undefined) return false;

  // If strike or spare, need 3 throws
  if (first === 10 || first + second === 10) {
    return frame.throws.length >= 3;
  }

  // Otherwise 2 throws is complete
  return true;
}

/**
 * Set a throw value in a frame (mutates the frame)
 * Automatically handles throwIndex assignment
 */
export function setThrowInFrame(frame: Frame, throwIndex: number, value: number): void {
  // Ensure throws array exists
  if (!frame.throws) {
    frame.throws = [];
  }

  // If throwIndex is beyond current length, extend the array
  while (frame.throws.length <= throwIndex) {
    frame.throws.push(createThrow(0, frame.throws.length + 1));
  }

  // Set or update the throw
  frame.throws[throwIndex] = createThrow(value, throwIndex + 1);
}

/**
 * Remove a throw from a frame at a specific index (mutates the frame)
 */
export function removeThrowFromFrame(frame: Frame, throwIndex: number): void {
  if (frame.throws && throwIndex >= 0 && throwIndex < frame.throws.length) {
    frame.throws.splice(throwIndex, 1);
    // Re-index remaining throws
    frame.throws.forEach((t, idx) => {
      t.throwIndex = idx + 1;
    });
  }
}

/**
 * Deep clone a Frame array
 */
export function cloneFrames(frames: Frame[]): Frame[] {
  return frames.map((frame) => ({
    ...frame,
    throws: frame.throws.map((t) => ({ ...t })),
  }));
}

/**
 * Deep clone a Game
 */
export function cloneGame(game: Game): Game {
  return {
    ...game,
    frames: cloneFrames(game.frames),
    frameScores: [...game.frameScores],
    patterns: [...game.patterns],
    balls: game.balls ? [...game.balls] : undefined,
  };
}

/**
 * Convert number[][] format to Frame[] format
 * Used for legacy data migration and OCR parsing results
 */
export function numberArraysToFrames(numberArrays: number[][]): Frame[] {
  return numberArrays.map((frameArray, frameIndex) => ({
    frameIndex: frameIndex + 1,
    throws: frameArray.map((value, throwIndex) => createThrow(value, throwIndex + 1)),
  }));
}
