import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, ViewChild, ViewChildren, QueryList, computed, Signal, signal } from '@angular/core';
import { DecimalPipe, NgIf } from '@angular/common';
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
  IonRefresherContent,
  IonSegmentView,
  IonSegmentContent,
  IonActionSheet,
  IonCheckbox,
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
  checkmarkOutline,
  chevronDownOutline,
} from 'ionicons/icons';
import { Game } from 'src/app/core/models/game.model';
import { ToastService } from 'src/app/core/services/toast/toast.service';
import { AlertController, RefresherCustomEvent, SegmentCustomEvent } from '@ionic/angular';
import { LoadingService } from 'src/app/core/services/loader/loading.service';
import { BestBallStats, Stats } from 'src/app/core/models/stats.model';
import { GameStatsService } from 'src/app/core/services/game-stats/game-stats.service';
import { HapticService } from 'src/app/core/services/haptic/haptic.service';
import { ImpactStyle } from '@capacitor/haptics';
import { SortUtilsService } from 'src/app/core/services/sort-utils/sort-utils.service';
import Chart from 'chart.js/auto';
import { ChartGenerationService } from 'src/app/core/services/chart/chart-generation.service';
import { leagueStatDefinitions } from '../../core/constants/stats.definitions.constants';
import { ToastMessages } from 'src/app/core/constants/toast-messages.constants';
import { GameComponent } from 'src/app/shared/components/game/game.component';
import { SpareDisplayComponent } from 'src/app/shared/components/spare-display/spare-display.component';
import { StatDisplayComponent } from 'src/app/shared/components/stat-display/stat-display.component';
import { LongPressDirective } from 'src/app/core/directives/long-press/long-press.directive';
import { BallStatsComponent } from '../../shared/components/ball-stats/ball-stats.component';
import { LeagueSelectorComponent } from '../../shared/components/league-selector/league-selector.component';
import { League, isLeagueObject } from 'src/app/core/models/league.model';

@Component({
  selector: 'app-league',
  templateUrl: './league.page.html',
  styleUrls: ['./league.page.scss'],
  standalone: true,
  imports: [
    IonRefresher,
    IonRefresherContent,
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
    DecimalPipe,
    StatDisplayComponent,
    SpareDisplayComponent,
    IonSegmentButton,
    IonSegment,
    IonSegmentView,
    IonSegmentContent,
    LongPressDirective,
    BallStatsComponent,
    LeagueSelectorComponent,
    IonActionSheet,
    IonCheckbox,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LeaguePage {
  @ViewChild('modalContent') content!: IonContent;
  @ViewChildren('modal') modals!: QueryList<IonModal>;
  @ViewChild('scoreChart', { static: false }) scoreChart?: ElementRef;
  @ViewChild('pinChart', { static: false }) pinChart?: ElementRef;
  @ViewChild('leagueSelector') leagueSelector!: LeagueSelectorComponent;
  selectedSegment = 'Overall';
  segments: string[] = ['Overall', 'Spares', 'Games'];
  gamesByLeague: Signal<Record<string, Game[]>> = computed(() => {
    const games = this.storageService.games();
    return this.sortUtilsService.sortGamesByLeagues(games, true);
  });

  leagues: Signal<League[]> = computed(() => {
    const storedLeagues = this.storageService.leagues();
    const gamesByLeague = this.gamesByLeague();
    const gameLeagueNames = Object.keys(gamesByLeague);

    return gameLeagueNames.map((key) => {
      const league = storedLeagues.find((l) => {
        if (isLeagueObject(l)) {
          return l.name === key;
        }
        return l === key;
      });

      if (league && isLeagueObject(league)) {
        return league;
      }

      return {
        name: key,
        show: true,
        event: 'League' as const,
        isActive: false,
        isSanctioned: true,
      };
    });
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

  bestBallsByLeague: Signal<Record<string, BestBallStats>> = computed(() => {
    const gamesByLeague = this.gamesByLeague();
    const bestBallsByLeague: Record<string, BestBallStats> = {};
    Object.keys(gamesByLeague).forEach((league) => {
      bestBallsByLeague[league] = this.statService.calculateBestBallStats(gamesByLeague[league] || []);
    });
    return bestBallsByLeague;
  });

  mostPlayedBallsByLeague: Signal<Record<string, BestBallStats>> = computed(() => {
    const gamesByLeague = this.gamesByLeague();
    const mostUsedBallsByLeague: Record<string, BestBallStats> = {};
    Object.keys(gamesByLeague).forEach((league) => {
      mostUsedBallsByLeague[league] = this.statService.calculateMostPlayedBall(gamesByLeague[league] || []);
    });
    return mostUsedBallsByLeague;
  });

  statDefinitions = leagueStatDefinitions;
  private scoreChartInstances: Record<string, Chart> = {};
  private pinChartInstances: Record<string, Chart> = {};

  isVisibilityEdit = signal(false);

  private readonly VIEWTYPE_STORAGE_KEY = 'league-view-type';
  viewType = signal<'all' | 'leagues' | 'tournaments'>(this.loadViewTypeFromStorage());

  currentViewTitle = computed(() => {
    switch (this.viewType()) {
      case 'leagues':
        return 'Leagues';
      case 'tournaments':
        return 'Tournaments';
      default:
        return 'Leagues/Tournaments';
    }
  });

  filteredLeagues = computed(() => {
    const allLeagues = this.leagues();
    const viewType = this.viewType();

    if (viewType === 'all') {
      return allLeagues;
    } else if (viewType === 'leagues') {
      return allLeagues.filter((league) => league.event === 'League');
    } else {
      return allLeagues.filter((league) => league.event === 'Tournament');
    }
  });

  get noLeaguesShown(): boolean {
    return !this.leagues().some((league) => league.show);
  }

  get leagueSelectionState() {
    const state: Record<string, boolean> = {};

    this.leagues().forEach((league) => {
      state[league.name] = league.show;
    });

    return state;
  }
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
      checkmarkOutline,
      trashOutline,
      createOutline,
      chevronBack,
      chevronForward,
      chevronDownOutline,
      cameraOutline,
      shareOutline,
      documentTextOutline,
      medalOutline,
    });
  }
  async updateLeagueSelection(league: League, show: boolean): Promise<void> {
    try {
      // Update existing League object
      const updatedLeague: League = { ...league, show: show };
      await this.storageService.editLeague(updatedLeague, league);
    } catch (error) {
      console.error('Error updating league visibility:', error);
      this.toastService.showToast('Error updating league visibility', 'bug', true);
    }
  }

  cancelEdit() {
    this.storageService.loadLeagues();
    this.editVisibility();
  }

  editVisibility() {
    const newState = !this.isVisibilityEdit();
    this.isVisibilityEdit.set(newState);

    if (newState) {
      this.previousLeagueSelectionState = { ...this.leagueSelectionState };
      this.toastService.showToast(ToastMessages.leagueEditMode, 'eye-outline');
    } else {
      const current = this.leagueSelectionState;
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

      const message = parts.length > 0 ? parts.join('<br>') : 'No changes made.';

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

  closeModal(league: string): void {
    this.selectedSegment = 'Overall';
    const modalToDismiss = this.modals.find((modal) => modal.trigger === league);

    if (modalToDismiss) {
      modalToDismiss.dismiss();
    }
  }

  destroyCharts(league: string): void {
    this.pinChartInstances[league]?.destroy();
    this.scoreChartInstances[league]?.destroy();
    delete this.pinChartInstances[league];
    delete this.scoreChartInstances[league];
  }

  onSegmentChanged(league: string, event: SegmentCustomEvent): void {
    this.selectedSegment = event.detail.value?.toString() || 'Overall';
    this.generateCharts(league);
    setTimeout(() => {
      this.content.scrollToTop(300);
    }, 300);
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

  openLeagueSelector(): void {
    if (this.leagueSelector) {
      this.leagueSelector.showLeagueManagementOptions();
    }
  }

  async editLeague(league: League): Promise<void> {
    if (this.leagueSelector) {
      this.leagueSelector.openEditModalWithLeague(league);
    }
  }

  async deleteLeague(league: League | string): Promise<void> {
    const leagueName = typeof league === 'string' ? league : league.name;
    this.hapticService.vibrate(ImpactStyle.Heavy);
    const alert = await this.alertController.create({
      header: 'Confirm Deletion',
      message: `Are you sure you want to delete ${leagueName}?`,
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

  private generateScoreChart(league: string, isReload?: boolean): void {
    try {
      if (!this.scoreChart) {
        return;
      }

      this.scoreChartInstances[league] = this.chartService.generateScoreChart(
        this.scoreChart,
        this.gamesByLeagueReverse()[league],
        this.scoreChartInstances[league]!,
        undefined,
        undefined,
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

  selectViewType(type: 'all' | 'leagues' | 'tournaments') {
    this.viewType.set(type);
    this.saveViewTypeToStorage(type);
  }

  getActionSheetButtons() {
    return [
      {
        text: 'Leagues/Tournaments',
        role: this.viewType() === 'all' ? 'selected' : undefined,
        handler: () => {
          this.selectViewType('all');
        },
      },
      {
        text: 'Leagues',
        role: this.viewType() === 'leagues' ? 'selected' : undefined,
        handler: () => {
          this.selectViewType('leagues');
        },
      },
      {
        text: 'Tournaments',
        role: this.viewType() === 'tournaments' ? 'selected' : undefined,
        handler: () => {
          this.selectViewType('tournaments');
        },
      },
      {
        text: 'Cancel',
        role: 'cancel',
      },
    ];
  }

  private loadViewTypeFromStorage(): 'all' | 'leagues' | 'tournaments' {
    const saved = localStorage.getItem(this.VIEWTYPE_STORAGE_KEY);
    if (saved && (saved === 'all' || saved === 'leagues' || saved === 'tournaments')) {
      return saved;
    }
    return 'all';
  }

  private saveViewTypeToStorage(type: 'all' | 'leagues' | 'tournaments'): void {
    localStorage.setItem(this.VIEWTYPE_STORAGE_KEY, type);
  }
}
