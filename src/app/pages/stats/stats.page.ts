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
import { GameStatsService } from 'src/app/core/services/game-stats/game-stats.service';
import { HapticService } from 'src/app/core/services/haptic/haptic.service';
import { LoadingService } from 'src/app/core/services/loader/loading.service';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { calendarNumber, calendarNumberOutline, filterOutline, cloudUploadOutline, cloudDownloadOutline } from 'ionicons/icons';
import { SessionStats } from 'src/app/core/models/stats.model';
import { StorageService } from 'src/app/core/services/storage/storage.service';
import { AlertController, ModalController, RefresherCustomEvent, SegmentCustomEvent } from '@ionic/angular';
import { SortUtilsService } from 'src/app/core/services/sort-utils/sort-utils.service';
import { ChartGenerationService } from 'src/app/core/services/chart/chart-generation.service';
import {
  overallStatDefinitions,
  seriesStatDefinitions,
  sessionStatDefinitions,
  throwStatDefinitions,
  playFrequencyStatDefinitions,
  specialStatDefinitions,
  strikeStatDefinitions,
} from '../../core/constants/stats.definitions.constants';
import { GameFilterService } from 'src/app/core/services/game-filter/game-filter.service';
import { UtilsService } from 'src/app/core/services/utils/utils.service';
import { ToastService } from 'src/app/core/services/toast/toast.service';
import { ExcelService } from 'src/app/core/services/excel/excel.service';
import { Filesystem } from '@capacitor/filesystem';
import { ToastMessages } from 'src/app/core/constants/toast-messages.constants';
import { GenericFilterActiveComponent } from 'src/app/shared/components/generic-filter-active/generic-filter-active.component';
import { GAME_FILTER_CONFIG } from 'src/app/shared/components/generic-filter-active/filter-configs';
import { GameFilterComponent } from 'src/app/shared/components/game-filter/game-filter.component';
import { SpareDisplayComponent } from 'src/app/shared/components/spare-display/spare-display.component';
import { StatDisplayComponent } from 'src/app/shared/components/stat-display/stat-display.component';
import { BallStatsComponent } from '../../shared/components/ball-stats/ball-stats.component';

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
    GenericFilterActiveComponent,
    BallStatsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsPage implements OnInit, AfterViewInit {
  @ViewChild(IonContent) content!: IonContent;
  gameFilterConfig = GAME_FILTER_CONFIG;
  overallStatDefinitions = overallStatDefinitions;
  seriesStatDefinitions = seriesStatDefinitions;
  throwStatDefinitions = throwStatDefinitions;
  sessionStatDefinitions = sessionStatDefinitions;
  playFrequencyStatDefinitions = playFrequencyStatDefinitions;
  specialStatDefinitions = specialStatDefinitions;
  strikeStatDefinitions = strikeStatDefinitions;
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
  chartViewMode: 'week' | 'game' | 'monthly' = 'game';
  selectedSegment = 'Overall';
  segments: string[] = ['Overall', 'Spares', 'Throws', 'Sessions'];
  // Viewchilds and Instances
  @ViewChild('scoreChart', { static: false }) scoreChart?: ElementRef;
  @ViewChild('pinChart', { static: false }) pinChart?: ElementRef;
  @ViewChild('throwChart', { static: false }) throwChart?: ElementRef;
  @ViewChild('scoreDistributionChart', { static: false }) scoreDistributionChart?: ElementRef;
  @ViewChild('spareDistributionChart', { static: false }) spareDistributionChart?: ElementRef;
  private spareDistributionChartInstance: Chart | null = null;
  private scoreDistributionChartInstance: Chart | null = null;
  private pinChartInstance: Chart | null = null;
  private throwChartInstance: Chart | null = null;
  private scoreChartInstance: Chart | null = null;

  constructor(
    public loadingService: LoadingService,
    public statsService: GameStatsService,
    public storageService: StorageService,
    public gameFilterService: GameFilterService,
    private hapticService: HapticService,
    private modalCtrl: ModalController,
    private sortUtilsService: SortUtilsService,
    private utilsService: UtilsService,
    private chartService: ChartGenerationService,
    private toastService: ToastService,
    private excelService: ExcelService,
    private alertController: AlertController,
  ) {
    addIcons({ cloudUploadOutline, cloudDownloadOutline, filterOutline, calendarNumberOutline, calendarNumber });
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
      this.hapticService.vibrate(ImpactStyle.Medium);
      await this.storageService.loadGameHistory();
      this.generateCharts(true);
    } catch (error) {
      console.error(error);
      this.toastService.showToast(ToastMessages.gameLoadError, 'bug', true);
    } finally {
      event.target.complete();
    }
  }

  onSegmentChanged(event: SegmentCustomEvent): void {
    this.selectedSegment = event.detail.value?.toString() || 'Overall';
    this.generateCharts();
    setTimeout(() => {
      this.content.scrollToTop(300);
    }, 300);
  }

  async handleFileUpload(event: Event): Promise<void> {
    try {
      this.loadingService.setLoading(true);
      const input = event.target as HTMLInputElement;
      if (!input.files || input.files.length === 0) return;
      const file = input.files[0];
      const gameData = await this.excelService.readExcelData(file);
      await this.excelService.transformData(gameData);
      this.toastService.showToast(ToastMessages.excelFileUploadSuccess, 'checkmark-outline');
    } catch (error) {
      this.toastService.showToast(ToastMessages.excelFileUploadError, 'bug', true);
      console.error(error);
    } finally {
      const input = event.target as HTMLInputElement;
      input.value = '';
      this.loadingService.setLoading(false);
    }
  }

  openExcelFileInput(): void {
    const fileInput = document.getElementById('excelUpload');
    if (fileInput) {
      fileInput.click();
    }
  }

  async exportToExcel(): Promise<void> {
    try {
      const gotPermission = await this.excelService.exportToExcel();
      if (gotPermission) {
        this.toastService.showToast(ToastMessages.excelFileDownloadSuccess, 'checkmark-outline');
      } else {
        await this.showPermissionDeniedAlert();
      }
    } catch (error) {
      this.toastService.showToast(ToastMessages.excelFileDownloadError, 'bug', true);
      console.error('Error exporting to Excel:', error);
    }
  }

  private async showPermissionDeniedAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Permission Denied',
      message: 'To save to Gamedata.xlsx, you need to give permissions!',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Try again',
          handler: async () => {
            const permissionRequestResult = await Filesystem.requestPermissions();
            if (permissionRequestResult.publicStorage === 'granted') {
              this.exportToExcel();
            }
          },
        },
      ],
    });
    await alert.present();
  }

  private generateCharts(isReload?: boolean): void {
    if (this.gameFilterService.filteredGames().length > 0) {
      if (this.selectedSegment === 'Overall') {
        this.generateScoreChart(isReload);
        this.generateScoreDistributionChart(isReload);
      } else if (this.selectedSegment === 'Spares') {
        this.generatePinChart(isReload);
        this.generateSpareDistributionChart(isReload);
      } else if (this.selectedSegment === 'Throws') {
        this.generateThrowChart(isReload);
      }
    }
  }
  private generateScoreChart(isReload?: boolean): void {
    try {
      if (!this.scoreChart) {
        return;
      }

      this.scoreChartInstance = this.chartService.generateScoreChart(
        this.scoreChart,
        this.sortUtilsService.sortGameHistoryByDate([...this.gameFilterService.filteredGames()], true),
        this.scoreChartInstance!,
        this.chartViewMode,
        () => this.toggleChartView(),
        isReload,
      );
    } catch (error) {
      this.toastService.showToast(ToastMessages.chartGenerationError, 'bug', true);
      console.error('Error generating score chart:', error);
    }
  }
  private toggleChartView() {
    if (this.chartViewMode === 'game') {
      this.chartViewMode = 'week';
    } else if (this.chartViewMode === 'week') {
      this.chartViewMode = 'monthly';
    } else {
      this.chartViewMode = 'game';
    }

    this.generateScoreChart(true);
  }

  private generateScoreDistributionChart(isReload?: boolean): void {
    try {
      if (!this.scoreDistributionChart) {
        return;
      }

      this.scoreDistributionChartInstance = this.chartService.generateScoreDistributionChart(
        this.scoreDistributionChart,
        this.sortUtilsService.sortGameHistoryByDate([...this.gameFilterService.filteredGames()], true),
        this.scoreDistributionChartInstance!,
        isReload,
      );
    } catch (error) {
      this.toastService.showToast(ToastMessages.chartGenerationError, 'bug', true);
      console.error('Error generating score distribution chart:', error);
    }
  }

  private generateSpareDistributionChart(isReload?: boolean): void {
    try {
      if (!this.spareDistributionChart) {
        return;
      }

      this.spareDistributionChartInstance = this.chartService.generateSpareDistributionChart(
        this.spareDistributionChart,
        this.statsService.currentStats(),
        this.spareDistributionChartInstance!,
        isReload,
      );
    } catch (error) {
      this.toastService.showToast(ToastMessages.chartGenerationError, 'bug', true);
      console.error('Error generating spare distribution chart:', error);
    }
  }

  private generatePinChart(isReload?: boolean): void {
    try {
      if (!this.pinChart) {
        return;
      }

      this.pinChartInstance = this.chartService.generatePinChart(this.pinChart, this.statsService.currentStats(), this.pinChartInstance!, isReload);
    } catch (error) {
      this.toastService.showToast(ToastMessages.chartGenerationError, 'bug', true);
      console.error('Error generating pin chart:', error);
    }
  }

  private generateThrowChart(isReload?: boolean): void {
    try {
      if (!this.throwChart) {
        return;
      }

      this.throwChartInstance = this.chartService.generateThrowChart(
        this.throwChart,
        this.statsService.currentStats(),
        this.throwChartInstance!,
        isReload,
      );
    } catch (error) {
      this.toastService.showToast(ToastMessages.chartGenerationError, 'bug', true);
      console.error('Error generating throw chart:', error);
    }
  }
}
