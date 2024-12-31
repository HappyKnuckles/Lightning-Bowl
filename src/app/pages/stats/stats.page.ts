import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import Chart from 'chart.js/auto';
import { merge, Subscription } from 'rxjs';
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
import { Game } from 'src/app/models/game-model';
import { GameStatsService } from 'src/app/services/game-stats/game-stats.service';
import { HapticService } from 'src/app/services/haptic/haptic.service';
import { LoadingService } from 'src/app/services/loader/loading.service';
import { ToastService } from 'src/app/services/toast/toast.service';
import { FormsModule } from '@angular/forms';
import { Swiper } from 'swiper';
import { IonicSlides } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarNumber, calendarNumberOutline, filterOutline } from 'ionicons/icons';
import { StatDisplayComponent } from 'src/app/components/stat-display/stat-display.component';
import { PrevStats, SessionStats, Stats } from 'src/app/models/stats-model';
import { SpareDisplayComponent } from '../../components/spare-display/spare-display.component';
import { StorageService } from 'src/app/services/storage/storage.service';
import { FilterComponent } from 'src/app/components/filter/filter.component';
import { ModalController } from '@ionic/angular';
import { FilterService } from 'src/app/services/filter/filter.service';
import { SortUtilsService } from 'src/app/services/sort-utils/sort-utils.service';
import { ChartGenerationService } from 'src/app/services/chart/chart-generation.service';

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
export class StatsPage implements OnInit, OnDestroy {
  swiperModules = [IonicSlides];

  // used to only generate charts when value is changed
  statsValueChanged: boolean[] = [true, true, true];

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
    spareRates: [] as number[],
  };
  // Stats
  stats: Stats = {
    totalGames: 0,
    totalPins: 0,
    perfectGameCount: 0,
    cleanGameCount: 0,
    cleanGamePercentage: 0,
    totalStrikes: 0,
    totalSpares: 0,
    totalSparesMissed: 0,
    totalSparesConverted: 0,
    pinCounts: Array(11).fill(0),
    missedCounts: Array(11).fill(0),
    averageStrikesPerGame: 0,
    averageSparesPerGame: 0,
    averageOpensPerGame: 0,
    strikePercentage: 0,
    sparePercentage: 0,
    openPercentage: 0,
    spareConversionPercentage: 0,
    averageFirstCount: 0,
    averageScore: 0,
    highGame: 0,
    spareRates: [],
    overallSpareRate: 0,
    overallMissedRate: 0,
  };
  sessionStats: SessionStats = {
    totalGames: 0,
    totalPins: 0,
    perfectGameCount: 0,
    cleanGameCount: 0,
    cleanGamePercentage: 0,
    totalStrikes: 0,
    totalSpares: 0,
    totalSparesMissed: 0,
    totalSparesConverted: 0,
    pinCounts: Array(11).fill(0),
    missedCounts: Array(11).fill(0),
    averageStrikesPerGame: 0,
    averageSparesPerGame: 0,
    averageOpensPerGame: 0,
    strikePercentage: 0,
    sparePercentage: 0,
    openPercentage: 0,
    spareConversionPercentage: 0,
    averageFirstCount: 0,
    averageScore: 0,
    highGame: 0,
    lowGame: 0,
    spareRates: [],
    overallSpareRate: 0,
    overallMissedRate: 0,
  };
  statDefinitions = [
    { label: 'Games', key: 'totalGames', id: 'totalGames' },
    {
      label: 'Perfect games',
      key: 'perfectGameCount',
      id: 'perfectGameCount',
      toolTip: 'A perfect game means every frame is filled with strikes.',
      prevKey: 'perfectGameCount',
    },
    {
      label: 'Clean games',
      key: 'cleanGameCount',
      id: 'cleanGameCount',
      toolTip: 'A clean game means every frame is filled with either a strike or a spare.',
      prevKey: 'cleanGameCount',
    },
    {
      label: 'Clean game percentage',
      key: 'cleanGamePercentage',
      id: 'cleanGamePercentage',
      isPercentage: true,
      toolTip: 'The percentage of how many games were clean games.',
      prevKey: 'cleanGamePercentage',
    },
    { label: 'Average', key: 'averageScore', id: 'averageScore', prevKey: 'averageScore' },
    { label: 'High game', key: 'highGame', id: 'highGame' },
    { label: 'Total pins', key: 'totalPins', id: 'totalPins' },
    { label: 'First ball average', key: 'averageFirstCount', id: 'averageFirstCount', prevKey: 'averageFirstCount' },
    { label: 'Total strikes', key: 'totalStrikes', id: 'totalStrikes' },
    { label: 'Strikes per game', key: 'averageStrikesPerGame', id: 'averageStrikesPerGame', prevKey: 'averageStrikesPerGame' },
    {
      label: 'Strike-percentage',
      key: 'strikePercentage',
      id: 'strikePercentage',
      isPercentage: true,
      toolTip: 'This is the strike probability, calculated as the percentage of strikes you achieve out of a maximum of 12 per game.',
      prevKey: 'strikePercentage',
    },
    { label: 'Total spares', key: 'totalSpares', id: 'totalSpares' },
    { label: 'Spares per game', key: 'averageSparesPerGame', id: 'averageSparesPerGame', prevKey: 'averageSparesPerGame' },
    {
      label: 'Spare-percentage',
      key: 'overallSpareRate',
      id: 'sparePercentage',
      isPercentage: true,
      toolTip: 'This is the probability of how likely you hit a spare if your first throw was not a strike.',
      prevKey: 'overallSpareRate',
    },
    { label: 'Total opens', key: 'totalSparesMissed', id: 'totalSparesMissed' },
    { label: 'Opens per game', key: 'averageOpensPerGame', id: 'averageOpensPerGame', prevKey: 'averageOpensPerGame' },
    {
      label: 'Open-percentage',
      key: 'overallMissedRate',
      id: 'openPercentage',
      isPercentage: true,
      toolTip: 'This is the probability of how likely you miss a spare if your first throw was not a strike.',
      prevKey: 'overallMissedRate',
    },
  ];
  sessionStatDefinitions = [
    { label: 'Games', key: 'totalGames', id: 'sessionTotalGames' },
    {
      label: 'Perfect games',
      key: 'perfectGameCount',
      id: 'sessionPerfectGameCount',
      toolTip: 'A perfect game means every frame is filled with strikes.',
    },
    {
      label: 'Clean games',
      key: 'cleanGameCount',
      id: 'sessionCleanGameCount',
      toolTip: 'A clean game means every frame is filled with either a strike or a spare.',
    },
    {
      label: 'Clean game percentage',
      key: 'cleanGamePercentage',
      id: 'sessionCleanGamePercentage',
      isPercentage: true,
      toolTip: 'The percentage of how many games were clean games.',
      prevKey: 'cleanGamePercentage',
    },
    { label: 'Average', key: 'averageScore', id: 'sessionAverage', prevKey: 'averageScore' },
    { label: 'High game', key: 'highGame', id: 'sessionHighGame' },
    { label: 'Low game', key: 'lowGame', id: 'sessionLowGame' },
    { label: 'Total pins', key: 'totalPins', id: 'sessionTotalPins' },
    { label: 'First ball average', key: 'averageFirstCount', id: 'sessionAverageFirstCount', prevKey: 'averageFirstCount' },
    { label: 'Total strikes', key: 'totalStrikes', id: 'sessionTotalStrikes' },
    { label: 'Strikes per game', key: 'averageStrikesPerGame', id: 'sessionAverageStrikesPerGame', prevKey: 'averageStrikesPerGame' },
    {
      label: 'Strike-percentage',
      key: 'strikePercentage',
      id: 'sessionStrikePercentage',
      isPercentage: true,
      toolTip: 'This shows your strike probability, calculated as the percentage of strikes you achieve out of a maximum of 12 per game.',
      prevKey: 'strikePercentage',
    },
    { label: 'Total spares', key: 'totalSpares', id: 'sessionTotalSpares' },
    { label: 'Spares per game', key: 'averageSparesPerGame', id: 'sessionAverageSparesPerGame', prevKey: 'averageSparesPerGame' },
    {
      label: 'Spare-percentage',
      key: 'overallSpareRate',
      id: 'sessionSparePercentage',
      isPercentage: true,
      toolTip: 'This is the probability of how likely you hit a spare if your first throw was not a strike.',
      prevKey: 'overallSpareRate',
    },
    { label: 'Total opens', key: 'totalSparesMissed', id: 'sessionTotalSparesMissed' },
    { label: 'Opens per game', key: 'averageOpensPerGame', id: 'sessionAverageOpensPerGame', prevKey: 'averageOpensPerGame' },
    {
      label: 'Open-percentage',
      key: 'overallMissedRate',
      id: 'sessionOpenPercentage',
      isPercentage: true,
      toolTip: 'This is the probability of how likely you miss a spare if your first throw was not a strike.',
      prevKey: 'overallMissedRate',
    },
  ];
  selectedDate: number = 0;
  uniqueSortedDates: number[] = [];
  // Game Data
  gameHistory: Game[] = [];
  filteredGameHistory: Game[] = [];
  gameHistoryChanged: boolean = true;
  selectedSegment: string = 'Overall';
  segments: string[] = ['Overall', 'Spares', 'Throws', 'Sessions'];
  activeFilterCount = this.filterService.activeFilterCount;
  // Subscriptions
  private gameSubscriptions: Subscription = new Subscription();
  private currentStatSubscription: Subscription;
  private sessionStatSubscription: Subscription;
  private filteredGamesSubscription!: Subscription;

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
    private statsService: GameStatsService,
    private toastService: ToastService,
    private storageService: StorageService,
    private hapticService: HapticService,
    private modalCtrl: ModalController,
    private filterService: FilterService,
    private sortUtilsService: SortUtilsService,
    private chartService: ChartGenerationService
  ) {
    this.currentStatSubscription = this.statsService.currentStats$.subscribe((stats) => {
      this.stats = stats;
    });

    this.sessionStatSubscription = this.statsService.sessionStats$.subscribe((stats) => {
      this.sessionStats = stats;
    });

    addIcons({ filterOutline, calendarNumberOutline, calendarNumber });
  }
  async ngOnInit(): Promise<void> {
    try {
      this.loadingService.setLoading(true);
      await this.loadGameHistory();
      this.calculateStats();
      this.subscribeToDataEvents();
      // this.generateCharts();
    } catch (error) {
      console.error(error);
    } finally {
      this.loadingService.setLoading(false);
    }
  }
  async openFilterModal() {
    // TODO Think if using it like this so highlighted dates are only that match the current filter or not
    const modal = await this.modalCtrl.create({
      component: FilterComponent,
      componentProps: {
        games: this.gameHistory,
        filteredGames: this.filteredGameHistory,
      },
    });

    return await modal.present();
  }

  ngOnDestroy(): void {
    this.currentStatSubscription.unsubscribe();
    this.sessionStatSubscription.unsubscribe();
    this.filteredGamesSubscription.unsubscribe();
  }

  async handleRefresh(event: any): Promise<void> {
    try {
      this.hapticService.vibrate(ImpactStyle.Medium, 200);
      this.loadingService.setLoading(true);
      await this.loadGameHistory();
      this.calculateStats(true);
      this.generateCharts(undefined, true);
    } catch (error) {
      console.error(error);
    } finally {
      event.target.complete();
      this.loadingService.setLoading(false);
    }
  }

  onDateChange(event: any): void {
    const selectedDate = event.target.value;
    this.statsService.calculateStatsBasedOnDate(this.gameHistory, selectedDate);
  }

  onSegmentChanged(event: any) {
    if (this.swiperInstance) {
      this.selectedSegment = event.detail.value;
      const activeIndex = this.getSlideIndex(this.selectedSegment);
      this.swiperInstance.slideTo(activeIndex);
      this.generateCharts(activeIndex);
    }
  }

  onSlideChanged() {
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

  private calculateStats(isRefresh?: boolean): void {
    if (this.gameHistoryChanged || isRefresh) {
      try {
        // await this.loadGameHistory();
        // this.sortUtilsService.sortGameHistoryByDate(this.gameHistory, true);
        this.loadStats();

        if (this.selectedDate) {
          this.statsService.calculateStatsBasedOnDate(this.gameHistory, this.selectedDate);
        }

        this.gameHistoryChanged = false; // Reset the flag
      } catch (error) {
        this.toastService.showToast(`Error loading history and stats: ${error}`, 'bug', true);
      }
    }
  }

  private async loadGameHistory() {
    try {
      this.gameHistory = await this.storageService.loadGameHistory();
      this.sortUtilsService.sortGameHistoryByDate(this.gameHistory, true);
      this.filterService.filterGames(this.gameHistory);
    } catch (error) {
      this.toastService.showToast(`Error loading history: ${error}`, 'bug', true);
    }
  }

  private loadStats() {
    try {
      // TODO adjust so stats are not calculated twice (on startup and on init)
      // currently this is needed to get previous stats before the first game
      // and has to happen on init because wrong stats if you add games before opening stats page
      this.statsService.calculateStats(this.filteredGameHistory);

      // this.stats = this.statsService.currentStats;

      const prevStats = localStorage.getItem('prevStats');
      this.prevStats = prevStats ? JSON.parse(prevStats) : this.statsService.prevStats;

      this.processDates();
    } catch (error) {
      this.toastService.showToast(`Error loading stats: ${error}`, 'bug', true);
    }
  }

  // TODO if filtergamedlength was 0, the charts dont load until restart
  private generateCharts(index?: number, isReload?: boolean): void {
    if (this.gameHistory.length > 0 && (index === undefined || this.statsValueChanged[index])) {
      if (this.selectedSegment === 'Overall') {
        this.generateScoreChart(isReload);
      } else if (this.selectedSegment === 'Spares') {
        this.generatePinChart(isReload);
      } else if (this.selectedSegment === 'Throws') {
        this.generateThrowChart(isReload);
      }

      if (index !== undefined) {
        this.statsValueChanged[index] = false;
      }
      this.swiperInstance?.updateAutoHeight();
    }
  }

  private processDates() {
    const dateSet = new Set<number>();

    this.gameHistory.forEach((game) => {
      // Add only the date part (ignoring time) to the Set
      const date = new Date(game.date);
      // Set the time to midnight to ensure we only consider the date
      date.setHours(0, 0, 0, 0);
      dateSet.add(date.getTime()); // Store the Unix timestamp
    });

    // Convert the Set to an Array and sort it
    this.uniqueSortedDates = Array.from(dateSet).sort((a, b) => b - a);
    this.selectedDate = this.uniqueSortedDates[0];
  }

  private subscribeToDataEvents(): void {
    this.gameSubscriptions.add(
      merge(this.storageService.newGameAdded, this.storageService.gameDeleted).subscribe(() => {
        this.gameHistoryChanged = true;
        this.loadGameHistory();
        // this.calculateStats()
        //   .then(() => {
        //     this.generateCharts();
        //     this.statsValueChanged = [true, true, true];
        //   })
        //   .catch((error) => {
        //     console.error('Error loading data and calculating stats:', error);
        //   });
      })
    );

    this.filteredGamesSubscription = this.filterService.filteredGames$.subscribe((games) => {
      this.filteredGameHistory = games;
      this.activeFilterCount = this.filterService.activeFilterCount;
      this.gameHistoryChanged = true;
      this.calculateStats();
      this.generateCharts(undefined, true);
      this.statsValueChanged = [true, true, true];
    });
  }

  private generateScoreChart(isReload?: boolean): void {
    if (!this.scoreChart) {
      return;
    }

    this.scoreChartInstance = this.chartService.generateScoreChart(this.scoreChart, this.gameHistory, this.scoreChartInstance!, isReload);
  }

  private generatePinChart(isReload?: boolean): void {
    if (!this.pinChart) {
      return;
    }

    this.pinChartInstance = this.chartService.generatePinChart(this.pinChart, this.stats, this.pinChartInstance!, isReload);
  }

  private generateThrowChart(isReload?: boolean): void {
    if (!this.throwChart) {
      return;
    }

    this.throwChartInstance = this.chartService.generateThrowChart(this.throwChart, this.stats, this.throwChartInstance!, isReload);
  }
}
