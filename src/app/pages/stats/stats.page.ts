import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, OnInit, ViewChild, AfterViewInit, effect } from '@angular/core';
import Chart from 'chart.js/auto';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonRefresher,
  IonText,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { NgIf, NgFor, DecimalPipe, DatePipe } from '@angular/common';
import { ImpactStyle } from '@capacitor/haptics';
import { GameStatsService } from 'src/app/services/game-stats/game-stats.service';
import { HapticService } from 'src/app/services/haptic/haptic.service';
import { LoadingService } from 'src/app/services/loader/loading.service';
import { FormsModule } from '@angular/forms';
import { Swiper } from 'swiper';
import { IonicSlides } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarNumber, calendarNumberOutline, filterOutline } from 'ionicons/icons';
import { StatDisplayComponent } from 'src/app/components/stat-display/stat-display.component';
import { PrevStats } from 'src/app/models/stats.model';
import { SpareDisplayComponent } from '../../components/spare-display/spare-display.component';
import { StorageService } from 'src/app/services/storage/storage.service';
import { ModalController } from '@ionic/angular';
import { SortUtilsService } from 'src/app/services/sort-utils/sort-utils.service';
import { ChartGenerationService } from 'src/app/services/chart/chart-generation.service';
import { overallStatDefinitions, seriesStatDefinitions, sessionStatDefinitions, throwStatDefinitions } from './stats.definitions';
import { GameFilterService } from 'src/app/services/game-filter/game-filter.service';
import { GameFilterComponent } from 'src/app/components/game-filter/game-filter.component';

@Component({
  selector: 'app-stats',
  templateUrl: 'stats.page.html',
  styleUrls: ['stats.page.scss'],
  standalone: true,
  providers: [DecimalPipe, DatePipe, ModalController],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    IonLabel,
    IonSegmentButton,
    IonSegment,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonRefresher,
    IonSelectOption,
    IonSelect,
    IonText,
    NgIf,
    NgFor,
    FormsModule,
    DatePipe,
    StatDisplayComponent,
    SpareDisplayComponent,
  ],
})
export class StatsPage implements OnInit, AfterViewInit {
  swiperModules = [IonicSlides];
  // Previous Stats
  prevStats: PrevStats = {
    strikePercentage: 0,
    sparePercentage: 0,
    openPercentage: 0,
    cleanGamePercentage: 0,
    averageStrikesPerGame: 0,
    averageSparesPerGame: 0,
    averageOpensPerGame: 0,
    averageFirstCount: 0,
    cleanGameCount: 0,
    perfectGameCount: 0,
    averageScore: 0,
    overallSpareRate: 0,
    overallMissedRate: 0,
    average3SeriesScore: 0,
    average4SeriesScore: 0,
    average5SeriesScore: 0,
    spareRates: [] as number[],
  };
  overallStatDefinitions = overallStatDefinitions;
  seriesStatDefinitions = seriesStatDefinitions;
  throwStatDefinitions = throwStatDefinitions;
  sessionStatDefinitions = sessionStatDefinitions;
  selectedDate: number = 0;
  uniqueSortedDates: number[] = [];
  selectedSegment: string = 'Overall';
  segments: string[] = ['Overall', 'Spares', 'Throws', 'Sessions'];

  // Viewchilds and Instances
  @ViewChild('scoreChart', { static: false }) scoreChart?: ElementRef;
  @ViewChild('pinChart', { static: false }) pinChart?: ElementRef;
  @ViewChild('throwChart', { static: false }) throwChart?: ElementRef;
  @ViewChild('swiper')
  set swiper(swiperRef: ElementRef) {
    /**
     * This setTimeout waits for Ionic's async initialization to complete.
     * Otherwise, an outdated swiper reference will be used.
     */
    setTimeout(() => {
      this.swiperInstance = swiperRef?.nativeElement.swiper;
    }, 0);
  }
  private swiperInstance: Swiper | undefined;
  private pinChartInstance: Chart | null = null;
  private throwChartInstance: Chart | null = null;
  private scoreChartInstance: Chart | null = null;

  constructor(
    public loadingService: LoadingService,
    public statsService: GameStatsService,
    public storageService: StorageService,
    private hapticService: HapticService,
    private modalCtrl: ModalController,
    public gameFilterService: GameFilterService,
    private sortUtilsService: SortUtilsService,
    private chartService: ChartGenerationService
  ) {
    addIcons({ filterOutline, calendarNumberOutline, calendarNumber });
    effect(() => {
      this.gameFilterService.filteredGames();
      this.generateCharts();
    });
  }
  ngOnInit(): void {
    try {
      this.loadingService.setLoading(true);
      this.processDates();
    } catch (error) {
      console.error(error);
    } finally {
      this.loadingService.setLoading(false);
    }
  }

  ngAfterViewInit(): void {
    this.generateCharts();
  }

  async openFilterModal(): Promise<void> {
    // TODO Think if using it like this so highlighted dates are only that match the current filter or not
    const modal = await this.modalCtrl.create({
      component: GameFilterComponent,
      componentProps: {
      },
    });

    return await modal.present();
  }

  async handleRefresh(event: any): Promise<void> {
    try {
      this.hapticService.vibrate(ImpactStyle.Medium, 200);
      await this.storageService.loadGameHistory();
      this.generateCharts(undefined, true);
    } catch (error) {
      console.error(error);
    } finally {
      event.target.complete();
    }
  }

  onDateChange(event: any): void {
    const selectedDate = event.target.value;
    this.statsService.calculateStatsBasedOnDate(this.storageService.games(), selectedDate);
  }

  onSegmentChanged(event: any): void {
    if (this.swiperInstance) {
      this.selectedSegment = event.detail.value;
      const activeIndex = this.getSlideIndex(this.selectedSegment);
      this.swiperInstance.slideTo(activeIndex);
      this.generateCharts(activeIndex);
    }
  }

  onSlideChanged(): void {
    if (this.swiperInstance) {
      const activeIndex = this.swiperInstance.realIndex;
      this.selectedSegment = this.getSegmentValue(activeIndex);
      this.generateCharts(activeIndex);
    }
  }

  private getSlideIndex(segment: string): number {
    const index = this.segments.indexOf(segment);
    return index !== -1 ? index : 0;
  }

  private getSegmentValue(index: number): string {
    return this.segments[index] || 'Overall';
  }

  // TODO if filtergamedlength was 0, the charts dont load until restart
  private generateCharts(index?: number, isReload?: boolean): void {
    if (this.storageService.games().length > 0 ) {
      if (this.selectedSegment === 'Overall') {
        this.generateScoreChart(isReload);
      } else if (this.selectedSegment === 'Spares') {
        this.generatePinChart(isReload);
      } else if (this.selectedSegment === 'Throws') {
        this.generateThrowChart(isReload);
      }


      this.swiperInstance?.updateAutoHeight();
    }
  }

  private generateScoreChart(isReload?: boolean): void {
    if (!this.scoreChart) {
      return;
    }
    this.scoreChartInstance = this.chartService.generateScoreChart(this.scoreChart, this.sortUtilsService.sortGameHistoryByDate(this.gameFilterService.filteredGames(), true), this.scoreChartInstance!, isReload);
  }

  private generatePinChart(isReload?: boolean): void {
    if (!this.pinChart) {
      return;
    }

    this.pinChartInstance = this.chartService.generatePinChart(this.pinChart, this.statsService.currentStats(), this.pinChartInstance!, isReload);
  }

  private generateThrowChart(isReload?: boolean): void {
    if (!this.throwChart) {
      return;
    }

    this.throwChartInstance = this.chartService.generateThrowChart(
      this.throwChart,
      this.statsService.currentStats(),
      this.throwChartInstance!,
      isReload
    );
  }

  private processDates(): void {
    const dateSet = new Set<number>();

    this.storageService.games().forEach((game) => {
      // Add only the date part (ignoring time) to the Set
      const date = new Date(game.date);
      // Set the time to midnight to ensure we only consider the date
      date.setHours(0, 0, 0, 0);
      dateSet.add(date.getTime()); // Store the Unix timestamp
    });

    // Convert the Set to an Array and sort it
    this.uniqueSortedDates = Array.from(dateSet).sort((a, b) => b - a);
    this.selectedDate = this.uniqueSortedDates[0];
    const prevStats = localStorage.getItem('prevStats');
    this.prevStats = prevStats ? JSON.parse(prevStats) : this.statsService.prevStats;
    this.statsService.calculateStatsBasedOnDate(this.storageService.games(), this.selectedDate);
  }
}
