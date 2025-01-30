import { Injectable } from '@angular/core';
import { Game } from 'src/app/models/game.model';

@Injectable({
  providedIn: 'root',
})
export class GameDataTransformerService {
  constructor() {}

  transformGameData(
    frames: any,
    frameScores: number[],
    totalScore: number,
    isPractice: boolean,
    league?: string,
    isSeries?: boolean,
    seriesId?: string,
    note?: string,
    balls?: string[]
  ): Game {
    try {
      const gameId = Date.now() + '_' + Math.random().toString(36).slice(2, 9); // Generate a unique gameId
      const date = Date.now();
      const isPerfect = totalScore === 300;
      const isClean = !frames.some((frame: number[]) => {
        const frameScore = frame.reduce((acc: number, curr: number) => acc + curr, 0);
        return frameScore < 10;
      });
      return {
        gameId: gameId,
        date: date,
        frames: frames.map((frame: any[], frameIndex: number) => ({
          throws: frame.map((throwValue: any, throwIndex: number) => ({
            value: parseInt(throwValue),
            throwIndex: throwIndex + 1, // Add 1 to make it 1-based index
          })),
          frameIndex: frameIndex + 1,
        })),
        frameScores: frameScores,
        totalScore: totalScore,
        isSeries: isSeries,
        seriesId: seriesId,
        note: note,
        isPractice: isPractice,
        league: league,
        isClean: isClean,
        isPerfect: isPerfect,
        balls: balls,
      };
    } catch (error) {
      throw new Error(`Error transforming game data: ${error}`);
    }
  }
}
