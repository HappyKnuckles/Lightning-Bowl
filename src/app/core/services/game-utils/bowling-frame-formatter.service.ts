import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class BowlingFrameFormatterService {
  /**
   * Formats a throw value for display (handles strikes, spares, and gutter balls)
   */
  formatThrowValue(frameIndex: number, throwIndex: number, frames: number[][]): string {
    const frame = frames[frameIndex];
    if (!frame || frame[throwIndex] === undefined || frame[throwIndex] === null) {
      return '';
    }

    const val = frame[throwIndex];
    const firstBall = frame[0];
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

    const secondBall = frame[1];

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
}
