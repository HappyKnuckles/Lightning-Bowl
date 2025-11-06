import { Component, input, output, effect, inject } from '@angular/core';
import { IonButton, IonIcon, IonGrid, IonRow, IonCol, IonInput } from '@ionic/angular/standalone';
import { NgFor, NgIf } from '@angular/common';
import { addIcons } from 'ionicons';
import { checkmarkCircle, addCircle, arrowUndo, closeCircle } from 'ionicons/icons';
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

  // Output signals
  throwConfirmed = output<PinThrowEvent>();
  throwUndone = output<void>();

  selectedPins: number[] = [];
  private validationService = inject(BowlingGameValidationService);
  private formatterService = inject(BowlingFrameFormatterService);

  constructor() {
    addIcons({ checkmarkCircle, addCircle, arrowUndo, closeCircle });

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
    return this.validationService.isPinAvailable(pinNumber, this.currentFrameIndex(), this.currentThrowIndex(), this.frames(), this.throwsData());
  }

  isPinKnockedDownPreviously(pinNumber: number): boolean {
    return this.validationService.isPinKnockedDownPreviously(
      pinNumber,
      this.currentFrameIndex(),
      this.currentThrowIndex(),
      this.frames(),
      this.throwsData(),
    );
  }

  canRecordStrike(): boolean {
    return this.validationService.canRecordStrike(this.currentFrameIndex(), this.currentThrowIndex(), this.frames());
  }

  canRecordSpare(): boolean {
    return this.validationService.canRecordSpare(this.currentFrameIndex(), this.currentThrowIndex(), this.frames());
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

  clearSelectedPins(): void {
    this.selectedPins = [];
  }

  canUndoLastThrow(): boolean {
    return this.validationService.canUndoLastThrow(this.frames());
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
    return this.formatterService.formatThrowValue(frameIndex, throwIndex, this.frames());
  }

  isNumber(value: unknown): boolean {
    return typeof value === 'number' && !isNaN(value);
  }

  isGameComplete(): boolean {
    return this.validationService.isGameComplete(this.frames());
  }

  private getPinsLeftFromPreviousThrow(): number[] {
    return this.validationService.getPinsLeftFromPreviousThrow(this.currentFrameIndex(), this.currentThrowIndex(), this.frames(), this.throwsData());
  }
}
