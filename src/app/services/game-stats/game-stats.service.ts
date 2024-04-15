import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GameStatsService {
  totalStrikes: number = 0;
  totalSpares: number = 0;
  totalOpens: number = 0;
  pinCounts: number[] = Array(11).fill(0);
  missedCounts: number[] = Array(11).fill(0);
  averageStrikesPerGame: number = 0;
  strikePercentage: number = 0;
  sparePercentage: number = 0;
  openPercentage: number = 0;
  averageFirstCount: number = 0;
  averageScore: number = 0;
  totalScoreSum: number = 0;
  highGame: number = 0;
  constructor() { }

  async calculateStats(gameHistory: any[]): Promise<void> {
    this.totalStrikes = 0;
    this.totalSpares = 0;
    this.totalOpens = 0;
    this.pinCounts = Array(11).fill(0);
    this.missedCounts = Array(11).fill(0);
    let firstThrowCount = 0;

    gameHistory.forEach((game: { frames: any[] }) => {
      this.totalStrikes += this.countOccurrences(game.frames, frame => frame.throws[0].value === 10);
      this.totalSpares += this.countOccurrences(game.frames, frame => {
        const throws = frame.throws;
        return throws[0].value !== 10 && (throws[0].value + throws[1]?.value === 10 || throws[0].value === 10 && throws[1]?.value !== 10 && throws[1]?.value + throws[2]?.value === 10);
      });
      this.totalOpens += this.countOccurrences(game.frames, frame => frame.throws.length === 2 && frame.throws[0].value + (frame.throws[1]?.value || 0) < 10);

      game.frames.forEach(frame => {
        const throws = frame.throws;
        if (throws.length === 2 && throws[0].value + throws[1].value === 10) {
          const pinsLeft = 10 - throws[0].value;
          this.pinCounts[pinsLeft]++;
        } else if (throws.length === 3) {
          if (throws[1].value + throws[2].value === 10) {
            const pinsLeft = 10 - throws[1].value;
            this.pinCounts[pinsLeft]++;
          } else if (throws[0].value + throws[1].value === 10) {
            const pinsLeft = 10 - throws[0].value;
            this.pinCounts[pinsLeft]++;
          }
        }
      });

      // Additional logic for counting strikes in the 10th frame
      if (game.frames.length === 10) {
        const tenthFrame = game.frames[9]; // Get the 10th frame
        const throws = tenthFrame.throws;
        if (throws.length === 3 && throws[0].value === 10 && throws[1]?.value === 10) {
          this.totalStrikes += 2; // Increment by 2 if both throws are strikes
        } else if (throws.length === 3 && throws[0].value === 10) {
          this.totalStrikes++; // Increment by 1 if first throw is a strike
        }
      }

      game.frames.forEach(frame => {
        const throws = frame.throws;
        if (throws.length === 2 && throws[0].value + throws[1].value !== 10) {
          const pinsLeft = 10 - throws[0].value;
          this.missedCounts[pinsLeft]++;
        }
      });

      game.frames.forEach(frame => {
        const throws = frame.throws;
        firstThrowCount += throws[0].value;
      });
    });

    this.averageScore = this.getAverage(gameHistory);
    this.highGame = this.getGameWithHighestScore(gameHistory);
    const totalFrames = gameHistory.length * 10;
    const strikeChances = gameHistory.length * 12;
    this.averageStrikesPerGame = this.totalStrikes / gameHistory.length;
    this.strikePercentage = (this.totalStrikes / strikeChances) * 100;
    this.sparePercentage = (this.totalSpares / totalFrames) * 100;
    this.openPercentage = (this.totalOpens / totalFrames) * 100;
    this.averageFirstCount = firstThrowCount / totalFrames;
  }

  getAverage(gameHistory: any[]): number {
    this.totalScoreSum = gameHistory.reduce((sum, game) => sum + game.totalScore, 0);
    return this.totalScoreSum / gameHistory.length;
  }

  private countOccurrences(frames: any[], condition: (frame: any) => boolean): number {
    return frames.reduce((acc, frame) => acc + (condition(frame) ? 1 : 0), 0);
  }

  getGameWithHighestScore(gameHistory: any[]): number {
    let highestScore = -1;

    gameHistory.forEach((game: { totalScore: number }) => {
      if (game.totalScore > highestScore) {
        highestScore = game.totalScore;
      }
    });

    return highestScore;
  }
}