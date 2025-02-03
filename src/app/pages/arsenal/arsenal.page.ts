import { Component, QueryList, ViewChildren, OnInit, computed, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonThumbnail, IonHeader, IonTitle, IonToolbar, IonImg, IonList, IonItem, IonLabel, IonButton, IonButtons, IonIcon, IonModal, IonRow, IonCol, IonGrid, IonCardHeader, IonCardContent, IonCard, IonCardTitle, IonAvatar } from '@ionic/angular/standalone';
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
  imports: [BallComboBoxComponent ,IonAvatar, IonThumbnail, IonCardTitle, IonCard, IonCardContent, IonCardHeader, IonGrid, IonCol, IonRow, IonModal, IonIcon, IonButtons, IonButton, IonLabel, IonItem, IonList, IonImg, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, BallComboBoxComponent]
})
export class ArsenalPage implements OnInit {
  url = 'https://bowwwl.com/';
  coverstockBalls: Ball[] = [];
  coreBalls: Ball[] = [];
  ballsWithoutArsenal: Signal<Ball[]> = computed(() =>
    this.storageService.allBalls().filter(ball => !this.storageService.arsenal().some(arsenalBall => arsenalBall.ball_id === ball.ball_id))
  );
  @ViewChildren('modal') modals!: QueryList<IonModal>;
  @ViewChildren('core') cores!: QueryList<IonModal>;
  @ViewChildren('coverstock') coverstocks!: QueryList<IonModal>;
  presentingElement?: HTMLElement;
  constructor(public storageService: StorageService,
    public toastService: ToastService, public modalCtrl: ModalController, private http: HttpClient) {
    addIcons({ add, chevronBack });
  }

  ngOnInit() {
    this.presentingElement = document.querySelector('.ion-page')!;
  }

  removeFromArsenal(ball: Ball): void {
    this.storageService.removeFromArsenal(ball);
    this.toastService.showToast('Ball removed from arsenal', 'remove-outline');
  }

  // TODO make it so afterwards selected are added
  selectedBalls: Ball[] = [];
  saveBallToArsenal(event: Event): void {
    const ball = event.target!;
    console.log(ball)
    // this.storageService.addToArsenal(ball);
    // this.toastService.showToast('Ball added to arsenal', 'add-outline');
  }

  cancel(ballId: string): void {
    const modalToDismiss = this.modals.find((modal) => modal.trigger === ballId);

    if (modalToDismiss) {
      modalToDismiss.dismiss();
    }
  }

  async getSameCoreBalls(ball: Ball): Promise<void> {
    const response = await firstValueFrom(this.http.get<Ball[]>(`restapi/balls/v2?core=${ball.core_name}`));
    this.coreBalls = response;
    if (this.coreBalls.length > 1 && !this.coreBalls.includes(ball)) {
      const modalToOpen = this.cores.find((modal) => modal.trigger === ball.core_name);
      if (modalToOpen) {
        modalToOpen.onDidDismiss().then(() => {
          this.coverstockBalls = [];
        });
        modalToOpen.present();
      }
    }
  }

  async getSameCoverstockBalls(ball: Ball): Promise<void> {
    const response = await firstValueFrom(this.http.get<Ball[]>(`restapi/balls/v2?coverstock=${ball.coverstock_name}`));
    this.coverstockBalls = response;
    if (this.coverstockBalls.length > 1 && !this.coreBalls.includes(ball)) {
      const modalToOpen = this.coverstocks.find((modal) => modal.trigger === ball.coverstock_name);
      if (modalToOpen) {
        modalToOpen.onDidDismiss().then(() => {
          this.coreBalls = [];
        });
        modalToOpen.present();
      }
    }
  }
}
