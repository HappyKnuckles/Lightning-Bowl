import { Component, input } from '@angular/core';
import { IonButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-pin-deck',
  standalone: true,
  imports: [IonButton],
  templateUrl: './pin-deck.component.html',
  styleUrl: './pin-deck.component.scss',
})
export class PinDeckComponent {
  activePins = input.required<number[]>();

  isPinSelected(pinNumber: number): boolean {
    const pins = this.activePins();
    return Array.isArray(pins) && pins.includes(pinNumber);
  }
}
