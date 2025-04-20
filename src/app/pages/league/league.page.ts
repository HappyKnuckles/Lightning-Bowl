import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, ViewChild, ViewChildren, QueryList, computed, Signal, signal, effect } from '@angular/core';
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
import { StorageService } from 'src/app/core/services/storage/storage.service';
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
import { Game } from 'src/app/core/models/game.model';
import { ToastService } from 'src/app/core/services/toast/toast.service';
import { AlertController, RefresherCustomEvent, SegmentCustomEvent } from '@ionic/angular';
import { LoadingService } from 'src/app/core/services/loader/loading.service';
import { Stats } from 'src/app/core/models/stats.model';
import { GameStatsService } from 'src/app/core/services/game-stats/game-stats.service';
import { HapticService } from 'src/app/core/services/haptic/haptic.service';
import { ImpactStyle } from '@capacitor/haptics';
import { SortUtilsService } from 'src/app/core/services/sort-utils/sort-utils.service';
import Chart from 'chart.js/auto';
import { ChartGenerationService } from 'src/app/core/services/chart/chart-generation.service';
import { leagueStatDefinitions } from '../stats/stats.definitions';
import { ToastMessages } from 'src/app/core/constants/toast-messages.constants';
import { GameComponent } from 'src/app/shared/components/game/game.component';
import { SpareDisplayComponent } from 'src/app/shared/components/spare-display/spare-display.component';
import { StatDisplayComponent } from 'src/app/shared/components/stat-display/stat-display.component';
import { LongPressDirective } from 'src/app/core/directives/long-press/long-press.directive';

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
    LongPressDirective,
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

  leagueSelectionState = signal<Record<string, boolean>>(this.buildDefaultLeagueSelection());
  isVisibilityEdit = signal(false);
  private previousLeagueSelectionState: Record<string, boolean> = {};

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
    effect(() => {
      const defaults = this.buildDefaultLeagueSelection();

      const savedJson = localStorage.getItem('leagueSelection');
      const saved: Record<string, boolean> = savedJson ? JSON.parse(savedJson) : {};

      const initial = { ...defaults, ...saved };
      this.leagueSelectionState = signal(initial);
    });
  }

  private buildDefaultLeagueSelection(): Record<string, boolean> {
    const keys = this.leagueKeys();
    return keys.reduce(
      (acc, k) => {
        acc[k] = true;
        return acc;
      },
      {} as Record<string, boolean>,
    );
  }

  updateLeagueSelection(league: string, isChecked: boolean) {
    this.leagueSelectionState.update((current) => ({
      ...current,
      [league]: isChecked,
    }));

    localStorage.setItem('leagueSelection', JSON.stringify(this.leagueSelectionState()));
  }

  editVisibility() {
    const newState = !this.isVisibilityEdit();
    this.isVisibilityEdit.set(newState);

    if (newState) {
      this.previousLeagueSelectionState = { ...this.leagueSelectionState() };
      this.toastService.showToast(ToastMessages.leagueEditMode, 'create-outline');
    } else {
      const current = this.leagueSelectionState();
      const previous = this.previousLeagueSelectionState;

      const nowHiding: string[] = [];
      const nowShowing: string[] = [];

      for (const league of Object.keys(current)) {
        if (previous[league] && !current[league]) {
          nowHiding.push(league);
        } else if (!previous[league] && current[league]) {
          nowShowing.push(league);
        }
      }

      const parts: string[] = [];

      if (nowHiding.length) {
        parts.push(`Now Hiding: ${nowHiding.slice(0, 3).join(', ')}${nowHiding.length > 3 ? '...' : ''}`);
      }
      if (nowShowing.length) {
        parts.push(`Now Showing: ${nowShowing.slice(0, 3).join(', ')}${nowShowing.length > 3 ? '...' : ''}`);
      }

      const message = parts.length > 0 ? parts.join('<br>') : 'No visibility changes made.';

      this.toastService.showToast(message, 'checkmark-outline');
    }
  }

  async handleRefresh(event: RefresherCustomEvent): Promise<void> {
    try {
      this.hapticService.vibrate(ImpactStyle.Medium);
      await this.storageService.loadGameHistory();
    } catch (error) {
      console.error(error);
      this.toastService.showToast(ToastMessages.gameLoadError, 'bug', true);
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

  onSegmentChanged(league: string, event: SegmentCustomEvent): void {
    this.selectedSegment = event.detail.value?.toString() || 'Overall';
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
    try {
      await this.storageService.addLeague(league);
      this.toastService.showToast(ToastMessages.leagueSaveSuccess, 'add');
    } catch (error) {
      this.toastService.showToast(ToastMessages.leagueSaveError, 'bug', true);
      console.error('Error saving league:', error);
    }
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
            try {
              await this.storageService.addLeague(data.league);
              this.toastService.showToast(ToastMessages.leagueSaveSuccess, 'add');
            } catch (error) {
              this.toastService.showToast(ToastMessages.leagueSaveError, 'bug', true);
              console.error('Error saving league:', error);
            }
          },
        },
      ],
    });
    await alert.present();
  }

  async deleteLeague(league: string): Promise<void> {
    this.hapticService.vibrate(ImpactStyle.Heavy);
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
            try {
              await this.storageService.deleteLeague(league);
              this.toastService.showToast(ToastMessages.leagueDeleteSuccess, 'remove-outline');
            } catch (error) {
              this.toastService.showToast(ToastMessages.leagueDeleteError, 'bug', true);
              console.error('Error deleting league:', error);
            }
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
            try {
              await this.storageService.editLeague(data.league, league);
              this.toastService.showToast(ToastMessages.leagueEditSuccess, 'checkmark-outline');
            } catch (error) {
              this.toastService.showToast(ToastMessages.leagueEditError, 'bug', true);
              console.error('Error editing league:', error);
            }
          },
        },
      ],
    });

    await alert.present();
  }

  private generateScoreChart(league: string, isReload?: boolean): void {
    try {
      if (!this.scoreChart) {
        return;
      }

      this.scoreChartInstances[league] = this.chartService.generateScoreChart(
        this.scoreChart,
        this.gamesByLeagueReverse()[league],
        this.scoreChartInstances[league]!,
        isReload,
      );
    } catch (error) {
      this.toastService.showToast(ToastMessages.chartGenerationError, 'bug', true);
      console.error('Error generating score chart:', error);
    }
  }

  private generatePinChart(league: string, isReload?: boolean): void {
    try {
      if (!this.pinChart) {
        return;
      }

      this.pinChartInstances[league] = this.chartService.generatePinChart(
        this.pinChart,
        this.statsByLeague()[league],
        this.pinChartInstances[league]!,
        isReload,
      );
    } catch (error) {
      this.toastService.showToast(ToastMessages.chartGenerationError, 'bug', true);
      console.error('Error generating pin chart:', error);
    }
  }
}
