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
  IonText,
  IonItemSliding,
  IonItemOption,
  IonItemOptions,
} from '@ionic/angular/standalone';
import { StorageService } from 'src/app/services/storage/storage.service';
import { Ball } from 'src/app/models/ball.model';
import { ToastService } from 'src/app/services/toast/toast.service';
import { addIcons } from 'ionicons';
import { chevronBack, add, openOutline, trashOutline } from 'ionicons/icons';
import { AlertController, ModalController } from '@ionic/angular';
import { BallComboBoxComponent } from 'src/app/components/ball-combo-box/ball-combo-box.component';
import { BallListComponent } from 'src/app/components/ball-list/ball-list.component';
import { LoadingService } from 'src/app/services/loader/loading.service';
import { ImpactStyle } from '@capacitor/haptics';
import { HapticService } from 'src/app/services/haptic/haptic.service';
import { BallService } from 'src/app/services/ball/ball.service';

@Component({
  selector: 'app-arsenal',
  templateUrl: './arsenal.page.html',
  styleUrls: ['./arsenal.page.scss'],
  standalone: true,
  providers: [ModalController],
  imports: [
    IonItemOptions,
    IonItemOption,
    IonItemSliding,
    IonText,
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
    BallListComponent,
  ],
})
export class ArsenalPage implements OnInit {
  @ViewChild('core', { static: false }) coreModal!: IonModal;
  @ViewChild('coverstock', { static: false }) coverstockModal!: IonModal;
  coverstockBalls: Ball[] = [];
  coreBalls: Ball[] = [];
  presentingElement?: HTMLElement;
  ballsWithoutArsenal: Signal<Ball[]> = computed(() =>
    this.storageService.allBalls().filter((ball) => !this.storageService.arsenal().some((arsenalBall) => arsenalBall.ball_id === ball.ball_id)),
  );
  constructor(
    public storageService: StorageService,
    private hapticService: HapticService,
    private alertController: AlertController,

    private loadingService: LoadingService,
    public toastService: ToastService,
    public modalCtrl: ModalController,
    private ballService: BallService,
  ) {
    addIcons({ add, trashOutline, chevronBack, openOutline });
  }

  ngOnInit() {
    this.presentingElement = document.querySelector('.ion-page')!;
  }

  async removeFromArsenal(ball: Ball): Promise<void> {
    this.hapticService.vibrate(ImpactStyle.Heavy, 300);
    const alert = await this.alertController.create({
      header: 'Confirm Deletion',
      message: `Are you sure you want to remove ${ball.ball_name} from your arsenal?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          // handler: () => { },
        },
        {
          text: 'Delete',
          handler: async () => {
            this.storageService.removeFromArsenal(ball);
            this.toastService.showToast(`Ball removed from arsenal: ${ball.ball_name}`, 'checkmark-outline');
          },
        },
      ],
    });

    await alert.present();
  }

  saveBallToArsenal(ball: Ball[]): void {
    ball.forEach((ball) => {
      this.storageService.saveBallToArsenal(ball);
    });
    const ball_names = ball.map((ball) => ball.ball_name).join(', ');
    this.toastService.showToast(`Balls added to arsenal: ${ball_names}`, 'checkmark-outline');
  }

  async getSameCoreBalls(ball: Ball): Promise<void> {
    try {
      this.hapticService.vibrate(ImpactStyle.Light, 100);
      this.loadingService.setLoading(true);

      this.coreBalls = await this.ballService.getSameCoreBalls(ball);

      if (this.coreBalls.length > 0) {
        this.coreModal.present();
      } else {
        this.toastService.showToast(`No similar balls found for core: ${ball.core_name}.`, 'information-circle-outline');
      }
    } catch (error) {
      console.error('Error fetching core balls:', error);
      this.toastService.showToast(`Error fetching balls for core ${ball.core_name}: ${error}`, 'bug', true);
    } finally {
      this.loadingService.setLoading(false);
    }
  }

  async getSameCoverstockBalls(ball: Ball): Promise<void> {
    try {
      this.hapticService.vibrate(ImpactStyle.Light, 100);
      this.loadingService.setLoading(true);

      this.coverstockBalls = await this.ballService.getSameCoverstockBalls(ball);

      if (this.coverstockBalls.length > 0) {
        await this.coverstockModal.present();
      } else {
        this.toastService.showToast(`No similar balls found for coverstock: ${ball.coverstock_name}.`, 'information-circle-outline');
      }
    } catch (error) {
      console.error('Error fetching coverstock balls:', error);
      this.toastService.showToast(`Error fetching balls for coverstock ${ball.coverstock_name}: ${error}`, 'bug', true);
    } finally {
      this.loadingService.setLoading(false);
    }
  }
}
