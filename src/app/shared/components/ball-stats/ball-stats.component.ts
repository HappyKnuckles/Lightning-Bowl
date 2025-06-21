import { Component, input } from '@angular/core';
import { BestBallStats } from 'src/app/core/models/stats.model';
import { IonImg, IonListHeader, IonList, IonAvatar, IonTitle, IonLabel } from '@ionic/angular/standalone';
import { StorageService } from 'src/app/core/services/storage/storage.service';

@Component({
  selector: 'app-ball-stats',
  standalone: true,
  imports: [IonLabel, IonTitle, IonAvatar, IonList, IonListHeader, IonImg],
  templateUrl: './ball-stats.component.html',
  styleUrl: './ball-stats.component.scss',
})
export class BallStatsComponent {
  bestBall = input.required<BestBallStats>();

  totalGames = input.required<number>();

  constructor(public storageService: StorageService) {}
}
