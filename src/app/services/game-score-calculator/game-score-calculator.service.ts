import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GameScoreCalculatorService {
  frameScores: number[] = [];
  frames: number[][] = [[]];
  totalScore = 0;
  rolls: number[] = Array.from({ length: 21 }, () => 0);
  maxScore = 300; // Maximum possible score is 300 for 10 strikes

  constructor() {
    this.addFrame();
  }

  addFrame(): void {
    for (let i = 1; i < 10; i++) {
      this.frames.push([]);
    }
  }

  clearRolls(): void {
    // Reset rolls array
    this.rolls = Array.from({ length: 21 }, () => 0);
    this.frames = [[]];
    this.frameScores = [];
    this.addFrame();
    // Recalculate the score and max score
    this.totalScore = 0;
    this.maxScore = 300;
  }

  calculateScore(): number {
    let index = 0;
    this.frames.forEach((frame) => {
      frame.forEach((value) => {
        this.rolls[index++] = value;
      });
    });

    let score = 0;
    let frameIndex = 0;

    for (let frame = 0; frame < 10; frame++) {
      if (this.isStrike(this.rolls[frameIndex]) && this.rolls[frameIndex] != null && this.rolls[frameIndex + 1] != null) {
        score += 10 + this.strikeBonus(frameIndex, this.rolls);
        frameIndex++;
      } else if (
        this.isSpare(this.rolls[frameIndex], this.rolls[frameIndex + 1]) &&
        this.rolls[frameIndex] != null &&
        this.rolls[frameIndex + 1] != null
      ) {
        score += 10 + this.spareBonus(frameIndex, this.rolls);
        frameIndex += 2;
      } else if (this.rolls[frameIndex] != null && this.rolls[frameIndex + 1] != null) {
        score += this.sumOfBallsInFrame(frameIndex, this.rolls);
        frameIndex += 2;
      }
      this.frameScores[frame] = score;
    }
    this.totalScore = score;
    return this.totalScore;
  }

  calculateMaxScore(): number {
    this.maxScore = 300;

    for (let i = 0; i < this.frames.length; i++) {
      // Fix loop condition to iterate correctly over frames
      if (!this.frames[i] || this.frames[i].length === 0) {
        break; // Exit if the frame is empty or undefined
      }

      const firstThrow = this.frames[i][0];
      const secondThrow = this.frames[i][1];

      // Handle frames before the last frame (0-8)
      if (i < 9) {
        // Case for first frame
        if (i === 0) {
          if (secondThrow !== undefined) {
            if (this.isStrike(firstThrow)) {
              // Only manipulation for a strike in the first frame
              continue;
            } else if (this.isSpare(firstThrow, secondThrow)) {
              this.maxScore -= 10;
            } else {
              this.maxScore -= 30 - (firstThrow + secondThrow);
            }
            continue; // Exit to ensure no other manipulations occur
          }
        }
        // Handle other frames (1-8)
        else {
          if (secondThrow !== undefined) {
            if (i >= 2 && this.isPreviousStrike(i - 1) && this.isPreviousStrike(i)) {
              if (this.isSpare(firstThrow, secondThrow)) {
                this.maxScore -= 30 - firstThrow;
              } else {
                this.maxScore -= 60 - (firstThrow + 2 * (firstThrow + secondThrow));
              }
              continue;
            }

            if (i >= 1) {
              if (firstThrow !== 10) {
                if (this.isPreviousStrike(i) && this.isSpare(firstThrow, secondThrow)) {
                  this.maxScore -= 20;
                } else if (this.isPreviousStrike(i) && !this.isSpare(firstThrow, secondThrow)) {
                  this.maxScore -= 50 - 2 * (firstThrow + secondThrow);
                } else if (this.isPreviousSpare(i) && this.isSpare(firstThrow, secondThrow)) {
                  this.maxScore -= 20 - firstThrow;
                } else if (this.isPreviousSpare(i) && !this.isSpare(firstThrow, secondThrow)) {
                  this.maxScore -= 40 - (2 * firstThrow + secondThrow);
                } else if (!this.isPreviousSpare(i) && this.isSpare(firstThrow, secondThrow)) {
                  this.maxScore -= 10;
                } else if (!this.isPreviousSpare(i) && this.isStrike(firstThrow)) {
                  continue;
                } else {
                  this.maxScore -= 30 - (firstThrow + secondThrow);
                }
                continue;
              }
            }
          }
        }
      }
      // Handle the last frame (index 9)
      else {
        const thirdThrow = this.frames[i][2];
        if (thirdThrow !== undefined) {
          this.maxScore = this.totalScore;
          continue;
        }

        if (secondThrow !== undefined) {
          if (this.isStrike(firstThrow)) {
            if (this.isPreviousStrike(i) && !this.isStrike(secondThrow)) {
              this.maxScore -= 20 - secondThrow;
            } else if (!this.isPreviousStrike(i) && !this.isStrike(secondThrow)) {
              this.maxScore -= 10;
            }
          } else if (!this.isSpare(firstThrow, secondThrow)) {
            this.maxScore = this.totalScore;
          }
          continue;
        }

        // Handle cases based on previous strikes or spares
        if (this.isPreviousSpare(i) && !this.isPreviousStrike(i)) {
          if (!this.isStrike(firstThrow)) {
            this.maxScore -= 20 - firstThrow;
          }
        } else if (!this.isPreviousStrike(i) && !this.isPreviousSpare(i)) {
          if (!this.isStrike(firstThrow)) {
            this.maxScore -= 10;
          }
        } else if (this.isPreviousStrike(i - 1) && this.isPreviousStrike(i) && !this.isPreviousSpare(i)) {
          if (!this.isStrike(firstThrow)) {
            this.maxScore -= 30 - firstThrow;
          }
        } else if (this.isPreviousStrike(i) && !this.isPreviousSpare(i)) {
          if (!this.isStrike(firstThrow)) {
            this.maxScore -= 20;
          }
        }
      }
    }

    return this.maxScore;
  }

  getSeriesMaxScore(index: number, maxScores: number[]): number {
    if (index === 1) {
      return maxScores[1] + maxScores[2] + maxScores[3];
    }
    if (index === 2) {
      return maxScores[4] + maxScores[5] + maxScores[6] + maxScores[7];
    }
    if (index === 3) {
      return maxScores[8] + maxScores[9] + maxScores[10] + maxScores[11] + maxScores[12];
    }
    return 900;
  }

  getSeriesCurrentScore(index: number, totalScores: number[]): number {
    if (index === 1) {
      return totalScores[1] + totalScores[2] + totalScores[3];
    }
    if (index === 2) {
      return totalScores[4] + totalScores[5] + totalScores[6] + totalScores[7];
    }
    if (index === 3) {
      return totalScores[8] + totalScores[9] + totalScores[10] + totalScores[11] + totalScores[12];
    }
    return 0;
  }

  isStrike(roll: number): boolean {
    return roll === 10;
  }

  isPreviousStrike(index: number): boolean {
    if (this.frames[index - 1][0] === 10) {
      return true;
    }
    return false;
  }

  isPreviousSpare(index: number): boolean {
    if (this.frames[index - 1][0] + this.frames[index - 1][1] === 10) {
      return true;
    }
    return false;
  }

  isSpare(roll1: number, roll2: number): boolean {
    return roll1 + roll2 === 10;
  }

  sumOfBallsInFrame(frameIndex: number, rolls: number[]): number {
    return rolls[frameIndex] + rolls[frameIndex + 1];
  }

  spareBonus(frameIndex: number, rolls: number[]): number {
    return rolls[frameIndex + 2];
  }

  strikeBonus(frameIndex: number, rolls: number[]): number {
    return rolls[frameIndex + 1] + rolls[frameIndex + 2];
  }
}
