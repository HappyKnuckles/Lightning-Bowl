import { Component, input, computed } from '@angular/core';
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
  // Inputs
  frame = input.required<any>();
  frameIndex = input.required<number>();
  scale = input<number>(0.3);

  // Computed signal for pins left per throw
  pinsStanding = computed(() => {
    const f = this.frame();
    if (!f) return [];
    const pins: number[][] = [];
    for (let i = 0; i < 3; i++) {
      pins[i] = f.throws?.[i]?.pinsLeftStanding ?? [];
    }
    return pins;
  });

  /** Get cached pins for a specific throw */
  getPinsStanding(throwIndex: number): number[] {
    return this.pinsStanding()[throwIndex] ?? [];
  }

  /** Checks if this is the 10th frame */
  isTenthFrame(): boolean {
    return this.frameIndex() === 9;
  }

  /** Helpers to get throw values */
  getFirstThrow(): number | undefined {
    const f = this.frame();
    return f?.throws?.[0]?.value ?? f?.[0];
  }

  getSecondThrow(): number | undefined {
    const f = this.frame();
    return f?.throws?.[1]?.value ?? f?.[1];
  }

  getThirdThrow(): number | undefined {
    const f = this.frame();
    return f?.throws?.[2]?.value ?? f?.[2];
  }
}
