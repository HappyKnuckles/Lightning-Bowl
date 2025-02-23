import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  OnInit,
  ViewChild,
  AfterViewInit,
  computed,
  Signal,
  signal,
  ChangeDetectionStrategy,
  effect,
} from '@angular/core';
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
  IonSegmentView,
  IonSegmentContent,
} from '@ionic/angular/standalone';
import { NgIf, NgFor, DecimalPipe, DatePipe } from '@angular/common';
import { ImpactStyle } from '@capacitor/haptics';
import { GameStatsService } from 'src/app/services/game-stats/game-stats.service';
import { HapticService } from 'src/app/services/haptic/haptic.service';
import { LoadingService } from 'src/app/services/loader/loading.service';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { calendarNumber, calendarNumberOutline, filterOutline } from 'ionicons/icons';
import { StatDisplayComponent } from 'src/app/components/stat-display/stat-display.component';
import { PrevStats, SessionStats } from 'src/app/models/stats.model';
import { SpareDisplayComponent } from '../../components/spare-display/spare-display.component';
import { StorageService } from 'src/app/services/storage/storage.service';
import { ModalController, RefresherCustomEvent, SegmentCustomEvent } from '@ionic/angular';
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
    IonSegmentContent,
    IonSegmentView,
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
  @ViewChild(IonContent) content!: IonContent;
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
  selectedSegment = 'Overall';
  segments: string[] = ['Overall', 'Spares', 'Throws', 'Sessions'];
  // Viewchilds and Instances
  @ViewChild('scoreChart', { static: false }) scoreChart?: ElementRef;
  @ViewChild('pinChart', { static: false }) pinChart?: ElementRef;
  @ViewChild('throwChart', { static: false }) throwChart?: ElementRef;
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
    private chartService: ChartGenerationService,
  ) {
    addIcons({ filterOutline, calendarNumberOutline, calendarNumber });
    effect(() => {
      if (this.gameFilterService.filteredGames().length > 0) {
        this.generateCharts(true);
      }
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
    this.generateCharts(true);
  }

  async openFilterModal(): Promise<void> {
    // TODO Think if using it like this so highlighted dates are only that match the current filter or not
    const modal = await this.modalCtrl.create({
      component: GameFilterComponent,
      componentProps: {},
    });

    await modal.present();
    /* modal.onDidDismiss().then(() => {
      if (this.gameFilterService.filteredGames().length > 0) {
        this.generateCharts(true);
      }
    });*/
  }

  async handleRefresh(event: RefresherCustomEvent): Promise<void> {
    try {
      this.hapticService.vibrate(ImpactStyle.Medium, 200);
      await this.storageService.loadGameHistory();
      this.generateCharts(true);
    } catch (error) {
      console.error(error);
    } finally {
      event.target.complete();
    }
  }

  onSegmentChanged(event: SegmentCustomEvent): void {
    this.selectedSegment = event.detail.value?.toString() || 'Overall';
    this.generateCharts();
    this.content.scrollToTop(300);
  }

  // TODO if filtergamedlength was 0, the charts dont load until restart
  private generateCharts(isReload?: boolean): void {
    if (this.gameFilterService.filteredGames().length > 0) {
      if (this.selectedSegment === 'Overall') {
        this.generateScoreChart(isReload);
      } else if (this.selectedSegment === 'Spares') {
        this.generatePinChart(isReload);
      } else if (this.selectedSegment === 'Throws') {
        this.generateThrowChart(isReload);
      }
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
      isReload,
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
      isReload,
    );
  }
}
