import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, ViewChild } from '@angular/core';
import { BallFilterService } from 'src/app/core/services/ball-filter/ball-filter.service';
import { FormsModule } from '@angular/forms';
import { BallService } from 'src/app/core/services/ball/ball.service';
import { CommonModule } from '@angular/common';
import { BallFilter, CoreType, CoverstockType, Market } from 'src/app/core/models/filter.model';
import {
  IonDatetime,
  IonDatetimeButton,
  IonInput,
  IonItem,
  IonLabel,
  IonModal,
  IonSelect,
  IonSelectOption,
  IonToggle,
} from '@ionic/angular/standalone';
import { StorageService } from 'src/app/core/services/storage/storage.service';
import { ToastService } from 'src/app/core/services/toast/toast.service';
import { ToastMessages } from 'src/app/core/constants/toast-messages.constants';
import { LoadingService } from 'src/app/core/services/loader/loading.service';
import { GenericTypeaheadComponent } from '../generic-typeahead/generic-typeahead.component';
import { createBallCoreTypeaheadConfig, createBallCoverstockTypeaheadConfig } from '../generic-typeahead/typeahead-configs';
import { TypeaheadConfig } from '../generic-typeahead/typeahead-config.interface';
import { Core, Coverstock } from 'src/app/core/models/ball.model';
import { GenericFilterComponent } from '../generic-filter/generic-filter.component';

@Component({
  selector: 'app-ball-filter-new',
  templateUrl: './ball-filter-new.component.html',
  styleUrls: ['./ball-filter-new.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    IonToggle,
    IonModal,
    IonDatetime,
    IonDatetimeButton,
    IonLabel,
    IonInput,
    IonItem,
    IonSelect,
    CommonModule,
    IonSelectOption,
    GenericTypeaheadComponent,
    GenericFilterComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class BallFilterNewComponent implements OnInit {
  @ViewChild(GenericFilterComponent) genericFilter!: GenericFilterComponent<BallFilter, any>;

  markets: Market[] = [Market.ALL, Market.US, Market.INT];
  coreTypes: CoreType[] = [CoreType.ALL, CoreType.ASYMMETRIC, CoreType.SYMMETRIC];
  coverstockTypes: CoverstockType[] = Object.values(CoverstockType);
  weights: string[] = ['12', '13', '14', '15', '16'];
  presentingElement?: HTMLElement;
  coreTypeaheadConfig!: TypeaheadConfig<Core>;
  coverstockTypeaheadConfig!: TypeaheadConfig<Coverstock>;

  constructor(
    public ballFilterService: BallFilterService,
    public ballService: BallService,
    private storageService: StorageService,
    private toastService: ToastService,
    private loadingService: LoadingService,
  ) {}

  ngOnInit() {
    this.presentingElement = document.querySelector('.ion-page')!;
    this.coreTypeaheadConfig = createBallCoreTypeaheadConfig();
    this.coverstockTypeaheadConfig = createBallCoverstockTypeaheadConfig();
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

  async changeWeight(weight: number): Promise<void> {
    try {
      this.loadingService.setLoading(true);
      await this.storageService.loadAllBalls(undefined, weight);
    } catch (error) {
      console.error('Error loading balls:', error);
      this.toastService.showToast(ToastMessages.ballLoadError, 'bug', true);
    } finally {
      this.loadingService.setLoading(false);
    }
  }
}