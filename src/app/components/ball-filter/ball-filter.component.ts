import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { BallFilterService } from 'src/app/services/ball-filter/ball-filter.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Brand, Core, Coverstock } from 'src/app/models/ball.model';
import { BallService } from 'src/app/services/ball/ball.service';
import { CommonModule } from '@angular/common';
import { BallFilter, CoreType, Market } from 'src/app/models/filter.model';
import { IonButton, IonButtons, IonContent, IonDatetime, IonDatetimeButton, IonFooter, IonHeader, IonInput, IonItem, IonLabel, IonList, IonModal, IonSelect, IonSelectOption, IonTitle, IonToggle, IonToolbar, ModalController} from '@ionic/angular/standalone';
@Component({
  selector: 'app-ball-filter',
  templateUrl: './ball-filter.component.html',
  styleUrls: ['./ball-filter.component.scss'],
  standalone: true,
  imports: [FormsModule,
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
export class BallFilterComponent implements OnInit {
  brands: Brand[] = [];
  cores: Core[] = [];
  coverstocks: Coverstock[] = [];
  markets: Market[] = [Market.ALL, Market.US, Market.INT];
  coreTypes: CoreType[] = [CoreType.ALL, CoreType.ASYMMETRIC, CoreType.SYMMETRIC];
  weights: number[] = [7,8,9,10,11,12,13,14,15,16];
  constructor(
    public ballFilterService: BallFilterService,
    private modalCtrl: ModalController,
    private ballService: BallService,
  ) {}

  async ngOnInit() { 
    await this.getFilterTypes();
  }

  async getFilterTypes(){
    this.brands = await this.ballService.getBrands();
    this.cores = await this.ballService.getCores();
    this.coverstocks = await this.ballService.getCoverstocks();
  }

  cancel(): Promise<boolean> {
    this.ballFilterService.filters.update(() =>
      localStorage.getItem('ball-filter') ? JSON.parse(localStorage.getItem('ball-filter')!) : this.ballFilterService.filters
    );
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  reset(): void {
    this.ballFilterService.resetFilters();
  }

  updateFilter<T extends keyof BallFilter>(key: T, value: unknown): void {
    this.ballFilterService.filters.update((filters) => ({
      ...filters,
      [key]: value,
    }));
  }

  confirm(): Promise<boolean> {
    this.ballFilterService.filters.update((filters) => ({
      ...filters}));
      this.ballFilterService.saveFilters();
    // this.ballFilterService.filterGames(this.games);
    return this.modalCtrl.dismiss('confirm');
  }
}
