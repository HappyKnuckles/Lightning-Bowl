import { Injectable } from '@angular/core';
import { Game } from 'src/app/core/models/game.model';

@Injectable({
  providedIn: 'root',
})
export class GameDataTransformerService {
  transformGameData(
    frames: any,
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
    throwsData?: { value: number; pinsLeftStanding: number[] }[][],
    isPinMode?: boolean,
  ): Game {
    try {
      const gameId = existingGameId || Date.now() + '_' + Math.random().toString(36).slice(2, 9);
      const date = existingDate || Date.now();
      const isPerfect = totalScore === 300;
      const isClean = !frames.some((frame: number[]) => {
        const frameScore = frame.reduce((acc: number, curr: number) => acc + curr, 0);
        return frameScore < 10;
      });
      return {
        gameId: gameId,
        date: date,
        frames: frames.map((frame: any[], frameIndex: number) => ({
          throws: frame.map((throwValue: number | string, throwIndex: number) => {
            const throwData = throwsData && throwsData[frameIndex] && throwsData[frameIndex][throwIndex];
            return {
              value: parseInt(throwValue as string),
              throwIndex: throwIndex + 1, // Add 1 to make it 1-based index
              pinsLeftStanding: throwData ? throwData.pinsLeftStanding : undefined,
            };
          }),
          frameIndex: frameIndex + 1,
        })),
        frameScores: frameScores,
        totalScore: totalScore,
        isSeries: isSeries,
        seriesId: seriesId,
        note: note,
        isPractice: isPractice,
        isPinMode: isPinMode,
        league: league,
        isClean: isClean,
        isPerfect: isPerfect,
        patterns: patterns ? [...patterns].sort() : [],
        balls: balls ? [...balls].sort() : undefined,
      };
    } catch (error) {
      throw new Error(`Error transforming game data: ${error}`);
    }
  }
}
