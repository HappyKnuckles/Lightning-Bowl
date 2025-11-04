import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircle, addCircle, arrowUndo } from 'ionicons/icons';

export interface ThrowData {
  value: number;
  pinsLeftStanding: number[];
}

export interface PinThrowEvent {
  frameIndex: number;
  throwIndex: number;
  pinsKnockedDown: number;
  pinsLeftStanding: number[];
}

@Component({
  selector: 'app-pin-input',
  templateUrl: './pin-input.component.html',
  styleUrls: ['./pin-input.component.scss'],
  standalone: true,
  imports: [IonButton, IonIcon],
})
export class PinInputComponent implements OnInit, OnChanges {
  @Input() frames: number[][] = [];
  @Input() throwsData: ThrowData[][] = [];
  @Input() currentFrameIndex = 0;
  @Input() currentThrowIndex = 0;

  @Output() throwConfirmed = new EventEmitter<PinThrowEvent>();
  @Output() throwUndone = new EventEmitter<void>();

  selectedPins: number[] = [];

  constructor() {
    addIcons({ checkmarkCircle, addCircle, arrowUndo });
  }

  ngOnInit(): void {
    this.selectedPins = [];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentFrameIndex'] || changes['currentThrowIndex']) {
      this.selectedPins = [];
    }
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
    if (this.currentThrowIndex === 0) {
      return true;
    }

    if (this.currentFrameIndex < 9 && this.currentThrowIndex === 1) {
      const pinsLeftFromFirstThrow = this.getPinsLeftFromPreviousThrow();
      return pinsLeftFromFirstThrow.includes(pinNumber);
    }

    if (this.currentFrameIndex === 9) {
      const firstThrow = this.frames[9][0];
      const secondThrow = this.frames[9][1];

      if (this.currentThrowIndex === 1) {
        if (firstThrow === 10) {
          return true;
        }
        const pinsLeftFromFirstThrow = this.getPinsLeftFromPreviousThrow();
        return pinsLeftFromFirstThrow.includes(pinNumber);
      } else if (this.currentThrowIndex === 2) {
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
    if (this.currentThrowIndex === 0) {
      return false;
    }

    return !this.isPinAvailable(pinNumber);
  }

  getPinsLeftFromPreviousThrow(): number[] {
    if (this.currentThrowIndex === 0) {
      return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    }

    const prevThrowIndex = this.currentThrowIndex - 1;
    if (this.throwsData[this.currentFrameIndex] && this.throwsData[this.currentFrameIndex][prevThrowIndex]) {
      return this.throwsData[this.currentFrameIndex][prevThrowIndex].pinsLeftStanding;
    }

    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  }

  canRecordStrike(): boolean {
    if (this.currentFrameIndex < 9) {
      return this.currentThrowIndex === 0;
    }

    const firstThrow = this.frames[9][0];
    const secondThrow = this.frames[9][1];

    if (this.currentThrowIndex === 0) {
      return true;
    } else if (this.currentThrowIndex === 1) {
      return firstThrow === 10;
    } else if (this.currentThrowIndex === 2) {
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
    if (this.currentThrowIndex === 0) {
      return false;
    }

    if (this.currentFrameIndex < 9) {
      const firstThrow = this.frames[this.currentFrameIndex][0];
      return firstThrow !== undefined && firstThrow !== 10;
    } else {
      const firstThrow = this.frames[9][0];
      const secondThrow = this.frames[9][1];

      if (this.currentThrowIndex === 1) {
        return firstThrow !== undefined && firstThrow !== 10;
      } else if (this.currentThrowIndex === 2) {
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
      const frame = this.frames[frameIndex];
      if (frame && frame[0] !== undefined) {
        return true;
      }
    }
    return false;
  }

  confirmPinThrow(): void {
    const pinsKnockedDown = this.selectedPins.length;

    const availablePins = this.getPinsLeftFromPreviousThrow();
    const pinsLeftStanding = availablePins.filter((pin) => !this.selectedPins.includes(pin));

    this.throwConfirmed.emit({
      frameIndex: this.currentFrameIndex,
      throwIndex: this.currentThrowIndex,
      pinsKnockedDown,
      pinsLeftStanding,
    });

    this.selectedPins = [];
  }

  getCurrentFrameDisplay(): string {
    if (this.currentFrameIndex < 9) {
      return `Frame ${this.currentFrameIndex + 1}, Throw ${this.currentThrowIndex + 1}`;
    } else {
      return `Frame 10, Throw ${this.currentThrowIndex + 1}`;
    }
  }
}
