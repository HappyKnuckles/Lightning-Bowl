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
  IonText
} from '@ionic/angular/standalone';
import { StorageService } from 'src/app/services/storage/storage.service';
import { Ball } from 'src/app/models/ball.model';
import { ToastService } from 'src/app/services/toast/toast.service';
import { addIcons } from 'ionicons';
import { chevronBack, add, openOutline } from 'ionicons/icons';
import { ModalController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { BallComboBoxComponent } from 'src/app/components/ball-combo-box/ball-combo-box.component';
import { BallListComponent } from 'src/app/components/ball-list/ball-list.component';
import { LoadingService } from 'src/app/services/loader/loading.service';

@Component({
  selector: 'app-arsenal',
  templateUrl: './arsenal.page.html',
  styleUrls: ['./arsenal.page.scss'],
  standalone: true,
  providers: [ModalController],
  imports: [
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
    BallListComponent],
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
  constructor(public storageService: StorageService, private loadingService: LoadingService, public toastService: ToastService, public modalCtrl: ModalController, private http: HttpClient) {
    addIcons({ add, chevronBack, openOutline });
  }

  ngOnInit() {
    this.presentingElement = document.querySelector('.ion-page')!;
  }

  removeFromArsenal(ball: Ball): void {
    this.storageService.removeFromArsenal(ball);
    this.toastService.showToast(`Ball removed from arsenal: ${ball.ball_name}`, 'checkmark-outline');
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
      const response = await firstValueFrom(this.http.get<Ball[]>(`restapi/balls/v2?core=${ball.core_name}`));
      this.coreBalls = response.filter(coreBall => coreBall.ball_id !== ball.ball_id);

      if (this.coreBalls.length > 0) {
        this.loadingService.setLoading(true);
        this.coreModal.present();
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
      const response = await firstValueFrom(this.http.get<Ball[]>(`restapi/balls/v2?coverstock=${ball.coverstock_name}`));
      this.coverstockBalls = response.filter(coverstockBall => coverstockBall.ball_id !== ball.ball_id);

      if (this.coverstockBalls.length > 0) {
        this.loadingService.setLoading(true);
        await this.coverstockModal.present();
      }
    } catch (error) {
      console.error('Error fetching coverstock balls:', error);
      this.toastService.showToast(`Error fetching balls for coverstock ${ball.coverstock_name}: ${error}`, 'bug', true);
    } finally {
      this.loadingService.setLoading(false);
    }
  }
}
