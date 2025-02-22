import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, ViewChild, ViewChildren, QueryList, computed, Signal } from '@angular/core';
import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
  IonButton,
  IonButtons,
  IonIcon,
  IonText,
  IonItem,
  IonLabel,
  IonItemSliding,
  IonItemOption,
  IonItemOptions,
  IonModal,
  IonRefresher,
  IonSegmentView,
  IonSegmentContent,
} from '@ionic/angular/standalone';
import { StorageService } from 'src/app/services/storage/storage.service';
import { addIcons } from 'ionicons';
import {
  chevronForward,
  trashOutline,
  createOutline,
  documentTextOutline,
  shareOutline,
  medalOutline,
  cameraOutline,
  addOutline,
  chevronBack,
} from 'ionicons/icons';
import { Game } from 'src/app/models/game.model';
import { GameComponent } from '../../components/game/game.component';
import { ToastService } from 'src/app/services/toast/toast.service';
import { AlertController } from '@ionic/angular';
import { LoadingService } from 'src/app/services/loader/loading.service';
import { Stats } from 'src/app/models/stats.model';
import { GameStatsService } from 'src/app/services/game-stats/game-stats.service';
import { HapticService } from 'src/app/services/haptic/haptic.service';
import { ImpactStyle } from '@capacitor/haptics';
import { StatDisplayComponent } from 'src/app/components/stat-display/stat-display.component';
import { SpareDisplayComponent } from 'src/app/components/spare-display/spare-display.component';
import { SortUtilsService } from 'src/app/services/sort-utils/sort-utils.service';
import Chart from 'chart.js/auto';
import { ChartGenerationService } from 'src/app/services/chart/chart-generation.service';
import { leagueStatDefinitions } from '../stats/stats.definitions';

@Component({
  selector: 'app-league',
  templateUrl: './league.page.html',
  styleUrls: ['./league.page.scss'],
  standalone: true,
  imports: [
    IonRefresher,
    IonModal,
    IonText,
    IonItemOptions,
    IonItemOption,
    IonItemSliding,
    IonLabel,
    IonItem,
    IonIcon,
    IonButtons,
    IonButton,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    FormsModule,
    GameComponent,
    ReactiveFormsModule,
    NgIf,
    NgFor,
    DecimalPipe,
    StatDisplayComponent,
    SpareDisplayComponent,
    IonSegmentButton,
    IonSegment,
    IonSegmentView,
    IonSegmentContent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LeaguePage {
  @ViewChild('modalContent') content!: IonContent;
  @ViewChildren('modal') modals!: QueryList<IonModal>;
  @ViewChild('scoreChart', { static: false }) scoreChart?: ElementRef;
  @ViewChild('pinChart', { static: false }) pinChart?: ElementRef;
  selectedSegment = 'Overall';
  segments: string[] = ['Overall', 'Spares', 'Games'];
  statsValueChanged: boolean[] = [true, true];
  isEditMode: Record<string, boolean> = {};
  gamesByLeague: Signal<Record<string, Game[]>> = computed(() => {
    const games = this.storageService.games();
    return this.sortUtilsService.sortGamesByLeagues(games, true);
  });
  leagueKeys: Signal<string[]> = computed(() => {
    return Object.keys(this.gamesByLeague());
  });
  overallStats: Signal<Stats> = computed(() => {
    const games = this.storageService.games();
    return this.statService.calculateBowlingStats(games);
  });
  gamesByLeagueReverse: Signal<Record<string, Game[]>> = computed(() => {
    const gamesByLeague = this.gamesByLeague();
    const gamesByLeagueReverse: Record<string, Game[]> = {};

    Object.keys(gamesByLeague).forEach((league) => {
      gamesByLeagueReverse[league] = this.sortUtilsService.sortGameHistoryByDate(gamesByLeague[league] || [], true);
    });

    return gamesByLeagueReverse;
  });
  statsByLeague: Signal<Record<string, Stats>> = computed(() => {
    const gamesByLeague = this.gamesByLeague();
    const statsByLeague: Record<string, Stats> = {};

    Object.keys(gamesByLeague).forEach((league) => {
      statsByLeague[league] = this.statService.calculateBowlingStats(gamesByLeague[league] || []);
    });

    return statsByLeague;
  });
  statDefinitions = leagueStatDefinitions;
  private scoreChartInstances: Record<string, Chart> = {};
  private pinChartInstances: Record<string, Chart> = {};

  constructor(
    public storageService: StorageService,
    private sortUtilsService: SortUtilsService,
    private hapticService: HapticService,
    private statService: GameStatsService,
    public loadingService: LoadingService,
    private alertController: AlertController,
    private toastService: ToastService,
    private chartService: ChartGenerationService,
  ) {
    addIcons({
      addOutline,
      trashOutline,
      createOutline,
      chevronForward,
      chevronBack,
      cameraOutline,
      shareOutline,
      documentTextOutline,
      medalOutline,
    });
  }

  async handleRefresh(event: any): Promise<void> {
    try {
      this.hapticService.vibrate(ImpactStyle.Medium, 200);
      await this.storageService.loadGameHistory();
    } catch (error) {
      console.error(error);
    } finally {
      event.target.complete();
    }
  }

  cancel(league: string): void {
    this.selectedSegment = 'Overall';
    const modalToDismiss = this.modals.find((modal) => modal.trigger === league);

    if (modalToDismiss) {
      modalToDismiss.dismiss();
    }
  }

  destroyCharts(league: string): void {
    this.pinChartInstances[league]?.destroy();
    this.scoreChartInstances[league]?.destroy();
    this.statsValueChanged = [true, true];
  }

  onSegmentChanged(league: string, event: any): void {
    this.selectedSegment = event.detail.value;
    this.generateCharts(league);
    this.content.scrollToTop(300);
  }

  generateCharts(league: string, isReload?: boolean): void {
    if (this.storageService.games().length > 0) {
      if (this.selectedSegment === 'Overall') {
        this.generateScoreChart(league, isReload);
      } else if (this.selectedSegment === 'Spares') {
        this.generatePinChart(league, isReload);
      }
    }
  }

  async saveLeague(league: string): Promise<void> {
    await this.storageService.addLeague(league);
    this.toastService.showToast('League saved sucessfully.', 'add');
  }

  getGamesByLeague(league: string): any[] {
    return this.gamesByLeague()[league] || [];
  }

  getStatsByLeague(league: string): Stats {
    return this.statsByLeague()[league] || [];
  }

  async addLeague() {
    const alert = await this.alertController.create({
      header: 'Add League',
      message: 'Enter the league name',
      inputs: [
        {
          name: 'league',
          type: 'text',
          placeholder: 'League name',
          cssClass: 'league-alert-input',
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Add',
          handler: async (data: { league: string }) => {
            await this.saveLeague(data.league);
          },
        },
      ],
    });
    await alert.present();
  }

  async deleteLeague(league: string): Promise<void> {
    this.hapticService.vibrate(ImpactStyle.Heavy, 300);
    const alert = await this.alertController.create({
      header: 'Confirm Deletion',
      message: 'Are you sure you want to delete this league?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          // handler: () => { },
        },
        {
          text: 'Delete',
          handler: async () => {
            await this.storageService.deleteLeague(league);
            this.toastService.showToast('League deleted sucessfully.', 'remove-outline');
          },
        },
      ],
    });

    await alert.present();
  }

  async editLeague(league: string): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Edit League',
      message: 'Enter the new league name',
      inputs: [
        {
          name: 'league',
          type: 'text',
          value: league,
          placeholder: 'League name',
          cssClass: 'alert-input',
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Edit',
          handler: async (data: { league: string }) => {
            await this.storageService.editLeague(data.league, league);
            this.toastService.showToast('League edited sucessfully.', 'checkmark-outline');
          },
        },
      ],
    });

    await alert.present();
  }

  private generateScoreChart(league: string, isReload?: boolean): void {
    if (!this.scoreChart) {
      return;
    }

    this.scoreChartInstances[league] = this.chartService.generateScoreChart(
      this.scoreChart,
      this.gamesByLeagueReverse()[league],
      this.scoreChartInstances[league]!,
      isReload,
    );
  }

  private generatePinChart(league: string, isReload?: boolean): void {
    if (!this.pinChart) {
      return;
    }

    this.pinChartInstances[league] = this.chartService.generatePinChart(
      this.pinChart,
      this.statsByLeague()[league],
      this.pinChartInstances[league]!,
      isReload,
    );
  }
}
