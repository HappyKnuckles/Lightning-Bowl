import { Component, input } from '@angular/core';

@Component({
  selector: 'app-pin-deck',
  standalone: true,
  templateUrl: './pin-deck.component.html',
  styleUrl: './pin-deck.component.scss',
})
export class PinDeckComponent {
  activePins = input.required<number[]>();
  isStatPage = input<boolean>(false);
  scale = input<number>(1);

  isPinSelected(pinNumber: number): boolean {
    const pins = this.activePins();
    return Array.isArray(pins) && pins.includes(pinNumber);
  }
}
