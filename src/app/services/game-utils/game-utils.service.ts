import { Injectable } from '@angular/core';
import { Game } from 'src/app/models/game.model';
import { BowlingCalculatorService } from '../bowling-calculator/bowling-calculator.service';

@Injectable({
  providedIn: 'root',
})
export class GameUtilsService {
  constructor() { }

  isGameValid(bowlingService?: BowlingCalculatorService, game?: Game): boolean {
    const frames = game ? game.frames : bowlingService!.frames;
    let isValid = true;
    frames.forEach((frame: any, index: number) => {
      const throws = Array.isArray(frame) ? frame : frame.throws.map((t: { value: any }) => t.value);
      if (index < 9) {
        // For frames 1 to 9
        const frameValid =
          (throws[0] === 10 && isNaN(parseInt(throws[1]))) ||
          (throws[0] !== 10 &&
            throws.reduce((acc: any, curr: any) => acc + curr, 0) <= 10 &&
            throws.every((throwValue: number) => throwValue >= 0 && throwValue <= 10));
        if (!frameValid) {
          isValid = false;
          frame.isInvalid = true;
        } else {
          frame.isInvalid = false;
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
          frame.isInvalid = true;
        } else {
          frame.isInvalid = false;
        }
      }
    });

    return isValid;
  }

  parseInputValue(inputValue: string, frameIndex: number, inputIndex: number, bowlingService: BowlingCalculatorService): number {
    if (frameIndex < 9) {
      // Frames 1-9
      if (inputValue === 'X' || inputValue === 'x') {
        return 10; // Strike
      } else if (inputValue === '/') {
        const firstThrow = bowlingService.frames[frameIndex][0] || 0;
        return 10 - firstThrow; // Spare
      }
    } else {
      // 10th Frame
      const firstThrow = bowlingService.frames[frameIndex][0] || 0;
      const secondThrow = bowlingService.frames[frameIndex][1] || 0;

      switch (inputIndex) {
        case 0: // First throw of 10th frame
          if (inputValue === 'X' || inputValue === 'x') {
            return 10; // Strike
          }
          break;
        case 1: // Second throw of 10th frame
          if (firstThrow === 10) {
            // First throw was a strike, any value (0-10) is valid
            if (inputValue === 'X' || inputValue === 'x') {
              return 10; // Strike
            }
          } else if (inputValue === '/') {
            // First throw was not a strike, use spare notation
            return 10 - firstThrow;
          }
          break;

        case 2: // Third throw of 10th frame
          if (firstThrow === 10) {
            // If first throw is a strike, handle second throw conditions
            if (secondThrow === 10 && (inputValue === 'X' || inputValue === 'x')) {
              return 10; // Double strike
            } else if (secondThrow !== 10 && inputValue === '/') {
              return 10 - secondThrow; // Spare after a non-strike second throw
            }
          } else if (firstThrow + secondThrow === 10) {
            // First two throws were a spare, any value (0-10) is valid
            if (inputValue === 'X' || inputValue === 'x') {
              return 10; // Strike
            }
          }
          break;
      }
    }
    return parseInt(inputValue, 10);
  }

  parseBowlingScores(input: string, username: string): { frames: any[]; frameScores: number[]; totalScore: number } {
    const lines = input.split('\n').filter((line) => line.trim() !== '');

    const userIndex = lines.findIndex((line) => line.toLowerCase().includes(username.toLowerCase()));

    const linesAfterUsername = userIndex >= 0 ? lines.slice(userIndex + 1) : [];

    const nextNonXLineIndex = linesAfterUsername.findIndex((line) => /^[a-wyz]/i.test(line));

    const relevantLines = nextNonXLineIndex >= 0 ? linesAfterUsername.slice(0, nextNonXLineIndex) : linesAfterUsername;

    if (relevantLines.length < 2) {
      throw new Error(`Insufficient score data for user ${username}`);
    }

    let throwValues = relevantLines[0].split('');
    let frameScores;

    if (throwValues.length < 12) {
      throwValues = throwValues.concat(relevantLines[1].split(''));
      frameScores = relevantLines.slice(2).map((line) => line.split(' ').map(Number));
    } else {
      frameScores = relevantLines.slice(1).map((line) => line.split(' ').map(Number));
    }

    frameScores = frameScores.flat().sort((a, b) => a - b);
    if (frameScores.length > 10) {
      frameScores = frameScores.slice(0, 10);
    }
    // if (frameScores[9] === frameScores[10]) {
    //   frameScores.splice(frameScores.length - 1, 1);
    // }

    throwValues = throwValues.filter((value) => value.trim() !== '');
    let prevValue: number | undefined;

    throwValues = throwValues.map((value) => {
      if (value === 'X' || value === '×') {
        prevValue = 10;
        return '10';
      } else if (value === '-') {
        prevValue = 0;
        return '0';
      } else if (value === '/') {
        if (prevValue !== undefined) {
          return (10 - prevValue).toString();
        }
        return '';
      } else {
        prevValue = parseInt(value, 10);
        return value;
      }
    });

    const frames: any[] = [];
    let currentFrame: any[] = [];
    
    throwValues.forEach((value) => {
      const intValue = parseInt(value, 10);
      const isNinthFrame = frames.length === 9;
      if (frames.length < 10) {
        currentFrame.push(intValue);
        if ((currentFrame.length === 2 && !isNinthFrame) || (isNinthFrame && currentFrame.length === 3)) {
          frames.push([...currentFrame]);
          currentFrame = [];
        } else if (intValue === 10 && !isNinthFrame) {
          frames.push([...currentFrame]);
          currentFrame = [];
        }
      }
    });

    if (currentFrame.length > 0) {
      frames.push([...currentFrame]);
    }

    const totalScore = frameScores[9];

    return { frames, frameScores, totalScore };
  }

  isValidFrameScore(inputValue: number, frameIndex: number, inputIndex: number, bowlingService: BowlingCalculatorService): boolean {
    if (inputIndex === 1) {
      if (bowlingService.frames[frameIndex][0] === undefined) {
        return false;
      }
    }

    if (frameIndex < 9) {
      // Regular frames (1-9)
      const firstThrow = bowlingService.frames[frameIndex][0] || 0;
      const secondThrow = inputIndex === 1 ? inputValue : bowlingService.frames[frameIndex][1] || 0;
      if (inputIndex === 0 && secondThrow !== undefined) {
        return inputValue + secondThrow <= 10;
      }
      return firstThrow + secondThrow <= 10;
    } else {
      // 10th frame
      const firstThrow = bowlingService.frames[frameIndex][0] || 0;
      const secondThrow = bowlingService.frames[frameIndex][1] || 0;
      switch (inputIndex) {
        case 0:
          return inputValue <= 10;
        case 1:
          if (firstThrow === 10) {
            // First throw is a strike, second throw can be any value 0-10
            return inputValue <= 10;
          } else {
            // First throw is not a strike, second throw + first throw must be <= 10
            return firstThrow + inputValue <= 10;
          }
        case 2:
          if (firstThrow === 10) {
            // First throw is a strike
            if (secondThrow === 10) {
              // Second throw is also a strike, third throw can be any value 0-10
              return inputValue <= 10;
            } else {
              // Second throw is not a strike, third throw can only be 10 - second throw
              return inputValue <= 10 - secondThrow;
            }
          } else if (firstThrow + secondThrow === 10) {
            // First two throws are a spare, third throw can be any value 0-10
            return inputValue <= 10;
          } else {
            // First two throws are not a strike or spare, no third throw allowed
            return false;
          }
        default:
          return false;
      }
    }
  }
}
