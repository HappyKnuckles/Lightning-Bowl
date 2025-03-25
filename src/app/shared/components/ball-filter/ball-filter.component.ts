import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BallFilterService } from 'src/app/core/services/ball-filter/ball-filter.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BallService } from 'src/app/core/services/ball/ball.service';
import { CommonModule } from '@angular/common';
import { BallFilter, CoreType, Market } from 'src/app/core/models/filter.model';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonDatetime,
  IonDatetimeButton,
  IonFooter,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToggle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import { StorageService } from 'src/app/core/services/storage/storage.service';
import { ToastService } from 'src/app/core/services/toast/toast.service';
import { ToastMessages } from 'src/app/core/constants/toast-messages.constants';
@Component({
  selector: 'app-ball-filter',
  templateUrl: './ball-filter.component.html',
  styleUrls: ['./ball-filter.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    IonList,
    IonFooter,
    IonToggle,
    IonModal,
    IonDatetime,
    IonDatetimeButton,
    IonLabel,
    IonInput,
    IonButton,
    IonItem,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonSelect,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    IonSelectOption,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class BallFilterComponent {
  markets: Market[] = [Market.ALL, Market.US, Market.INT];
  coreTypes: CoreType[] = [CoreType.ALL, CoreType.ASYMMETRIC, CoreType.SYMMETRIC];
  weights: string[] = ['12', '13', '14', '15', '16'];
  constructor(
    public ballFilterService: BallFilterService,
    private modalCtrl: ModalController,
    public ballService: BallService,
    private storageService: StorageService,
    private toastService: ToastService,
  ) {}

  cancel(): Promise<boolean> {
    this.ballFilterService.filters.update(() =>
      localStorage.getItem('ball-filter') ? JSON.parse(localStorage.getItem('ball-filter')!) : this.ballFilterService.filters,
    );
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  reset(): void {
    this.ballFilterService.resetFilters();
  }

  async updateFilter<T extends keyof BallFilter>(key: T, value: unknown): Promise<void> {
    if (key === 'weight') {
      await this.changeWeight(value as number);
    }
    this.ballFilterService.filters.update((filters) => ({
      ...filters,
      [key]: value,
    }));
  }

  confirm(): Promise<boolean> {
    this.ballFilterService.filters.update((filters) => ({
      ...filters,
    }));
    this.ballFilterService.saveFilters();
    // this.ballFilterService.filterGames(this.games);
    return this.modalCtrl.dismiss('confirm');
  }

  async changeWeight(weight: number): Promise<void> {
    try {
      await this.storageService.loadAllBalls(undefined, weight);
    } catch (error) {
      console.error('Error loading balls:', error);
      this.toastService.showToast(ToastMessages.ballLoadError, 'bug', true);
    }
  }
}
