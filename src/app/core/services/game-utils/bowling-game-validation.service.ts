import { Injectable } from '@angular/core';
import { Game, Frame, getThrowValue } from '../../models/game.model';

@Injectable({
  providedIn: 'root',
})
export class BowlingGameValidationService {
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

  // adjust, this allows undo in first frame, it should check according to last throw (current pos)
  canUndoLastThrow(frames: Frame[]): boolean {
    for (let frameIndex = 0; frameIndex < 10; frameIndex++) {
      const frame = frames[frameIndex];
      if (frame && frame.throws && frame.throws.length > 0 && getThrowValue(frame, 0) !== undefined) {
        return true;
      }
    }
    return false;
  }

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

  isGameValid(game?: Game): boolean {
    if (!game || !game.frames) {
      return false;
    }
    return this.isGameValidFromFrames(game.frames);
  }

  private isGameValidFromFrames(frames: Frame[]): boolean {
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
}
