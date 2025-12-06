import { Injectable } from '@angular/core';
import { Game, Frame, getThrowValue } from '../../models/game.model';

@Injectable({
  providedIn: 'root',
})
export class BowlingGameValidationService {
  /**
   * Check if a strike can be recorded at the given position
   * Uses Frame[] as the single source of truth
   */
  canRecordStrike(frameIndex: number, throwIndex: number, frames: Frame[]): boolean {
    if (frameIndex < 9) {
      return throwIndex === 0;
    }

    const frame = frames[9];
    const firstThrow = getThrowValue(frame, 0);
    const secondThrow = getThrowValue(frame, 1);

    if (throwIndex === 0) {
      return true;
    } else if (throwIndex === 1) {
      return firstThrow === 10;
    } else if (throwIndex === 2) {
      if (firstThrow === 10 && secondThrow === 10) {
        return true;
      }
      if (firstThrow !== undefined && secondThrow !== undefined && firstThrow !== 10 && firstThrow + secondThrow === 10) {
        return true;
      }
      return false;
    }

    return false;
  }

  /**
   * Check if a spare can be recorded at the given position
   * Uses Frame[] as the single source of truth
   */
  canRecordSpare(frameIndex: number, throwIndex: number, frames: Frame[]): boolean {
    if (throwIndex === 0) {
      return false;
    }

    if (frameIndex < 9) {
      const firstThrow = getThrowValue(frames[frameIndex], 0);
      return firstThrow !== undefined && firstThrow !== 10;
    } else {
      const firstThrow = getThrowValue(frames[9], 0);
      const secondThrow = getThrowValue(frames[9], 1);

      if (throwIndex === 1) {
        return firstThrow !== undefined && firstThrow !== 10;
      } else if (throwIndex === 2) {
        if (firstThrow === 10 && secondThrow !== undefined && secondThrow !== 10) {
          return true;
        }
        return false;
      }
    }

    return false;
  }

  /**
   * Check if undo is possible (any throws recorded)
   */
  canUndoLastThrow(frames: Frame[]): boolean {
    for (let frameIndex = 0; frameIndex < 10; frameIndex++) {
      const frame = frames[frameIndex];
      if (frame && frame.throws && frame.throws.length > 0 && getThrowValue(frame, 0) !== undefined) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if the game is complete (all required throws recorded)
   */
  isGameComplete(frames: Frame[]): boolean {
    if (!frames || frames.length < 10) {
      return false;
    }

    const frame10 = frames[9];
    const first = getThrowValue(frame10, 0);
    const second = getThrowValue(frame10, 1);

    if (first === undefined || second === undefined) {
      return false;
    }

    if (first === 10 || first + second === 10) {
      return getThrowValue(frame10, 2) !== undefined;
    }

    return true;
  }

  /**
   * Validate that a number is between 0 and 10
   */
  isValidNumber0to10(value: number): boolean {
    return !isNaN(value) && value >= 0 && value <= 10;
  }

  /**
   * Parse input value (handles X, /, and numeric values)
   * Converts string input to a numeric value based on bowling rules
   */
  parseInputValue(input: string, frameIndex: number, throwIndex: number, frames: Frame[]): number {
    const upperInput = input.toUpperCase();

    if (upperInput === 'X') {
      return 10;
    }

    if (upperInput === '/') {
      const firstThrow = getThrowValue(frames[frameIndex], 0);
      if (firstThrow !== undefined && throwIndex > 0) {
        // For 10th frame third throw after a strike, calculate spare based on second throw
        if (frameIndex === 9 && throwIndex === 2) {
          const secondThrow = getThrowValue(frames[frameIndex], 1);
          if (getThrowValue(frames[frameIndex], 0) === 10 && secondThrow !== undefined) {
            return 10 - secondThrow;
          }
        }
        return 10 - firstThrow;
      }
      return 0;
    }

    return parseInt(input, 10) || 0;
  }

  /**
   * Validate that a frame score is valid based on bowling rules
   */
  isValidFrameScore(inputValue: number, frameIndex: number, inputIndex: number, frames: Frame[]): boolean {
    const frame = frames[frameIndex];

    if (inputIndex === 1 && getThrowValue(frame, 0) === undefined) {
      return false;
    }

    if (frameIndex < 9) {
      const firstThrow = getThrowValue(frame, 0) ?? 0;
      const secondThrow = inputIndex === 1 ? inputValue : (getThrowValue(frame, 1) ?? 0);
      if (inputIndex === 0 && getThrowValue(frame, 1) !== undefined) {
        return inputValue + (getThrowValue(frame, 1) ?? 0) <= 10;
      }
      return firstThrow + secondThrow <= 10;
    } else {
      const firstThrow = getThrowValue(frame, 0) ?? 0;
      const secondThrow = getThrowValue(frame, 1) ?? 0;
      switch (inputIndex) {
        case 0:
          return inputValue <= 10;
        case 1:
          if (firstThrow === 10) {
            return inputValue <= 10;
          } else {
            return firstThrow + inputValue <= 10;
          }
        case 2:
          if (firstThrow === 10) {
            if (secondThrow === 10) {
              return inputValue <= 10;
            } else {
              return inputValue <= 10 - secondThrow;
            }
          } else if (firstThrow + secondThrow === 10) {
            return inputValue <= 10;
          } else {
            return false;
          }
        default:
          return false;
      }
    }
  }

  /**
   * Validates if a game is complete and valid
   * Uses Frame[] as the single source of truth
   */
  isGameValid(game?: Game): boolean {
    if (!game || !game.frames) {
      return false;
    }
    return this.isGameValidFromFrames(game.frames);
  }

  /**
   * Validates if frames represent a complete and valid game
   * This is the core validation method that works directly with Frame[]
   */
  isGameValidFromFrames(frames: Frame[]): boolean {
    if (!frames || frames.length < 10) {
      return false;
    }

    for (let index = 0; index < 10; index++) {
      const frame = frames[index];
      if (!frame || !frame.throws) {
        return false;
      }

      const throws = frame.throws.map((t) => (typeof t.value === 'string' ? parseInt(t.value as unknown as string, 10) : t.value));

      if (index < 9) {
        // For frames 1 to 9
        const first = throws[0];
        const second = throws[1];

        if (first === undefined || isNaN(first)) {
          return false;
        }

        const frameValid =
          (first === 10 && (second === undefined || isNaN(second))) ||
          (first !== 10 && throws.length >= 2 && !isNaN(second) && first + second <= 10 && throws.slice(0, 2).every((v) => v >= 0 && v <= 10));

        if (!frameValid) {
          return false;
        }
      } else {
        // For frame 10
        const first = throws[0];
        const second = throws[1];

        if (first === undefined || isNaN(first) || second === undefined || isNaN(second)) {
          return false;
        }

        const frameValid =
          // Strike on first throw - need 3 throws
          (first === 10 && throws.length === 3 && throws.every((v) => !isNaN(v) && v >= 0 && v <= 10)) ||
          // No mark - only 2 throws
          (throws.length === 2 && first + second < 10 && throws.every((v) => !isNaN(v) && v >= 0 && v <= 10)) ||
          // Spare - need 3 throws
          (throws.length === 3 && first + second >= 10 && second !== undefined && throws.every((v) => !isNaN(v) && v >= 0 && v <= 10));

        if (!frameValid) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Detects if a throw resulted in a split
   * A split occurs when the headpin (1) is knocked down and at least one pin
   * is left standing with a gap between standing pins
   */
  isSplit(pinsLeftStanding: number[]): boolean {
    const numPins = pinsLeftStanding?.length ?? 0;

    // 1. Less than 2 pins cannot be a split
    if (numPins < 2) {
      return false;
    }

    // 2. Headpin (1) must be down for a split
    if (pinsLeftStanding.includes(1)) {
      return false;
    }

    // 3. Map pins to their specific columns (1 through 7, left to right)
    // Col 1: Pin 7
    // Col 2: Pin 4
    // Col 3: Pin 2, 8
    // Col 4: Pin 1, 5  (Note: Pin 1 is handled above, but 5 remains)
    // Col 5: Pin 3, 9
    // Col 6: Pin 6
    // Col 7: Pin 10
    const pinToColumn: Record<number, number> = {
      7: 1,
      4: 2,
      2: 3,
      8: 3,
      1: 4,
      5: 4,
      3: 5,
      9: 5,
      6: 6,
      10: 7,
    };

    // 4. Determine which columns still have pins standing
    const occupiedColumns = new Set<number>();
    for (const pin of pinsLeftStanding) {
      const col = pinToColumn[pin];
      if (col) occupiedColumns.add(col);
    }

    // 5. Sort the occupied columns to check for gaps
    const sortedCols = Array.from(occupiedColumns).sort((a, b) => a - b);

    // 6. Check for a gap between columns
    // If the difference between adjacent occupied columns is > 1,
    // it means there is an empty column in between.
    for (let i = 0; i < sortedCols.length - 1; i++) {
      if (sortedCols[i + 1] - sortedCols[i] > 1) {
        return true;
      }
    }

    return false;
  }

  /**
   * Determines if a split is makeable (convertible)
   * Unmakeable splits (also called impossible splits) are combinations where
   * it's physically impossible to hit all remaining pins with one ball
   * Common unmakeable splits: 7-10, 4-6, 4-7-10, 6-7-10, 4-6-7-10, etc.
   */
  isMakeableSplit(pinsLeftStanding: number[]): boolean {
    if (!this.isSplit(pinsLeftStanding)) {
      return false; // Not a split, so not applicable
    }

    // Define unmakeable split patterns
    // These are splits where it's physically impossible to convert
    const unmakeableSplits: number[][] = [
      [7, 10], // 7-10 split (widest split)
      [4, 6], // 4-6 split
      [4, 6, 7], // 4-6-7 split
      [4, 6, 10], // 4-6-10 split
      [4, 7, 10], // 4-7-10 split
      [6, 7, 10], // 6-7-10 split
      [4, 6, 7, 10], // 4-6-7-10 split (Big Four)
      [4, 6, 7, 9], // Greek Church variant
      [4, 6, 7, 9, 10], // Big Five
    ];

    // Normalize the pins (sort to compare)
    const sortedPins = [...pinsLeftStanding].sort((a, b) => a - b);

    // Check if this matches any unmakeable pattern
    for (const unmakeable of unmakeableSplits) {
      const sortedUnmakeable = [...unmakeable].sort((a, b) => a - b);
      if (sortedPins.length === sortedUnmakeable.length && sortedPins.every((pin, idx) => pin === sortedUnmakeable[idx])) {
        return false; // This is an unmakeable split
      }
    }

    // If not in the unmakeable list, it's considered makeable
    return true;
  }
}
