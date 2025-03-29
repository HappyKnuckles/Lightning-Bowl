import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GameScoreCalculatorService {
  private seriesConfig: Record<number, number[]> = {
    1: [1, 2, 3],
    2: [4, 5, 6, 7],
    3: [8, 9, 10, 11, 12],
    4: [13, 14, 15, 16, 17, 18],
  };
  calculateScore(frames: number[][]): { totalScore: number; frameScores: number[] } {
    const rolls: number[] = [];
    frames.forEach((frame) => {
      frame.forEach((value) => {
        rolls.push(value);
      });
    });

    let totalScore = 0;
    const frameScores: number[] = Array(10).fill(0);
    let frameIndex = 0;

    for (let frame = 0; frame < 10; frame++) {
      if (this.isStrike(rolls[frameIndex])) {
        totalScore += 10 + this.strikeBonus(frameIndex, rolls);
        frameScores[frame] = totalScore;
        frameIndex++;
      } else if (this.isSpare(rolls[frameIndex], rolls[frameIndex + 1])) {
        totalScore += 10 + this.spareBonus(frameIndex, rolls);
        frameScores[frame] = totalScore;
        frameIndex += 2;
      } else {
        totalScore += this.sumOfBallsInFrame(frameIndex, rolls);
        frameScores[frame] = totalScore;
        frameIndex += 2;
      }
    }

    return { totalScore, frameScores };
  }

  calculateMaxScore(frames: number[][], currentTotalScore: number): number {
    let maxScore = 300;

    for (let i = 0; i < frames.length; i++) {
      if (!frames[i] || frames[i].length === 0) {
        break;
      }

      const firstThrow = frames[i][0];
      const secondThrow = frames[i][1];

      // Handle frames 0-8 (non-final frames)
      if (i < 9) {
        // Special handling for the first frame.
        if (i === 0) {
          if (secondThrow !== undefined) {
            if (this.isStrike(firstThrow)) {
              // Nothing to modify for a strike in the first frame.
              continue;
            } else if (this.isSpare(firstThrow, secondThrow)) {
              maxScore -= 10;
            } else {
              maxScore -= 30 - (firstThrow + secondThrow);
            }
            continue;
          }
        } else {
          if (secondThrow !== undefined) {
            if (i >= 2 && this.isPreviousStrike(frames, i - 1) && this.isPreviousStrike(frames, i)) {
              if (this.isSpare(firstThrow, secondThrow)) {
                maxScore -= 30 - firstThrow;
              } else {
                maxScore -= 60 - (firstThrow + 2 * (firstThrow + secondThrow));
              }
              continue;
            }
            if (i >= 1) {
              if (firstThrow !== 10) {
                if (this.isPreviousStrike(frames, i) && this.isSpare(firstThrow, secondThrow)) {
                  maxScore -= 20;
                } else if (this.isPreviousStrike(frames, i) && !this.isSpare(firstThrow, secondThrow)) {
                  maxScore -= 50 - 2 * (firstThrow + secondThrow);
                } else if (this.isPreviousSpare(frames, i) && this.isSpare(firstThrow, secondThrow)) {
                  maxScore -= 20 - firstThrow;
                } else if (this.isPreviousSpare(frames, i) && !this.isSpare(firstThrow, secondThrow)) {
                  maxScore -= 40 - (2 * firstThrow + secondThrow);
                } else if (!this.isPreviousSpare(frames, i) && this.isSpare(firstThrow, secondThrow)) {
                  maxScore -= 10;
                } else if (!this.isPreviousSpare(frames, i) && this.isStrike(firstThrow)) {
                  continue;
                } else {
                  maxScore -= 30 - (firstThrow + secondThrow);
                }
                continue;
              }
            }
          }
        }
      }
      // Handle the last frame (index 9)
      else {
        const thirdThrow = frames[i][2];
        if (thirdThrow !== undefined) {
          maxScore = currentTotalScore;
          continue;
        }
        if (secondThrow !== undefined) {
          if (this.isStrike(firstThrow)) {
            if (this.isPreviousStrike(frames, i) && !this.isStrike(secondThrow)) {
              maxScore -= 20 - secondThrow;
            } else if (!this.isPreviousStrike(frames, i) && !this.isStrike(secondThrow)) {
              maxScore -= 10;
            }
          } else if (!this.isSpare(firstThrow, secondThrow)) {
            maxScore = currentTotalScore;
          }
          continue;
        }
        if (this.isPreviousSpare(frames, i) && !this.isPreviousStrike(frames, i)) {
          if (!this.isStrike(firstThrow)) {
            maxScore -= 20 - firstThrow;
          }
        } else if (!this.isPreviousStrike(frames, i) && !this.isPreviousSpare(frames, i)) {
          if (!this.isStrike(firstThrow)) {
            maxScore -= 10;
          }
        } else if (this.isPreviousStrike(frames, i - 1) && this.isPreviousStrike(frames, i) && !this.isPreviousSpare(frames, i)) {
          if (!this.isStrike(firstThrow)) {
            maxScore -= 30 - firstThrow;
          }
        } else if (this.isPreviousStrike(frames, i) && !this.isPreviousSpare(frames, i)) {
          if (!this.isStrike(firstThrow)) {
            maxScore -= 20;
          }
        }
      }
    }

    return maxScore;
  }

  getSeriesScore(index: number, scores: number[], defaultValue = 0): number {
    const indices = this.seriesConfig[index];
    if (!indices) {
      return defaultValue;
    }

    return indices.reduce((sum: number, gameIndex: number) => sum + (scores[gameIndex] || 0), 0);
  }

  getSeriesMaxScore(index: number, maxScores: number[]): number {
    return this.getSeriesScore(index, maxScores, 900);
  }

  getSeriesCurrentScore(index: number, totalScores: number[]): number {
    return this.getSeriesScore(index, totalScores, 0);
  }

  private isStrike(roll: number): boolean {
    return roll === 10;
  }

  private isSpare(roll1: number, roll2: number): boolean {
    return roll1 + roll2 === 10;
  }

  private isPreviousStrike(frames: number[][], index: number): boolean {
    return !!(frames[index - 1] && frames[index - 1][0] === 10);
  }

  private isPreviousSpare(frames: number[][], index: number): boolean {
    return !!(frames[index - 1] && frames[index - 1][0] + frames[index - 1][1] === 10);
  }

  private sumOfBallsInFrame(frameIndex: number, rolls: number[]): number {
    return (rolls[frameIndex] || 0) + (rolls[frameIndex + 1] || 0);
  }

  private spareBonus(frameIndex: number, rolls: number[]): number {
    return rolls[frameIndex + 2] || 0;
  }

  private strikeBonus(frameIndex: number, rolls: number[]): number {
    return (rolls[frameIndex + 1] || 0) + (rolls[frameIndex + 2] || 0);
  }
}
