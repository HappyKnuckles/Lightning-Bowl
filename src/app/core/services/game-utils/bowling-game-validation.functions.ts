import { Game, Frame, getThrowValue } from '../../models/game.model';

export function canRecordStrike(frameIndex: number, throwIndex: number, frames: Frame[]): boolean {
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

export function canRecordSpare(frameIndex: number, throwIndex: number, frames: Frame[]): boolean {
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

export function canUndoLastThrow(frames: Frame[], frameIndex: number, throwIndex: number): boolean {
  if (!frames || frameIndex < 0 || throwIndex < 0) return false;

  const currentFrame = frames[frameIndex];
  const currentValue = currentFrame?.throws?.[throwIndex]?.value;
  if (currentValue !== undefined) {
    return true;
  }

  if (throwIndex > 0) {
    const prevThrowValue = currentFrame?.throws?.[throwIndex - 1]?.value;
    return prevThrowValue !== undefined;
  }

  if (frameIndex > 0) {
    const prevFrame = frames[frameIndex - 1];
    if (prevFrame && prevFrame.throws && prevFrame.throws.length > 0) {
      const lastThrowOfPrevFrame = prevFrame.throws[prevFrame.throws.length - 1];
      return lastThrowOfPrevFrame.value !== undefined;
    }
  }

  return false;
}

export function isValidFrameScore(inputValue: number, frameIndex: number, inputIndex: number, frames: Frame[]): boolean {
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

export function isGameValid(game?: Game): boolean {
  if (!game || !game.frames) {
    return false;
  }
  return isGameValidFromFrames(game.frames);
}

function isGameValidFromFrames(frames: Frame[]): boolean {
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

// Additional utility functions

export function isValidNumber0to10(value: number): boolean {
  return !isNaN(value) && value >= 0 && value <= 10;
}

export function parseInputValue(value: string, frameIndex: number, throwIndex: number, frames: Frame[]): number {
  const inputUpper = value.toUpperCase();

  if (inputUpper === 'X') {
    return 10;
  }

  if (inputUpper === '/') {
    const frame = frames[frameIndex];
    const previousThrow = throwIndex > 0 ? getThrowValue(frame, throwIndex - 1) : undefined;

    if (previousThrow !== undefined && previousThrow !== 10) {
      return 10 - previousThrow;
    }

    // For 10th frame, spare after a strike in previous position
    if (frameIndex === 9 && throwIndex === 2) {
      const secondThrow = getThrowValue(frame, 1);
      if (secondThrow !== undefined && secondThrow !== 10) {
        return 10 - secondThrow;
      }
    }
  }

  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? 0 : parsed;
}

export function isSplit(pinsLeftStanding: number[]): boolean {
  if (pinsLeftStanding.length < 2) return false;
  if (pinsLeftStanding.includes(1)) return false; // Headpin must be down

  // Check if pins are not adjacent
  const adjacencyMap: Record<number, number[]> = {
    1: [2, 3],
    2: [1, 4, 5],
    3: [1, 5, 6],
    4: [2, 7, 8],
    5: [2, 3, 8, 9],
    6: [3, 9, 10],
    7: [4],
    8: [4, 5],
    9: [5, 6],
    10: [6],
  };

  const sorted = [...pinsLeftStanding].sort((a, b) => a - b);

  for (let i = 0; i < sorted.length - 1; i++) {
    const pin = sorted[i];
    const nextPin = sorted[i + 1];
    const adjacent = adjacencyMap[pin] || [];

    if (adjacent.includes(nextPin)) {
      return false; // Found adjacent pins, not a split
    }
  }

  return true;
}

/**
 * Validates if a throw value is valid for a specific frame and throw position
 * @param value The throw value to validate
 * @param frameIndex The frame index (0-9)
 * @param throwIndex The throw index within the frame (0-2)
 * @param frames The current game frames
 * @returns true if the throw is valid, false otherwise
 */
export function isValidThrow(value: number, frameIndex: number, throwIndex: number, frames: number[][]): boolean {
  if (value < 0 || value > 10 || isNaN(value)) {
    return false;
  }

  if (frameIndex < 9) {
    // Frames 1-9
    if (throwIndex === 0) {
      return value >= 0 && value <= 10;
    } else if (throwIndex === 1) {
      const firstThrow = frames[frameIndex][0] || 0;
      return firstThrow + value <= 10;
    }
    return false; // Only 2 throws allowed in frames 1-9 (unless strike, but that's handled elsewhere)
  } else {
    // Frame 10
    const firstThrow = frames[frameIndex][0] || 0;
    const secondThrow = frames[frameIndex][1] || 0;

    if (throwIndex === 0) {
      return value >= 0 && value <= 10;
    } else if (throwIndex === 1) {
      if (firstThrow === 10) {
        // First throw was a strike; any value (0-10) is valid
        return value >= 0 && value <= 10;
      } else {
        // First throw was not a strike; total cannot exceed 10
        return firstThrow + value <= 10;
      }
    } else if (throwIndex === 2) {
      // Third throw only allowed if first two throws sum to 10 or more
      if (firstThrow === 10) {
        // First throw is a strike
        if (secondThrow === 10) {
          // Second throw is also a strike; any value (0-10) is valid
          return value >= 0 && value <= 10;
        } else {
          // Second throw is not a strike; total of second and third cannot exceed 10
          return secondThrow + value <= 10;
        }
      } else if (firstThrow + secondThrow === 10) {
        // First two throws are a spare; any value (0-10) is valid
        return value >= 0 && value <= 10;
      }
      return false; // No third throw allowed if not spare or strike
    }
  }
  return false;
}

/**
 * Validates if a frame is complete (all required throws entered)
 * @param frameIndex The frame index (0-9)
 * @param frames The current game frames
 * @returns true if the frame is complete, false otherwise
 */
export function isFrameComplete(frameIndex: number, frames: number[][]): boolean {
  const frame = frames[frameIndex];
  if (!frame) {
    return false;
  }

  if (frameIndex < 9) {
    // Frames 1-9: Complete if first throw is 10 (strike) or two throws entered
    if (frame[0] === 10) {
      return true; // Strike
    }
    return frame.length >= 2 && frame[1] !== undefined && frame[1] !== null;
  } else {
    // Frame 10: More complex
    const firstThrow = frame[0];
    const secondThrow = frame[1];
    const thirdThrow = frame[2];

    if (firstThrow === undefined || firstThrow === null) {
      return false;
    }

    if (firstThrow === 10) {
      // Strike on first throw; need 3 throws total
      return secondThrow !== undefined && secondThrow !== null && thirdThrow !== undefined && thirdThrow !== null;
    } else if (secondThrow !== undefined && secondThrow !== null && firstThrow + secondThrow === 10) {
      // Spare on second throw; need 3 throws total
      return thirdThrow !== undefined && thirdThrow !== null;
    } else if (secondThrow !== undefined && secondThrow !== null) {
      // No spare or strike; only 2 throws
      return true;
    }
    return false;
  }
}

/**
 * Validates if the entire game is complete (all frames complete)
 * @param frames The current game frames
 * @returns true if all frames are complete, false otherwise
 */
export function isGameComplete(frames: number[][]): boolean {
  for (let i = 0; i < 10; i++) {
    if (!isFrameComplete(i, frames)) {
      return false;
    }
  }
  return true;
}
