import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, OnInit, ViewChild, AfterViewInit, effect, computed, Signal, signal, ChangeDetectionStrategy } from '@angular/core';
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
import { PrevStats, SessionStats } from 'src/app/models/stats.model';
import { SpareDisplayComponent } from '../../components/spare-display/spare-display.component';
import { StorageService } from 'src/app/services/storage/storage.service';
import { ModalController } from '@ionic/angular';
import { SortUtilsService } from 'src/app/services/sort-utils/sort-utils.service';
import { ChartGenerationService } from 'src/app/services/chart/chart-generation.service';
import { overallStatDefinitions, seriesStatDefinitions, sessionStatDefinitions, throwStatDefinitions } from './stats.definitions';
import { GameFilterService } from 'src/app/services/game-filter/game-filter.service';
import { GameFilterComponent } from 'src/app/components/game-filter/game-filter.component';
import { UtilsService } from 'src/app/services/utils/utils.service';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsPage implements OnInit, AfterViewInit {
  swiperModules = [IonicSlides];
  // Previous Stats
  prevStats: PrevStats = localStorage.getItem('prevStats') ? JSON.parse(localStorage.getItem('prevStats')!) : {};
  overallStatDefinitions = overallStatDefinitions;
  seriesStatDefinitions = seriesStatDefinitions;
  throwStatDefinitions = throwStatDefinitions;
  sessionStatDefinitions = sessionStatDefinitions;
  uniqueSortedDates: Signal<number[]> = computed(() => {
    const dateSet = new Set<number>();

    this.storageService.games().forEach((game) => {
      const date = new Date(game.date);
      date.setHours(0, 0, 0, 0);
      dateSet.add(date.getTime());
    });

    return Array.from(dateSet).sort((a, b) => b - a);
  });
  _selectedDate = signal<number | null>(null);
  selectedDate = computed(() => {
    return this._selectedDate() !== null ? this._selectedDate()! : this.uniqueSortedDates()[0];
  });
  sessionStats: Signal<SessionStats> = computed(() => {
    const selDate = this.selectedDate();
    const filteredGames = this.storageService.games().filter((game) => this.utilsService.isSameDay(game.date, selDate));

    return this.statsService.calculateBowlingStats(filteredGames) as SessionStats;
  });
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
    private utilsService: UtilsService,
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
      // this.processDates();
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
      componentProps: {},
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
    if (this.storageService.games().length > 0) {
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
    this.scoreChartInstance = this.chartService.generateScoreChart(
      this.scoreChart,
      this.sortUtilsService.sortGameHistoryByDate([...this.gameFilterService.filteredGames()], true),
      this.scoreChartInstance!,
      isReload
    );
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
}
