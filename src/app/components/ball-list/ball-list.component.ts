import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IonItem, IonContent, IonAvatar, IonImg, IonList, IonLabel, IonHeader, IonToolbar, IonTitle } from "@ionic/angular/standalone";
import { Ball } from 'src/app/models/ball.model';
import { StorageService } from 'src/app/services/storage/storage.service';

@Component({
  selector: 'app-ball-list',
  templateUrl: './ball-list.component.html',
  styleUrls: ['./ball-list.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonTitle, IonToolbar, IonHeader, IonLabel, IonList, IonImg, IonAvatar, IonItem, IonContent]
})
export class BallListComponent {
  @Input() balls: Ball[] = [];
  @Input() isCoverstock = false;

  constructor(public storageService: StorageService) { }
}
