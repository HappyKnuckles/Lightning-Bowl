import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton } from '@ionic/angular/standalone';
import { PinData } from '../../../core/models/game.model';

@Component({
  selector: 'app-pin-setup',
  standalone: true,
  imports: [CommonModule, IonButton],
  templateUrl: './pin-setup.component.html',
  styleUrl: './pin-setup.component.scss'
})
export class PinSetupComponent implements OnChanges {
  @Input() frameNumber: number = 1;
  @Input() throwIndex: number = 0; // 0 = first throw, 1 = second throw, 2 = third throw (10th frame)
  @Input() previousPins: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // Pins available at start of throw
  @Output() throwConfirmed = new EventEmitter<{ score: number; pinData: PinData }>();
  @Output() cancelled = new EventEmitter<void>();

  knockedPins: number[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    // Reset knocked pins when frame number or throw index changes
    if (changes['frameNumber'] || changes['throwIndex'] || changes['previousPins']) {
      this.knockedPins = [];
    }
  }

  get throwLabel(): string {
    if (this.frameNumber === 10) {
      const labels = ['First Throw', 'Second Throw', 'Third Throw'];
      return labels[this.throwIndex] || 'Throw';
    }
    return this.throwIndex === 0 ? 'First Throw' : 'Second Throw';
  }

  get availablePins(): number[] {
    return this.previousPins.filter(pin => pin >= 1 && pin <= 10);
  }

  get standingPins(): number[] {
    return this.availablePins.filter(pin => !this.knockedPins.includes(pin));
  }

  get isSplit(): boolean {
    // A split occurs when the first throw leaves non-adjacent pins standing (except for head pin)
    if (this.throwIndex !== 1 || this.previousPins.length === 10) {
      return false;
    }
    
    const standing = this.standingPins.sort((a, b) => a - b);
    if (standing.length < 2) {
      return false;
    }

    // If head pin (1) is still standing, it's not a split
    if (standing.includes(1)) {
      return false;
    }

    // Check if any standing pins are adjacent
    const adjacentPairs = [
      [2, 3], [4, 5], [5, 6], [7, 8], [8, 9], [9, 10], // Same row adjacencies
      [2, 4], [3, 6], [4, 7], [5, 8], [6, 10], [7, 8], [8, 9], [9, 10] // Cross-row adjacencies
    ];

    for (let i = 0; i < standing.length - 1; i++) {
      for (let j = i + 1; j < standing.length; j++) {
        const pair = [standing[i], standing[j]];
        if (adjacentPairs.some(adjPair => 
          (adjPair[0] === pair[0] && adjPair[1] === pair[1]) || 
          (adjPair[0] === pair[1] && adjPair[1] === pair[0])
        )) {
          return false; // Found adjacent pins, not a split
        }
      }
    }

    return true;
  }

  isKnockedDown(pin: number): boolean {
    return this.knockedPins.includes(pin);
  }

  isStanding(pin: number): boolean {
    return this.availablePins.includes(pin) && !this.knockedPins.includes(pin);
  }

  isPinDisabled(pin: number): boolean {
    return !this.availablePins.includes(pin);
  }

  togglePin(pin: number): void {
    if (this.isPinDisabled(pin)) {
      return;
    }

    if (this.isKnockedDown(pin)) {
      this.knockedPins = this.knockedPins.filter(p => p !== pin);
    } else {
      this.knockedPins.push(pin);
    }
    
    // Sort for consistent display
    this.knockedPins.sort((a, b) => a - b);
  }

  clearAll(): void {
    this.knockedPins = [];
  }

  isValidThrow(): boolean {
    // For 10th frame, any number of pins is valid
    if (this.frameNumber === 10) {
      return this.knockedPins.length <= this.availablePins.length;
    }

    // For first throw, up to 10 pins
    if (this.throwIndex === 0) {
      return this.knockedPins.length <= 10;
    }

    // For second throw, can't knock down more pins than are standing
    return this.knockedPins.length <= this.standingPins.length;
  }

  confirmThrow(): void {
    if (!this.isValidThrow()) {
      return;
    }

    const score = this.knockedPins.length;
    const pinData: PinData = {
      pinsKnocked: [...this.knockedPins],
      pinsStanding: [...this.standingPins.filter(pin => !this.knockedPins.includes(pin))]
    };

    this.throwConfirmed.emit({ score, pinData });
  }
}
