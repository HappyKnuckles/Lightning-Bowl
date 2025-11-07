import { Component, input, output, effect, inject } from '@angular/core';
import { IonButton, IonIcon, IonGrid, IonRow, IonCol, IonInput } from '@ionic/angular/standalone';
import { NgFor, NgIf } from '@angular/common';
import { addIcons } from 'ionicons';
import { closeCircleOutline, arrowUndoOutline, checkmarkOutline } from 'ionicons/icons';
import { PinDeckFrameRowComponent } from '../pin-deck-frame-row/pin-deck-frame-row.component';
import { Game } from 'src/app/core/models/game.model';
import { BowlingGameValidationService } from 'src/app/core/services/game-utils/bowling-game-validation.service';
import { BowlingFrameFormatterService } from 'src/app/core/services/game-utils/bowling-frame-formatter.service';

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
  selectHitPinsFlag = input<boolean>(true);

  // Output signals
  throwConfirmed = output<PinThrowEvent>();
  throwUndone = output<void>();

  selectedPins: number[] = [];
  private validationService = inject(BowlingGameValidationService);
  private formatterService = inject(BowlingFrameFormatterService);

  // Memoized State Properties for Performance
  private memoizedPinsLeftStanding: number[] = [];
  private memoizedPinsKnockedDownPreviously: number[] = [];

  constructor() {
    addIcons({ checkmarkOutline, arrowUndoOutline, closeCircleOutline });

    effect(() => {
      this.currentFrameIndex();
      this.currentThrowIndex();
      this.frames();
      this.throwsData();

      this.memoizedPinsLeftStanding = this.validationService.getPinsLeftFromPreviousThrow(
        this.currentFrameIndex(),
        this.currentThrowIndex(),
        this.frames(),
        this.throwsData(),
      );

      const allPins = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      this.memoizedPinsKnockedDownPreviously = allPins.filter((pin) => !this.memoizedPinsLeftStanding.includes(pin));

      this.selectedPins = [];
    });
  }

  togglePin(pinNumber: number): void {
    if (!this.memoizedPinsLeftStanding.includes(pinNumber)) {
      return;
    }

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
    return this.memoizedPinsLeftStanding.includes(pinNumber);
  }

  isPinKnockedDownPreviously(pinNumber: number): boolean {
    return this.memoizedPinsKnockedDownPreviously.includes(pinNumber);
  }

  canRecordStrike(): boolean {
    return this.validationService.canRecordStrike(this.currentFrameIndex(), this.currentThrowIndex(), this.frames());
  }

  canRecordSpare(): boolean {
    return this.validationService.canRecordSpare(this.currentFrameIndex(), this.currentThrowIndex(), this.frames());
  }

  recordStrike(): void {
    if (!this.canRecordStrike()) return;

    if (this.memoizedPinsLeftStanding.length !== 10) {
      this.selectedPins = [...this.memoizedPinsLeftStanding];
    } else {
      this.selectedPins = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    }

    this.confirmPinThrow();
  }

  recordSpare(): void {
    if (!this.canRecordSpare()) return;

    this.selectedPins = [...this.memoizedPinsLeftStanding];

    this.confirmPinThrow();
  }

  undoLastThrow(): void {
    this.throwUndone.emit();
  }

  clearSelectedPins(): void {
    this.selectedPins = [];
  }

  canUndoLastThrow(): boolean {
    return this.validationService.canUndoLastThrow(this.frames());
  }

  confirmPinThrow(): void {
    let pinsKnockedDownNumbers: number[] = [];
    let pinsLeftStanding: number[] = [];

    const availablePins = this.memoizedPinsLeftStanding;

    if (this.selectHitPinsFlag()) {
      pinsKnockedDownNumbers = [...this.selectedPins];
      pinsLeftStanding = availablePins.filter((pin) => !this.selectedPins.includes(pin));
    } else {
      pinsLeftStanding = [...this.selectedPins];
      pinsKnockedDownNumbers = availablePins.filter((pin) => !this.selectedPins.includes(pin));
    }

    const pinsKnockedDown = pinsKnockedDownNumbers.length;

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
    return this.formatterService.formatThrowValue(frameIndex, throwIndex, this.frames());
  }

  isNumber(value: unknown): boolean {
    return typeof value === 'number' && !isNaN(value);
  }

  isGameComplete(): boolean {
    return this.validationService.isGameComplete(this.frames());
  }
}
