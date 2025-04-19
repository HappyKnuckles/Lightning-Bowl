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
  IonChip,
  IonReorderGroup,
  IonReorder,
} from '@ionic/angular/standalone';
import { StorageService } from 'src/app/core/services/storage/storage.service';
import { Ball } from 'src/app/core/models/ball.model';
import { ToastService } from 'src/app/core/services/toast/toast.service';
import { addIcons } from 'ionicons';
import { chevronBack, add, openOutline, trashOutline } from 'ionicons/icons';
import { AlertController, ItemReorderCustomEvent, ModalController } from '@ionic/angular';
import { LoadingService } from 'src/app/core/services/loader/loading.service';
import { ImpactStyle } from '@capacitor/haptics';
import { HapticService } from 'src/app/core/services/haptic/haptic.service';
import { BallService } from 'src/app/core/services/ball/ball.service';
import { BallListComponent } from 'src/app/shared/components/ball-list/ball-list.component';
import { ToastMessages } from 'src/app/core/constants/toast-messages.constants';
import { BallTypeaheadComponent } from 'src/app/shared/components/ball-typeahead/ball-typeahead.component';

@Component({
  selector: 'app-arsenal',
  templateUrl: './arsenal.page.html',
  styleUrls: ['./arsenal.page.scss'],
  standalone: true,
  providers: [ModalController],
  imports: [
    IonReorder,
    IonReorderGroup,
    IonChip,
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
    BallListComponent,
    BallTypeaheadComponent,
  ],
})
export class ArsenalPage implements OnInit {
  @ViewChild('core', { static: false }) coreModal!: IonModal;
  @ViewChild('coverstock', { static: false }) coverstockModal!: IonModal;
  coverstockBalls: Ball[] = [];
  coreBalls: Ball[] = [];
  presentingElement?: HTMLElement;
  ballsWithoutArsenal: Signal<Ball[]> = computed(() =>
    this.storageService
      .allBalls()
      .filter((ball) => !this.storageService.arsenal().some((b) => b.ball_id === ball.ball_id && b.core_weight === ball.core_weight)),
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
    try {
      this.hapticService.vibrate(ImpactStyle.Heavy, 300);
      const alert = await this.alertController.create({
        header: 'Confirm Deletion',
        message: `Are you sure you want to remove ${ball.ball_name} from your arsenal?`,
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
          },
          {
            text: 'Delete',
            handler: async () => {
              try {
                await this.storageService.removeFromArsenal(ball);
                this.toastService.showToast(`Ball removed from arsenal: ${ball.ball_name}`, 'checkmark-outline');
              } catch (error) {
                console.error('Error removing ball from arsenal:', error);
                this.toastService.showToast(ToastMessages.ballDeleteError, 'bug', true);
              }
            },
          },
        ],
      });

      await alert.present();
    } catch (error) {
      console.error('Error displaying removal alert:', error);
      this.toastService.showToast(ToastMessages.unexpectedError, 'warning', true);
    }
  }

  async reorderArsenal(event: ItemReorderCustomEvent): Promise<void> {
    event.detail.complete();

    const arsenal = this.storageService.arsenal();
    const [movedItem] = arsenal.splice(event.detail.from, 1);
    arsenal.splice(event.detail.to, 0, movedItem);

    arsenal.forEach((ball, idx) => (ball.position = idx + 1));

    await Promise.all(arsenal.map((ball) => this.storageService.saveBallToArsenal(ball)));
  }

  saveBallToArsenal(ball: Ball[]): void {
    try {
      ball.forEach(async (ball) => {
        try {
          await this.storageService.saveBallToArsenal(ball);
        } catch (error) {
          console.error(`Error saving ball ${ball.ball_name} to arsenal:`, error);
          this.toastService.showToast(`Failed to add ${ball.ball_name}.`, 'bug', true);
        }
      });

      const ball_names = ball.map((ball) => ball.ball_name).join(', ');
      this.toastService.showToast(`Balls added to arsenal: ${ball_names}`, 'checkmark-outline');
    } catch (error) {
      console.error('Error saving balls to arsenal:', error);
      this.toastService.showToast(ToastMessages.ballSaveError, 'bug', true);
    }
  }

  async getSameCoreBalls(ball: Ball): Promise<void> {
    try {
      this.hapticService.vibrate(ImpactStyle.Light, 100);
      this.loadingService.setLoading(true);

      this.coreBalls = await this.ballService.getBallsByCore(ball);

      if (this.coreBalls.length > 0) {
        this.coreModal.present();
      } else {
        this.toastService.showToast(`No similar balls found for core: ${ball.core_name}.`, 'information-circle-outline');
      }
    } catch (error) {
      console.error('Error fetching core balls:', error);
      this.toastService.showToast(`Error fetching balls for core ${ball.core_name}`, 'bug', true);
    } finally {
      this.loadingService.setLoading(false);
    }
  }

  async getSameCoverstockBalls(ball: Ball): Promise<void> {
    try {
      this.hapticService.vibrate(ImpactStyle.Light, 100);
      this.loadingService.setLoading(true);

      this.coverstockBalls = await this.ballService.getBallsByCoverstock(ball);

      if (this.coverstockBalls.length > 0) {
        await this.coverstockModal.present();
      } else {
        this.toastService.showToast(`No similar balls found for coverstock: ${ball.coverstock_name}.`, 'information-circle-outline');
      }
    } catch (error) {
      console.error('Error fetching coverstock balls:', error);
      this.toastService.showToast(`Error fetching balls for coverstock ${ball.coverstock_name}`, 'bug', true);
    } finally {
      this.loadingService.setLoading(false);
    }
  }
}
