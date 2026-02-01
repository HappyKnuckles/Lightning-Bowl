import { Frame } from 'src/app/core/models/game.model';

/**
 * Formats a throw value for display (handles strikes, spares, and gutter balls)
 */
export function formatThrowValue(frameIndex: number, throwIndex: number, frames: Frame[]): string {
  const frame = frames[frameIndex];
  if (!frame || frame.throws[throwIndex] === undefined || frame.throws[throwIndex] === null) {
    return '';
  }

  const val = frame.throws[throwIndex].value;
  const firstBall = frame.throws[0].value;
  const isTenth = frameIndex === 9;

  if (val === 0) {
    return '–';
  }

  if (throwIndex === 0) {
    return val === 10 ? 'X' : val.toString();
  }

  if (!isTenth) {
    if (firstBall !== undefined && firstBall !== 10 && firstBall + val === 10) {
      return '/';
    }
    return val.toString();
  }

  const secondBall = frame.throws[1].value;

  if (throwIndex === 1) {
    if (val === 10) {
      return 'X';
    }
    if (firstBall !== undefined && firstBall !== 10 && firstBall + val === 10) {
      return '/';
    }
    return val.toString();
  }

  if (throwIndex === 2) {
    if (val === 10) {
      return 'X';
    }
    if (firstBall === 10 && secondBall !== undefined && secondBall !== 10 && secondBall + val === 10) {
      return '/';
    }
    return val.toString();
  }

  return val.toString();
}

/**
 * Parses user input (X, /, numbers) into numeric values
 * @param inputValue The string input (e.g., 'X', '/', '7')
 * @param frameIndex The frame index (0-9)
 * @param throwIndex The throw index within the frame (0-2)
 * @param frames The game frames array
 * @returns Numeric value for the throw
 */
export function parseInputValue(inputValue: string, frameIndex: number, throwIndex: number, frames: number[][]): number {
  if (frameIndex < 9) {
    // Frames 1-9
    if (inputValue === 'X' || inputValue === 'x') {
      return 10; // Strike
    } else if (inputValue === '/') {
      const firstThrow = frames[frameIndex][0] || 0;
      return 10 - firstThrow; // Spare
    }
  } else {
    // 10th Frame
    const firstThrow = frames[frameIndex][0] || 0;
    const secondThrow = frames[frameIndex][1] || 0;

    switch (throwIndex) {
      case 0: // First throw of 10th frame
        if (inputValue === 'X' || inputValue === 'x') {
          return 10; // Strike
        }
        break;
      case 1: // Second throw of 10th frame
        if (firstThrow === 10) {
          // First throw was a strike; any value (0-10) is valid
          if (inputValue === 'X' || inputValue === 'x') {
            return 10;
          }
        } else if (inputValue === '/') {
          // First throw was not a strike; spare notation applies
          return 10 - firstThrow;
        }
        break;
      case 2: // Third throw of 10th frame
        if (firstThrow === 10) {
          // If first throw is a strike, handle second throw conditions
          if (secondThrow === 10 && (inputValue === 'X' || inputValue === 'x')) {
            return 10; // Double strike
          } else if (secondThrow !== 10 && inputValue === '/') {
            return 10 - secondThrow; // Spare after a non-strike second throw
          }
        } else if (firstThrow + secondThrow === 10) {
          // First two throws were a spare; any value (0-10) is valid
          if (inputValue === 'X' || inputValue === 'x') {
            return 10;
          }
        }
        break;
    }
  }
  return parseInt(inputValue, 10);
}
