import { Component, QueryList, ViewChild, ViewChildren, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonThumbnail, IonHeader, IonTitle, IonToolbar, IonImg, IonList, IonItem, IonLabel, IonButton, IonButtons, IonIcon, IonModal, IonRow, IonCol, IonGrid, IonCardHeader, IonCardContent, IonCard, IonCardTitle, IonAvatar } from '@ionic/angular/standalone';
import { StorageService } from 'src/app/services/storage/storage.service';
import { Ball } from 'src/app/models/ball.model';
import { ToastService } from 'src/app/services/toast/toast.service';
import { addIcons } from 'ionicons';
import { chevronBack } from 'ionicons/icons';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-arsenal',
  templateUrl: './arsenal.page.html',
  styleUrls: ['./arsenal.page.scss'],
  standalone: true,
  providers: [ModalController],
  imports: [IonAvatar, IonThumbnail, IonCardTitle, IonCard, IonCardContent, IonCardHeader, IonGrid, IonCol, IonRow, IonModal, IonIcon, IonButtons, IonButton, IonLabel, IonItem, IonList, IonImg, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class ArsenalPage implements OnInit {
  url = 'https://bowwwl.com/';
  coverstockBalls: Ball[] = [];
  coreBalls: Ball[] = [];
  @ViewChildren('modal') modals!: QueryList<IonModal>;
  @ViewChildren('core') cores!: QueryList<IonModal>;
  @ViewChildren('coverstock') coverstocks!: QueryList<IonModal>;

  @ViewChild('info') info!: IonModal;
  presentingElement?: HTMLElement;
  constructor(public storageService: StorageService, public toastService: ToastService, public modalCtrl: ModalController) {
    addIcons({
      chevronBack
    });
  }

  ngOnInit(){
    this.presentingElement = document.querySelector('.ion-page')!;
  }

  removeFromArsenal(ball: Ball) {
    this.storageService.removeFromArsenal(ball);
    this.toastService.showToast('Ball removed from arsenal', 'remove-outline');
  }

  cancel(ballId: string): void {
    const modalToDismiss = this.modals.find((modal) => modal.trigger === ballId);

    if (modalToDismiss) {
      modalToDismiss.dismiss();
    }
  }

  async getSameCoreBalls(ball: Ball) {
    const response = await fetch(`restapi/balls/v2?core=${ball.core_name}`);
    this.coreBalls = await response.json();
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

  async getSameCoverstockBalls(ball: Ball) {
    const response = await fetch(`restapi/balls/v2?coverstock=${ball.coverstock_name}`);
    this.coverstockBalls = await response.json();
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
