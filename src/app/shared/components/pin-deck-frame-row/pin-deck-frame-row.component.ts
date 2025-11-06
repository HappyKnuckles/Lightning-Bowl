import { Component, input } from '@angular/core';
import { NgIf } from '@angular/common';
import { IonRow, IonCol } from '@ionic/angular/standalone';
import { PinDeckComponent } from '../pin-deck/pin-deck.component';
import { Game } from 'src/app/core/models/game.model';

@Component({
  selector: 'app-pin-deck-frame-row',
  templateUrl: './pin-deck-frame-row.component.html',
  styleUrls: ['./pin-deck-frame-row.component.scss'],
  standalone: true,
  imports: [IonRow, IonCol, PinDeckComponent, NgIf],
})
export class PinDeckFrameRowComponent {
  // Input signals
  game = input.required<Game>();
  frameIndex = input.required<number>();
  scale = input<number>(0.3);

  /**
   * Gets the pins left standing after a specific throw
   */
  getPinsStanding(throwIndex: number): number[] {
    const game = this.game();
    const frameIndex = this.frameIndex();

    if (!game || !game.frames || !game.frames[frameIndex]) {
      return [];
    }

    const frame = game.frames[frameIndex];

    if (frame.throws && Array.isArray(frame.throws)) {
      const throwData = frame.throws[throwIndex];
      if (throwData?.pinsLeftStanding) {
        return throwData.pinsLeftStanding;
      }
    }

    const allPins = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    if (throwIndex === 0) {
      const pinsKnockedDown = frame.throws?.[0]?.value ?? frame[0];
      if (pinsKnockedDown === undefined) return [];
      if (pinsKnockedDown === 10) return [];
      return allPins.slice(pinsKnockedDown);
    }

    if (throwIndex === 1) {
      const firstThrow = frame.throws?.[0]?.value ?? frame[0];
      const secondThrow = frame.throws?.[1]?.value ?? frame[1];
      if (secondThrow === undefined) return [];

      if (frameIndex === 9 && firstThrow === 10) {
        if (secondThrow === 10) return [];
        return allPins.slice(secondThrow);
      }

      const totalKnockedDown = firstThrow + secondThrow;
      if (totalKnockedDown >= 10) return [];
      return allPins.slice(totalKnockedDown);
    }

    if (throwIndex === 2 && frameIndex === 9) {
      const firstThrow = frame.throws?.[0]?.value ?? frame[0];
      const secondThrow = frame.throws?.[1]?.value ?? frame[1];
      const thirdThrow = frame.throws?.[2]?.value ?? frame[2];
      if (thirdThrow === undefined) return [];

      if (firstThrow === 10 && secondThrow === 10) {
        if (thirdThrow === 10) return [];
        return allPins.slice(thirdThrow);
      }

      if (firstThrow === 10) {
        const totalKnockedDown = secondThrow + thirdThrow;
        if (totalKnockedDown >= 10) return [];
        return allPins.slice(totalKnockedDown);
      }

      if (thirdThrow === 10) return [];
      return allPins.slice(thirdThrow);
    }

    return [];
  }

  /**
   * Checks if any throw exists in the frame
   */
  hasThrows(): boolean {
    const frame = this.game().frames[this.frameIndex()];
    return frame?.throws?.[0]?.value !== undefined || frame?.[0] !== undefined;
  }

  /**
   * Gets the first throw value
   */
  getFirstThrow(): number | undefined {
    const frame = this.game().frames[this.frameIndex()];
    return frame?.throws?.[0]?.value ?? frame?.[0];
  }

  /**
   * Gets the second throw value
   */
  getSecondThrow(): number | undefined {
    const frame = this.game().frames[this.frameIndex()];
    return frame?.throws?.[1]?.value ?? frame?.[1];
  }

  /**
   * Gets the third throw value (10th frame only)
   */
  getThirdThrow(): number | undefined {
    const frame = this.game().frames[this.frameIndex()];
    return frame?.throws?.[2]?.value ?? frame?.[2];
  }

  /**
   * Checks if this is the 10th frame
   */
  isTenthFrame(): boolean {
    return this.frameIndex() === 9;
  }
}
