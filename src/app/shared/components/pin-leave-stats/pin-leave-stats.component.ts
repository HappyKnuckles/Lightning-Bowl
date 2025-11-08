import { Component, input } from '@angular/core';
import { IonItem, IonLabel, IonList, IonListHeader } from '@ionic/angular/standalone';
import { PinDeckComponent } from '../pin-deck/pin-deck.component';
import { DisplayLeaveStat } from 'src/app/core/models/stats.model';

@Component({
  selector: 'app-pin-leave-stats',
  standalone: true,
  imports: [IonList, IonListHeader, IonItem, IonLabel, PinDeckComponent],
  templateUrl: './pin-leave-stats.component.html',
  styleUrl: './pin-leave-stats.component.scss',
})
export class PinLeaveStatsComponent {
  leaveStats = input.required<DisplayLeaveStat[]>();
  title = input<string>('Pin Leaves');
}
