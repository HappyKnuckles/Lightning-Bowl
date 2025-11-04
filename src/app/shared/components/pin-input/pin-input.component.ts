import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { NgIf } from '@angular/common';
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
  imports: [NgIf, IonButton, IonIcon],
})
export class PinInputComponent implements OnInit, OnChanges {
  @Input() frames: number[][] = [];
  @Input() throwsData: ThrowData[][] = [];
  @Input() currentFrameIndex = 0;
  @Input() currentThrowIndex = 0;

  @Output() throwConfirmed = new EventEmitter<PinThrowEvent>();
  @Output() throwUndone = new EventEmitter<void>();

  selectedPins: number[] = []; // Pins that were KNOCKED DOWN

  constructor() {
    addIcons({ checkmarkCircle, addCircle, arrowUndo });
  }

  ngOnInit(): void {
    this.selectedPins = [];
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Reset selected pins when current throw changes
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
    // If it's the first throw, all pins are available
    if (this.currentThrowIndex === 0) {
      return true;
    }

    // For second throw in frames 1-9
    if (this.currentFrameIndex < 9 && this.currentThrowIndex === 1) {
      // Only pins left standing from first throw are available
      const pinsLeftFromFirstThrow = this.getPinsLeftFromPreviousThrow();
      return pinsLeftFromFirstThrow.includes(pinNumber);
    }

    // For 10th frame
    if (this.currentFrameIndex === 9) {
      const firstThrow = this.frames[9][0];
      const secondThrow = this.frames[9][1];

      if (this.currentThrowIndex === 1) {
        // Second throw
        if (firstThrow === 10) {
          // X - all pins reset
          return true;
        }
        // Not strike - only remaining pins available
        const pinsLeftFromFirstThrow = this.getPinsLeftFromPreviousThrow();
        return pinsLeftFromFirstThrow.includes(pinNumber);
      } else if (this.currentThrowIndex === 2) {
        // Third throw
        if (firstThrow === 10) {
          // First was strike (X)
          if (secondThrow === 10) {
            // X X - all pins reset
            return true;
          } else {
            // X <10 - only remaining pins from second throw
            const pinsLeftFromSecondThrow = this.getPinsLeftFromPreviousThrow();
            return pinsLeftFromSecondThrow.includes(pinNumber);
          }
        } else {
          // First wasn't strike
          if (firstThrow + secondThrow === 10) {
            // <10 / - spare, all pins reset
            return true;
          } else {
            // <10 open - no third throw (shouldn't reach here)
            return false;
          }
        }
      }
    }

    return true;
  }

  isPinKnockedDownPreviously(pinNumber: number): boolean {
    // Returns true if this pin was knocked down in a previous throw of current frame
    if (this.currentThrowIndex === 0) {
      return false; // First throw, no previous throws
    }

    // Check if pin is NOT in the pins left standing from previous throw
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

    // If we don't have explicit data, we can't determine which pins are left
    // Return all pins as available (this shouldn't happen in normal flow)
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  }

  canRecordStrike(): boolean {
    // Strike only available on first throw in frames 1-9
    if (this.currentFrameIndex < 9) {
      return this.currentThrowIndex === 0;
    }

    // 10th frame strike logic
    const firstThrow = this.frames[9][0];
    const secondThrow = this.frames[9][1];

    if (this.currentThrowIndex === 0) {
      // First throw - always can strike
      return true;
    } else if (this.currentThrowIndex === 1) {
      // Second throw - can strike if first was strike
      return firstThrow === 10;
    } else if (this.currentThrowIndex === 2) {
      // Third throw - can strike if:
      // 1. X X (two strikes)
      // 2. <10 / (spare)
      if (firstThrow === 10 && secondThrow === 10) {
        return true; // X X
      }
      if (firstThrow !== 10 && firstThrow + secondThrow === 10) {
        return true; // <10 /
      }
      return false;
    }

    return false;
  }

  canRecordSpare(): boolean {
    // Spare only possible on second throw or third throw in 10th frame
    if (this.currentThrowIndex === 0) {
      return false;
    }

    if (this.currentFrameIndex < 9) {
      // Frames 1-9: can spare if first throw wasn't strike
      const firstThrow = this.frames[this.currentFrameIndex][0];
      return firstThrow !== undefined && firstThrow !== 10;
    } else {
      // 10th frame
      const firstThrow = this.frames[9][0];
      const secondThrow = this.frames[9][1];

      if (this.currentThrowIndex === 1) {
        // Second throw - can spare if first wasn't strike
        return firstThrow !== undefined && firstThrow !== 10;
      } else if (this.currentThrowIndex === 2) {
        // Third throw - can spare if:
        // 1. X <10 (strike then less than 10)
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

    // Record all available pins as knocked down
    const availablePins = this.getPinsLeftFromPreviousThrow();

    // For a valid strike, there should always be 10 pins available
    // If there aren't 10 pins, something is wrong with the logic
    if (availablePins.length !== 10) {
      console.error('Strike button pressed but not all 10 pins available:', availablePins);
      // Set to all 10 pins regardless
      this.selectedPins = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    } else {
      this.selectedPins = [...availablePins];
    }

    this.confirmPinThrow();
  }

  recordSpare(): void {
    if (!this.canRecordSpare()) return;

    // Select all remaining pins
    const availablePins = this.getPinsLeftFromPreviousThrow();
    this.selectedPins = [...availablePins];
    this.confirmPinThrow();
  }

  undoLastThrow(): void {
    this.throwUndone.emit();
  }

  canUndoLastThrow(): boolean {
    // Check if there's any throw to undo
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

    // Calculate pins left standing
    const availablePins = this.getPinsLeftFromPreviousThrow();
    const pinsLeftStanding = availablePins.filter((pin) => !this.selectedPins.includes(pin));

    // Emit the throw data
    this.throwConfirmed.emit({
      frameIndex: this.currentFrameIndex,
      throwIndex: this.currentThrowIndex,
      pinsKnockedDown,
      pinsLeftStanding,
    });

    // Clear selection
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
