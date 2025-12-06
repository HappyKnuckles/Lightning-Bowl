import { Injectable } from '@angular/core';
import { Game, Frame, Throw, getThrowValue } from 'src/app/core/models/game.model';

@Injectable({
  providedIn: 'root',
})
export class GameDataTransformerService {
  transformGameData(
    frames: Frame[],
    frameScores: number[],
    totalScore: number,
    isPractice: boolean,
    league?: string,
    isSeries?: boolean,
    seriesId?: string,
    note?: string,
    patterns?: string[],
    balls?: string[],
    existingGameId?: string,
    existingDate?: number,
    isPinMode?: boolean,
  ): Game {
    try {
      const gameId = existingGameId || Date.now() + '_' + Math.random().toString(36).slice(2, 9);
      const date = existingDate || Date.now();
      const isPerfect = totalScore === 300;

      const isClean = this.calculateIsClean(frames);

      // Ensure frames are in proper Frame[] format
      const normalizedFrames: Frame[] = frames.map((frame, frameIndex) => {
        if (Array.isArray(frame) && typeof frame[0] === 'number') {
          // Old format: number[]
          const numberArray = frame as unknown as number[];
          return {
            frameIndex: frameIndex + 1,
            throws: numberArray.map(
              (value: number, throwIndex: number): Throw => ({
                value,
                throwIndex: throwIndex + 1,
              }),
            ),
          };
        } else if (frame && 'throws' in frame) {
          return {
            frameIndex: frame.frameIndex || frameIndex + 1,
            throws: (frame.throws || []).map(
              (t: Throw, throwIndex: number): Throw => ({
                value: typeof t.value === 'string' ? parseInt(t.value, 10) : t.value,
                throwIndex: t.throwIndex || throwIndex + 1,
                isSplit: t.isSplit,
                pinsLeftStanding: t.pinsLeftStanding,
                pinsKnockedDown: t.pinsKnockedDown,
              }),
            ),
          };
        } else {
          // Empty frame
          return {
            frameIndex: frameIndex + 1,
            throws: [],
          };
        }
      });

      return {
        gameId,
        date,
        frames: normalizedFrames,
        frameScores,
        totalScore,
        isSeries,
        seriesId,
        note,
        isPractice,
        isPinMode: isPinMode ?? false,
        league,
        isClean,
        isPerfect,
        patterns: patterns ? [...patterns].sort() : [],
        balls: balls ? [...balls].sort() : undefined,
      };
    } catch (error) {
      throw new Error(`Error transforming game data: ${error}`);
    }
  }

  private calculateIsClean(frames: Frame[]): boolean {
    for (let i = 0; i < Math.min(frames.length, 10); i++) {
      const frame = frames[i];
      if (!frame || !frame.throws || frame.throws.length === 0) {
        continue; // Skip empty frames
      }

      const first = getThrowValue(frame, 0);
      const second = getThrowValue(frame, 1);

      if (first === undefined) {
        continue; // Skip incomplete frames
      }

      if (i < 9) {
        // Frames 1-9: must be strike or spare
        if (first !== 10 && (second === undefined || first + second < 10)) {
          return false; // Open frame
        }
      } else {
        // 10th frame: first two balls must add up to at least 10
        if (second === undefined) {
          continue; // Incomplete
        }
        if (first !== 10 && first + second < 10) {
          return false; // Open frame
        }
      }
    }
    return true;
  }
}
