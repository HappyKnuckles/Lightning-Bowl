import { Injectable } from '@angular/core';
import { Game, Frame, Throw } from 'src/app/core/models/game.model';
import { GameUtilsService } from '../game-utils/game-utils.service';

@Injectable({
  providedIn: 'root',
})
export class GameDataTransformerService {
  constructor(private gameUtilsService: GameUtilsService) {}
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
    user?: string,
  ): Game {
    try {
      const gameId = existingGameId || Date.now() + '_' + Math.random().toString(36).slice(2, 9);
      const date = existingDate || Date.now();
      const isPerfect = totalScore === 300;

      const isClean = this.gameUtilsService.calculateIsClean(frames);

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
        user,
      };
    } catch (error) {
      throw new Error(`Error transforming game data: ${error}`);
    }
  }
}
