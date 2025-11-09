import { Component, input } from '@angular/core';
import { NgIf } from '@angular/common';
import { IonRow, IonCol } from '@ionic/angular/standalone';
import { PinDeckComponent } from '../pin-deck/pin-deck.component';

@Component({
  selector: 'app-pin-deck-frame-row',
  templateUrl: './pin-deck-frame-row.component.html',
  styleUrls: ['./pin-deck-frame-row.component.scss'],
  standalone: true,
  imports: [IonRow, IonCol, PinDeckComponent, NgIf],
})
export class PinDeckFrameRowComponent {
  // Input signals
  frame = input.required<any>();
  frameIndex = input.required<number>();
  scale = input<number>(0.3);

  /**
   * Gets the pins left standing after a specific throw
   */
  getPinsStanding(throwIndex: number): number[] {
    const frame = this.frame();
    if (!frame) return [];

    const throwData = frame.throws?.[throwIndex];
    return throwData?.pinsLeftStanding ?? [];
  }

  /**
   * Checks if any throw exists in the frame
   */
  hasThrows(): boolean {
    const frame = this.frame();
    return !!(frame?.throws?.[0]?.value !== undefined || frame?.[0] !== undefined);
  }

  /**
   * Gets the first throw value
   */
  getFirstThrow(): number | undefined {
    const frame = this.frame();
    return frame?.throws?.[0]?.value ?? frame?.[0];
  }

  /**
   * Gets the second throw value
   */
  getSecondThrow(): number | undefined {
    const frame = this.frame();
    return frame?.throws?.[1]?.value ?? frame?.[1];
  }

  /**
   * Gets the third throw value (10th frame only)
   */
  getThirdThrow(): number | undefined {
    const frame = this.frame();
    return frame?.throws?.[2]?.value ?? frame?.[2];
  }

  /**
   * Checks if this is the 10th frame
   */
  isTenthFrame(): boolean {
    return this.frameIndex() === 9;
  }
}
