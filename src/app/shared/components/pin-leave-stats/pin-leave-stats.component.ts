import { Component, input } from '@angular/core';
import { IonItem, IonLabel, IonList, IonListHeader, IonText } from '@ionic/angular/standalone';
import { NgFor, NgIf } from '@angular/common';
import { PinDeckComponent } from '../pin-deck/pin-deck.component';

export interface LeaveStats {
  pins: number[];
  occurrences: number;
  pickups: number;
  pickupPercentage: number;
}

@Component({
  selector: 'app-pin-leave-stats',
  standalone: true,
  imports: [IonList, IonListHeader, IonItem, IonLabel, IonText, NgFor, NgIf, PinDeckComponent],
  templateUrl: './pin-leave-stats.component.html',
  styleUrl: './pin-leave-stats.component.scss',
})
export class PinLeaveStatsComponent {
  leaveStats = input.required<LeaveStats[]>();
  title = input<string>('Pin Leaves');

  getPickupColor(conversionRate: number): string {
    if (conversionRate > 95) {
      return '#4faeff';
    } else if (conversionRate > 75) {
      return '#008000';
    } else if (conversionRate > 50) {
      return '#809300';
    } else if (conversionRate > 33) {
      return '#FFA500';
    } else {
      return '#FF0000';
    }
  }
}
