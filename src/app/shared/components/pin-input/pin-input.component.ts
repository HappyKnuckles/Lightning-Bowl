import { Component, input, output, effect } from '@angular/core';
import { IonButton, IonIcon, IonGrid, IonRow, IonCol, IonInput } from '@ionic/angular/standalone';
import { NgFor, NgIf } from '@angular/common';
import { addIcons } from 'ionicons';
import { checkmarkCircle, addCircle, arrowUndo } from 'ionicons/icons';
import { PinDeckFrameRowComponent } from '../pin-deck-frame-row/pin-deck-frame-row.component';
import { Game } from 'src/app/core/models/game.model';

export interface ThrowData {
  value: number;
  pinsLeftStanding: number[];
  pinsKnockedDown: number[];
}

export interface PinThrowEvent {
  frameIndex: number;
  throwIndex: number;
  pinsKnockedDown: number;
  pinsKnockedDownNumbers: number[];
  pinsLeftStanding: number[];
}

@Component({
  selector: 'app-pin-input',
  templateUrl: './pin-input.component.html',
  styleUrls: ['./pin-input.component.scss'],
  standalone: true,
  imports: [IonButton, IonIcon, IonGrid, IonRow, IonCol, IonInput, NgFor, NgIf, PinDeckFrameRowComponent],
})
export class PinInputComponent {
  // Input signals
  frames = input<number[][]>([]);
  throwsData = input<ThrowData[][]>([]);
  currentFrameIndex = input<number>(0);
  currentThrowIndex = input<number>(0);
  game = input.required<Game>();
  maxScore = input<number>(300);

  // Output signals
  throwConfirmed = output<PinThrowEvent>();
  throwUndone = output<void>();

  selectedPins: number[] = [];

  constructor() {
    addIcons({ checkmarkCircle, addCircle, arrowUndo });

    effect(() => {
      this.currentFrameIndex();
      this.currentThrowIndex();

      this.selectedPins = [];
    });
  }

  togglePin(pinNumber: number): void {
    const index = this.selectedPins.indexOf(pinNumber);
    if (index > -1) {
      this.selectedPins.splice(index, 1);
    } else {
      this.selectedPins.push(pinNumber);
    }
  }

  isPinSelected(pinNumber: number): boolean {
    return this.selectedPins.includes(pinNumber);
  }

  isPinAvailable(pinNumber: number): boolean {
    if (this.currentThrowIndex() === 0) {
      return true;
    }

    if (this.currentFrameIndex() < 9 && this.currentThrowIndex() === 1) {
      const pinsLeftFromFirstThrow = this.getPinsLeftFromPreviousThrow();
      return pinsLeftFromFirstThrow.includes(pinNumber);
    }

    if (this.currentFrameIndex() === 9) {
      const firstThrow = this.frames()[9][0];
      const secondThrow = this.frames()[9][1];

      if (this.currentThrowIndex() === 1) {
        if (firstThrow === 10) {
          return true;
        }
        const pinsLeftFromFirstThrow = this.getPinsLeftFromPreviousThrow();
        return pinsLeftFromFirstThrow.includes(pinNumber);
      } else if (this.currentThrowIndex() === 2) {
        if (firstThrow === 10) {
          if (secondThrow === 10) {
            return true;
          } else {
            const pinsLeftFromSecondThrow = this.getPinsLeftFromPreviousThrow();
            return pinsLeftFromSecondThrow.includes(pinNumber);
          }
        } else {
          if (firstThrow + secondThrow === 10) {
            return true;
          } else {
            return false;
          }
        }
      }
    }

    return true;
  }

  isPinKnockedDownPreviously(pinNumber: number): boolean {
    if (this.currentThrowIndex() === 0) {
      return false;
    }

    return !this.isPinAvailable(pinNumber);
  }

  canRecordStrike(): boolean {
    if (this.currentFrameIndex() < 9) {
      return this.currentThrowIndex() === 0;
    }

    const firstThrow = this.frames()[9][0];
    const secondThrow = this.frames()[9][1];

    if (this.currentThrowIndex() === 0) {
      return true;
    } else if (this.currentThrowIndex() === 1) {
      return firstThrow === 10;
    } else if (this.currentThrowIndex() === 2) {
      if (firstThrow === 10 && secondThrow === 10) {
        return true;
      }
      if (firstThrow !== 10 && firstThrow + secondThrow === 10) {
        return true;
      }
      return false;
    }

    return false;
  }

  canRecordSpare(): boolean {
    if (this.currentThrowIndex() === 0) {
      return false;
    }

    if (this.currentFrameIndex() < 9) {
      const firstThrow = this.frames()[this.currentFrameIndex()][0];
      return firstThrow !== undefined && firstThrow !== 10;
    } else {
      const firstThrow = this.frames()[9][0];
      const secondThrow = this.frames()[9][1];

      if (this.currentThrowIndex() === 1) {
        return firstThrow !== undefined && firstThrow !== 10;
      } else if (this.currentThrowIndex() === 2) {
        if (firstThrow === 10 && secondThrow !== undefined && secondThrow !== 10) {
          return true;
        }
        return false;
      }
    }

    return false;
  }

  recordStrike(): void {
    if (!this.canRecordStrike()) return;

    const availablePins = this.getPinsLeftFromPreviousThrow();

    if (availablePins.length !== 10) {
      this.selectedPins = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    } else {
      this.selectedPins = [...availablePins];
    }

    this.confirmPinThrow();
  }

  recordSpare(): void {
    if (!this.canRecordSpare()) return;

    const availablePins = this.getPinsLeftFromPreviousThrow();

    this.selectedPins = [...availablePins];

    this.confirmPinThrow();
  }

  undoLastThrow(): void {
    this.throwUndone.emit();
  }

  canUndoLastThrow(): boolean {
    for (let frameIndex = 0; frameIndex < 10; frameIndex++) {
      const frame = this.frames()[frameIndex];
      if (frame && frame[0] !== undefined) {
        return true;
      }
    }
    return false;
  }

  confirmPinThrow(): void {
    const pinsKnockedDown = this.selectedPins.length;
    const pinsKnockedDownNumbers = [...this.selectedPins];

    const availablePins = this.getPinsLeftFromPreviousThrow();
    const pinsLeftStanding = availablePins.filter((pin) => !this.selectedPins.includes(pin));

    this.throwConfirmed.emit({
      frameIndex: this.currentFrameIndex(),
      throwIndex: this.currentThrowIndex(),
      pinsKnockedDown,
      pinsKnockedDownNumbers,
      pinsLeftStanding,
    });

    this.selectedPins = [];
  }

  getFrameValue(frameIndex: number, throwIndex: number): string {
    const frame = this.frames()[frameIndex];
    const val = frame[throwIndex];

    if (val === undefined || val === null) {
      return '';
    }

    const firstBall = frame[0];
    const isTenth = frameIndex === 9;

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
      if (firstBall !== undefined && firstBall !== 10 && firstBall + val === 10) {
        return '/';
      }
      return val === 10 ? 'X' : val.toString();
    }

    if (throwIndex === 2) {
      if (firstBall === 10) {
        if (secondBall === 10) {
          return val === 10 ? 'X' : val.toString();
        }
        return secondBall !== undefined && secondBall + val === 10 ? '/' : val.toString();
      }
      return val === 10 ? 'X' : val.toString();
    }

    return val.toString();
  }

  isNumber(value: unknown): boolean {
    return typeof value === 'number' && !isNaN(value);
  }

  isGameComplete(): boolean {
    const frames = this.frames();
    if (!frames || frames.length < 10) {
      return false;
    }

    const frame10 = frames[9];

    if (frame10[0] === undefined || frame10[1] === undefined) {
      return false;
    }

    if (frame10[0] === 10 || frame10[0] + frame10[1] === 10) {
      return frame10[2] !== undefined;
    }

    return true;
  }

  private getPinsLeftFromPreviousThrow(): number[] {
    if (this.currentThrowIndex() === 0) {
      return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    }

    const prevThrowIndex = this.currentThrowIndex() - 1;

    if (this.throwsData()[this.currentFrameIndex()] && this.throwsData()[this.currentFrameIndex()][prevThrowIndex]) {
      return this.throwsData()[this.currentFrameIndex()][prevThrowIndex].pinsLeftStanding;
    }

    const frame = this.frames()[this.currentFrameIndex()];
    if (frame && frame[prevThrowIndex] !== undefined) {
      const pinsKnockedDown = frame[prevThrowIndex];
      const allPins = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      if (this.currentFrameIndex() === 9) {
        if (prevThrowIndex === 0 && pinsKnockedDown === 10) {
          return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        } else if (prevThrowIndex === 1 && frame[0] === 10 && pinsKnockedDown === 10) {
          return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        } else if (prevThrowIndex === 1 && frame[0] !== 10) {
          const totalKnockedDown = frame[0] + pinsKnockedDown;
          return allPins.slice(totalKnockedDown);
        } else if (prevThrowIndex === 1 && frame[0] === 10) {
          return allPins.slice(pinsKnockedDown);
        }
      }

      return allPins.slice(pinsKnockedDown);
    }

    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  }
}
