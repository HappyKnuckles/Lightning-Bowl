import { Injectable } from '@angular/core';
import { Game } from '../../models/game.model';

export interface ThrowData {
  value: number;
  pinsLeftStanding: number[];
  pinsKnockedDown: number[];
}

@Injectable({
  providedIn: 'root',
})
export class BowlingGameValidationService {
  canRecordStrike(frameIndex: number, throwIndex: number, frames: number[][]): boolean {
    if (frameIndex < 9) {
      return throwIndex === 0;
    }

    const firstThrow = frames[9]?.[0];
    const secondThrow = frames[9]?.[1];

    if (throwIndex === 0) {
      return true;
    } else if (throwIndex === 1) {
      return firstThrow === 10;
    } else if (throwIndex === 2) {
      if (firstThrow === 10 && secondThrow === 10) {
        return true;
      }
      if (firstThrow !== 10 && firstThrow + secondThrow === 10) {
        return true;
      }
      return false;
    }

    return false;
  }

  canRecordSpare(frameIndex: number, throwIndex: number, frames: number[][]): boolean {
    if (throwIndex === 0) {
      return false;
    }

    if (frameIndex < 9) {
      const firstThrow = frames[frameIndex]?.[0];
      return firstThrow !== undefined && firstThrow !== 10;
    } else {
      const firstThrow = frames[9]?.[0];
      const secondThrow = frames[9]?.[1];

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

  canUndoLastThrow(frames: number[][]): boolean {
    for (let frameIndex = 0; frameIndex < 10; frameIndex++) {
      const frame = frames[frameIndex];
      if (frame && frame[0] !== undefined) {
        return true;
      }
    }
    return false;
  }

  isGameComplete(frames: number[][]): boolean {
    if (!frames || frames.length < 10) {
      return false;
    }

    const frame10 = frames[9];

    if (!frame10 || frame10[0] === undefined || frame10[1] === undefined) {
      return false;
    }

    if (frame10[0] === 10 || frame10[0] + frame10[1] === 10) {
      return frame10[2] !== undefined;
    }

    return true;
  }

  isPinAvailable(pinNumber: number, frameIndex: number, throwIndex: number, frames: number[][], throwsData: ThrowData[][]): boolean {
    const availablePins = this.getPinsLeftFromPreviousThrow(frameIndex, throwIndex, frames, throwsData);
    return availablePins.includes(pinNumber);
  }

  getPinsLeftFromPreviousThrow(frameIndex: number, throwIndex: number, frames: number[][], throwsData: ThrowData[][]): number[] {
    const allPins = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    if (throwIndex === 0) {
      return allPins;
    }

    const prevThrowIndex = throwIndex - 1;
    const frame = frames[frameIndex];

    // Special handling for 10th frame - pins can reset mid-frame
    if (frameIndex === 9 && frame) {
      if (prevThrowIndex === 0) {
        // After first throw in 10th frame
        if (frame[0] === 10) {
          // Strike on first throw - all pins reset for second throw
          return allPins;
        } else {
          // Not a strike - use throwsData if available, otherwise calculate from score
          if (throwsData[frameIndex] && throwsData[frameIndex][prevThrowIndex]) {
            return throwsData[frameIndex][prevThrowIndex].pinsLeftStanding;
          }
          return allPins.slice(frame[0]);
        }
      } else if (prevThrowIndex === 1) {
        // After second throw in 10th frame
        const firstThrow = frame[0];
        const secondThrow = frame[1];

        if (firstThrow === 10) {
          // First throw was a strike
          if (secondThrow === 10) {
            // Second throw was also a strike - all pins reset for third throw
            return allPins;
          } else {
            // Second throw was not a strike - use throwsData if available, otherwise calculate
            if (throwsData[frameIndex] && throwsData[frameIndex][prevThrowIndex]) {
              return throwsData[frameIndex][prevThrowIndex].pinsLeftStanding;
            }
            return allPins.slice(secondThrow);
          }
        } else {
          // First throw was not a strike
          if (firstThrow + secondThrow === 10) {
            // Spare - all pins reset for third throw
            return allPins;
          } else {
            // No spare - no third throw allowed
            return [];
          }
        }
      }
    }

    // For frames 1-9, use throwsData if available
    if (throwsData[frameIndex] && throwsData[frameIndex][prevThrowIndex]) {
      return throwsData[frameIndex][prevThrowIndex].pinsLeftStanding;
    }

    // Fallback: calculate from score (grid input mode)
    if (frame && frame[prevThrowIndex] !== undefined) {
      const pinsKnockedDown = frame[prevThrowIndex];

      if (pinsKnockedDown === 10) {
        // Strike in frames 1-9 - all pins reset (but this shouldn't be used for second throw in same frame)
        return allPins;
      }

      // Not a strike - remaining pins for second throw
      return allPins.slice(pinsKnockedDown);
    }

    return allPins;
  }

  isPinKnockedDownPreviously(pinNumber: number, frameIndex: number, throwIndex: number, frames: number[][], throwsData: ThrowData[][]): boolean {
    return !this.isPinAvailable(pinNumber, frameIndex, throwIndex, frames, throwsData);
  }

  isValidNumber0to10(value: number): boolean {
    return !isNaN(value) && value >= 0 && value <= 10;
  }

  isValidFrameScore(inputValue: number, frameIndex: number, inputIndex: number, frames: number[][]): boolean {
    if (inputIndex === 1 && frames[frameIndex][0] === undefined) {
      return false;
    }

    if (frameIndex < 9) {
      const firstThrow = frames[frameIndex][0] || 0;
      const secondThrow = inputIndex === 1 ? inputValue : frames[frameIndex][1] || 0;
      if (inputIndex === 0 && frames[frameIndex][1] !== undefined) {
        return inputValue + frames[frameIndex][1] <= 10;
      }
      return firstThrow + secondThrow <= 10;
    } else {
      const firstThrow = frames[frameIndex][0] || 0;
      const secondThrow = frames[frameIndex][1] || 0;
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

  isStrikeButtonDisabled(frameIndex: number | null, rollIndex: number | null, frames: number[][]): boolean {
    if (frameIndex === null || rollIndex === null) return true;

    if (frameIndex < 9) {
      return rollIndex !== 0;
    }

    const frame = frames[9];
    const first = frame?.[0];
    const second = frame?.[1];

    switch (rollIndex) {
      case 0:
        return false;
      case 1:
        return first !== 10;
      case 2:
        return !((first === 10 && second === 10) || (first + second === 10 && first !== 10 && second !== 10) || (first !== 10 && second === 10));
      default:
        return true;
    }
  }

  isSpareButtonDisabled(frameIndex: number | null, rollIndex: number | null, frames: number[][]): boolean {
    if (frameIndex === null || rollIndex === null) return true;

    if (frameIndex < 9) {
      return rollIndex !== 1;
    }

    const frame = frames[9];
    const first = frame?.[0];
    const second = frame?.[1];

    switch (rollIndex) {
      case 0:
        return true;
      case 1:
        return first === 10;
      case 2:
        return (first === 10 && second === 10) || (first !== 10 && first + second === 10);
      default:
        return true;
    }
  }

  isGameValid(game?: Game, allFrames?: number[][]): boolean {
    const frames = game ? game.frames : allFrames || [];
    let isValid = true;

    frames.forEach((frame: number[] | { throws: { value: number | string }[]; isInvalid?: boolean }, index: number) => {
      const throwsRaw = Array.isArray(frame) ? frame : frame.throws.map((t: { value: number | string }) => t.value);
      // Convert all throws to numbers
      const throws = throwsRaw.map((t: number | string) => (typeof t === 'string' ? parseInt(t, 10) : t));

      if (index < 9) {
        // For frames 1 to 9
        const frameValid =
          (throws[0] === 10 && isNaN(throws[1])) ||
          (throws[0] !== 10 &&
            throws.length === 2 &&
            throws.reduce((acc: number, curr: number) => acc + curr, 0) <= 10 &&
            throws.every((throwValue: number) => throwValue >= 0 && throwValue <= 10));

        if (!frameValid) {
          isValid = false;
          if (!Array.isArray(frame)) {
            frame.isInvalid = true;
          }
        } else {
          if (!Array.isArray(frame)) {
            frame.isInvalid = false;
          }
        }
      } else {
        // For frame 10
        const frameValid =
          (throws[0] === 10 && throws.length === 3 && throws.every((throwValue: number) => throwValue >= 0 && throwValue <= 10)) ||
          (throws.length === 2 && throws[0] + throws[1] < 10 && throws.every((throwValue: number) => throwValue >= 0 && throwValue <= 10)) ||
          (throws.length === 3 &&
            throws[0] + throws[1] >= 10 &&
            throws[1] !== undefined &&
            throws.every((throwValue: number) => throwValue >= 0 && throwValue <= 10));

        if (!frameValid) {
          isValid = false;
          if (!Array.isArray(frame)) {
            frame.isInvalid = true;
          }
        } else {
          if (!Array.isArray(frame)) {
            frame.isInvalid = false;
          }
        }
      }
    });

    return isValid;
  }
}
