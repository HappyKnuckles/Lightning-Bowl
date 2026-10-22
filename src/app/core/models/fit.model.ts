export type GripStyle = 'fingertip' | 'semi-fingertip' | 'conventional';

/**
 * The bowler's hand and release measurements; they apply to every ball, unlike a ball's drilling.
 * All lengths in inches. The PAP is written as '<over>" over, <vertical>" up/down',
 * measured from the center of the grip.
 */
export interface BowlerFit {
  grip?: GripStyle;
  middleSpan?: number;
  ringSpan?: number;
  papOver?: number;
  /** Positive = up, negative = down. */
  papVertical?: number;
}
