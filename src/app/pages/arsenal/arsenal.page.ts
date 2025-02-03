import { Component, OnInit, computed, Signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonThumbnail,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonImg,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonButtons,
  IonIcon,
  IonModal,
  IonRow,
  IonCol,
  IonGrid,
  IonCardHeader,
  IonCardContent,
  IonCard,
  IonCardTitle,
  IonAvatar,
  IonText,
} from '@ionic/angular/standalone';
import { StorageService } from 'src/app/services/storage/storage.service';
import { Ball } from 'src/app/models/ball.model';
import { ToastService } from 'src/app/services/toast/toast.service';
import { addIcons } from 'ionicons';
import { chevronBack, add } from 'ionicons/icons';
import { ModalController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { BallComboBoxComponent } from 'src/app/components/ball-combo-box/ball-combo-box.component';

@Component({
  selector: 'app-arsenal',
  templateUrl: './arsenal.page.html',
  styleUrls: ['./arsenal.page.scss'],
  standalone: true,
  providers: [ModalController],
  imports: [
    IonText,
    BallComboBoxComponent,
    IonAvatar,
    IonThumbnail,
    IonCardTitle,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonGrid,
    IonCol,
    IonRow,
    IonModal,
    IonIcon,
    IonButtons,
    IonButton,
    IonLabel,
    IonItem,
    IonList,
    IonImg,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    BallComboBoxComponent,
  ],
})
export class ArsenalPage implements OnInit {
  @ViewChild('core', { static: false }) coreModal!: IonModal;
  @ViewChild('coverstock', { static: false }) coverstockModal!: IonModal;
  coverstockBalls: Ball[] = [];
  coreBalls: Ball[] = [];
  presentingElement?: HTMLElement;
  ballsWithoutArsenal: Signal<Ball[]> = computed(() =>
    this.storageService.allBalls().filter((ball) => !this.storageService.arsenal().some((arsenalBall) => arsenalBall.ball_id === ball.ball_id))
  );
  constructor(public storageService: StorageService, public toastService: ToastService, public modalCtrl: ModalController, private http: HttpClient) {
    addIcons({ add, chevronBack });
  }

  ngOnInit() {
    this.presentingElement = document.querySelector('.ion-page')!;
  }

  removeFromArsenal(ball: Ball): void {
    this.storageService.removeFromArsenal(ball);
    this.toastService.showToast('Ball removed from arsenal', 'remove-outline');
  }

  saveBallToArsenal(ball: Ball[]): void {
    ball.forEach((ball) => {
      this.storageService.saveToArsenal(ball);
    });
    const ball_names = ball.map((ball) => ball.ball_name).join(', ');
    this.toastService.showToast(`Balls added to arsenal: ${ball_names}`, 'checkmark-outline');
  }

  async getSameCoreBalls(ball: Ball): Promise<void> {
    const response = await firstValueFrom(this.http.get<Ball[]>(`restapi/balls/v2?core=${ball.core_name}`));
    this.coreBalls = response;

    if (this.coreBalls.length > 1 && !this.coreBalls.includes(ball)) {
      this.coreModal.present();
    }
  }

  async getSameCoverstockBalls(ball: Ball): Promise<void> {
    const response = await firstValueFrom(this.http.get<Ball[]>(`restapi/balls/v2?coverstock=${ball.coverstock_name}`));
    this.coverstockBalls = response;

    if (this.coverstockBalls.length > 1 && !this.coreBalls.includes(ball)) {
      this.coverstockModal.present();
    }
  }
}
