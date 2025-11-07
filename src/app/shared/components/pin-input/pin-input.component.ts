import { Component, input, output, computed, inject } from '@angular/core';
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
  frames = input<number[][]>([]);
  throwsData = input<ThrowData[][]>([]);
  currentFrameIndex = input<number>(0);
  currentThrowIndex = input<number>(0);
  game = input.required<Game>();
  maxScore = input<number>(300);
  selectHitPins = input<boolean>(true);

  throwConfirmed = output<PinThrowEvent>();
  throwUndone = output<void>();

  selectedPins: number[] = [];

  private validationService = inject(BowlingGameValidationService);
  private formatterService = inject(BowlingFrameFormatterService);

  constructor() {
    addIcons({ checkmarkOutline, arrowUndoOutline, closeCircleOutline });
  }

  pinsLeftStanding = computed(() => {
    return this.validationService.getPinsLeftFromPreviousThrow(this.currentFrameIndex(), this.currentThrowIndex(), this.frames(), this.throwsData());
  });

  pinsKnockedDownPreviously = computed(() => {
    const allPins = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    return allPins.filter((pin) => !this.pinsLeftStanding().includes(pin));
  });

  togglePin(pinNumber: number): void {
    if (!this.pinsLeftStanding().includes(pinNumber)) return;
    const index = this.selectedPins.indexOf(pinNumber);
    if (index > -1) this.selectedPins.splice(index, 1);
    else this.selectedPins.push(pinNumber);
  }

  clearSelectedPins(): void {
    this.selectedPins = [];
  }

  undoLastThrow(): void {
    this.throwUndone.emit();
  }

  confirmPinThrow(): void {
    const availablePins = this.pinsLeftStanding();
    let pinsKnockedDownNumbers: number[];
    let pinsLeftStanding: number[];

    if (this.selectHitPins()) {
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

  canRecordStrike(): boolean {
    return this.validationService.canRecordStrike(this.currentFrameIndex(), this.currentThrowIndex(), this.frames());
  }

  canRecordSpare(): boolean {
    return this.validationService.canRecordSpare(this.currentFrameIndex(), this.currentThrowIndex(), this.frames());
  }

  recordStrike(): void {
    if (!this.canRecordStrike()) return;
    if (this.selectHitPins()) this.selectedPins = [...this.pinsLeftStanding()];
    this.confirmPinThrow();
  }

  recordSpare(): void {
    if (!this.canRecordSpare()) return;
    if (this.selectHitPins()) this.selectedPins = [...this.pinsLeftStanding()];
    this.confirmPinThrow();
  }

  canUndoLastThrow(): boolean {
    return this.validationService.canUndoLastThrow(this.frames());
  }

  isPinSelected(pinNumber: number): boolean {
    return this.selectedPins.includes(pinNumber);
  }

  isPinAvailable(pinNumber: number): boolean {
    return this.pinsLeftStanding().includes(pinNumber);
  }

  isPinKnockedDownPreviously(pinNumber: number): boolean {
    return this.pinsKnockedDownPreviously().includes(pinNumber);
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
