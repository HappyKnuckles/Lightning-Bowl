import { NgIf, NgFor, DatePipe } from '@angular/common';
import { Component, Input, Renderer2, ViewChild, ViewChildren, QueryList, OnChanges, SimpleChanges, computed, OnInit, input } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { ImpactStyle } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import { AlertController, InfiniteScrollCustomEvent, ModalController } from '@ionic/angular';
import {
  IonButton,
  IonSelect,
  IonSelectOption,
  IonItemSliding,
  IonAccordionGroup,
  IonItemOption,
  IonIcon,
  IonItemOptions,
  IonItem,
  IonAccordion,
  IonTextarea,
  IonGrid,
  IonRow,
  IonCol,
  IonInput,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonText,
  IonList,
  IonItemDivider,
  IonLabel,
  IonBadge,
  IonModal,
} from '@ionic/angular/standalone';
import { toPng } from 'html-to-image';
import { addIcons } from 'ionicons';
import {
  cloudUploadOutline,
  cloudDownloadOutline,
  filterOutline,
  trashOutline,
  createOutline,
  shareOutline,
  documentTextOutline,
  medalOutline,
  bowlingBallOutline,
  gridOutline,
} from 'ionicons/icons';
import { ToastMessages } from 'src/app/core/constants/toast-messages.constants';
import { Game, Frame, cloneFrames, createThrow } from 'src/app/core/models/game.model';
import { HapticService } from 'src/app/core/services/haptic/haptic.service';
import { LoadingService } from 'src/app/core/services/loader/loading.service';
import { StorageService } from 'src/app/core/services/storage/storage.service';
import { ToastService } from 'src/app/core/services/toast/toast.service';
import { UtilsService } from 'src/app/core/services/utils/utils.service';
import { GenericTypeaheadComponent } from '../generic-typeahead/generic-typeahead.component';
import { createPartialPatternTypeaheadConfig } from '../generic-typeahead/typeahead-configs';
import { TypeaheadConfig } from '../generic-typeahead/typeahead-config.interface';
import { PatternService } from 'src/app/core/services/pattern/pattern.service';
import { Pattern } from 'src/app/core/models/pattern.model';
import { LongPressDirective } from 'src/app/core/directives/long-press/long-press.directive';
import { Router } from '@angular/router';
import { GameGridComponent } from '../game-grid/game-grid.component';
import { BallSelectComponent } from '../ball-select/ball-select.component';
import { alertEnterAnimation, alertLeaveAnimation } from '../../animations/alert.animation';
import { AnalyticsService } from 'src/app/core/services/analytics/analytics.service';
import { BowlingGameValidationService } from 'src/app/core/services/game-utils/bowling-game-validation.service';
import { GameScoreCalculatorService } from 'src/app/core/services/game-score-calculator/game-score-calculator.service';
import { PinDeckFrameRowComponent } from '../pin-deck-frame-row/pin-deck-frame-row.component';
import { GameUtilsService } from 'src/app/core/services/game-utils/game-utils.service';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
  providers: [DatePipe, ModalController],
  imports: [
    IonModal,
    IonBadge,
    IonLabel,
    IonItemDivider,
    IonList,
    IonText,
    IonInfiniteScrollContent,
    IonInfiniteScroll,
    IonInput,
    IonCol,
    IonRow,
    IonGrid,
    IonTextarea,
    IonAccordion,
    IonItem,
    IonAccordion,
    IonAccordionGroup,
    IonTextarea,
    IonItemOption,
    IonItemOptions,
    IonItem,
    IonItemSliding,
    IonButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonInput,
    NgIf,
    NgFor,
    IonSelect,
    IonSelectOption,
    ReactiveFormsModule,
    FormsModule,
    LongPressDirective,
    DatePipe,
    GameGridComponent,
    GenericTypeaheadComponent,
    BallSelectComponent,
    PinDeckFrameRowComponent,
  ],
  standalone: true,
})
export class GameComponent implements OnChanges, OnInit {
  @ViewChild('modal', { static: false }) modal!: IonModal;
  games = input.required<Game[]>();
  @Input() isLeaguePage?: boolean = false;
  @Input() gameCount?: number;
  @ViewChild('accordionGroup') accordionGroup!: IonAccordionGroup;
  @ViewChildren(GameGridComponent) gameGrids!: QueryList<GameGridComponent>;

  leagues = computed(() => {
    const savedLeagues = this.storageService.leagues();
    if (!this.games) return savedLeagues;
    const leagueKeys = this.games().reduce((acc: string[], game: Game) => {
      if (game.league && !acc.includes(game.league)) {
        acc.push(game.league);
      }
      return acc;
    }, []);
    return [...new Set([...leagueKeys, ...savedLeagues])];
  });

  // leagues = computed(() => {
  //   const savedLeagues = this.storageService.leagues();

  //   const savedJson = localStorage.getItem('leagueSelection');
  //   const allLeagueKeys = this.games.reduce((acc: string[], game: Game) => {
  //     if (game.league && !acc.includes(game.league)) {
  //       acc.push(game.league);
  //     }
  //     return acc;
  //   }, []);

  //   if (!savedJson) {
  //     return allLeagueKeys;
  //   }

  //   const savedSelection: Record<string, boolean> = savedJson ? JSON.parse(savedJson) : {};

  //   const uniqueCombinedLeagues = [...new Set([...allLeagueKeys, ...savedLeagues])];

  //   return uniqueCombinedLeagues.filter(league => savedSelection[league] === true);
  // });
  sortedGames: Game[] = [];
  showingGames: Game[] = [];
  presentingElement?: HTMLElement;
  private batchSize = 100;
  public loadedCount = 0;
  isEditMode: Record<string, boolean> = {};
  private closeTimers: Record<string, NodeJS.Timeout> = {};
  public delayedCloseMap: Record<string, boolean> = {};
  private originalGameState: Record<string, Game> = {};
  private editedGameStates: Record<string, Game> = {};
  patternTypeaheadConfig!: TypeaheadConfig<Partial<Pattern>>;
  enterAnimation = alertEnterAnimation;
  leaveAnimation = alertLeaveAnimation;
  public editedFocus: Record<string, { frameIndex: number; throwIndex: number }> = {};

  constructor(
    private alertController: AlertController,
    private toastService: ToastService,
    public storageService: StorageService,
    private loadingService: LoadingService,
    private datePipe: DatePipe,
    private hapticService: HapticService,
    private renderer: Renderer2,
    private utilsService: UtilsService,
    private router: Router,
    private modalCtrl: ModalController,
    private patternService: PatternService,
    private analyticsService: AnalyticsService,
    private validationService: BowlingGameValidationService,
    private gameUtilsService: GameUtilsService,
    private gameScoreCalculatorService: GameScoreCalculatorService,
  ) {
    addIcons({
      trashOutline,
      createOutline,
      shareOutline,
      bowlingBallOutline,
      gridOutline,
      documentTextOutline,
      medalOutline,
      cloudUploadOutline,
      cloudDownloadOutline,
      filterOutline,
    });
  }

  ngOnInit(): void {
    this.presentingElement = document.querySelector('.ion-page')!;
    this.patternTypeaheadConfig = createPartialPatternTypeaheadConfig((searchTerm: string) => this.patternService.searchPattern(searchTerm));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['games'] && this.games) {
      this.sortedGames = [...this.games()].sort((a, b) => b.date - a.date);
      this.showingGames = this.sortedGames.slice(0, this.batchSize);
      this.loadedCount += this.batchSize;
    }
  }

  loadMoreGames(event: InfiniteScrollCustomEvent): void {
    setTimeout(() => {
      this.showingGames = this.sortedGames.slice(0, this.loadedCount + this.batchSize);
      this.loadedCount += this.batchSize;
      event.target.complete();
      if (this.loadedCount >= this.games.length) {
        event.target.disabled = true;
      }
    }, 50);
  }

  async deleteGame(gameId: string): Promise<void> {
    this.hapticService.vibrate(ImpactStyle.Heavy);
    const alert = await this.alertController.create({
      header: 'Confirm Deletion',
      message: 'Are you sure you want to delete this game?',
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
              await this.storageService.deleteGame(gameId);
              this.toastService.showToast(ToastMessages.gameDeleteSuccess, 'remove-outline');
            } catch (error) {
              console.error('Error deleting game:', error);
              this.toastService.showToast(ToastMessages.gameDeleteError, 'bug', true);
            }
          },
        },
      ],
    });

    await alert.present();
  }

  // TODO this should save the state of the panel and revert to it
  openExpansionPanel(accordionId?: string): void {
    const nativeEl = this.accordionGroup;
    if (nativeEl.value === accordionId) nativeEl.value = undefined;
    else nativeEl.value = accordionId;
  }

  saveOriginalStateAndEnableEdit(game: Game): void {
    if (!this.isEditMode[game.gameId]) {
      this.originalGameState[game.gameId] = structuredClone(game);
      this.enableEdit(game, game.gameId);

      // If this game is pin mode, initialize focus to last frame/throw
      if (game.isPinMode) {
        const edited = this.getEditedGameState(game);
        let lastFrameIndex = 9;
        let lastThrowIndex = 0;
        // find last non-empty frame starting from end
        for (let i = 9; i >= 0; i--) {
          const f = edited.frames[i];
          if (f && f.throws && f.throws.length > 0) {
            lastFrameIndex = i;
            lastThrowIndex = Math.max(0, f.throws.length - 1);
            break;
          }
        }
        this.editedFocus[game.gameId] = { frameIndex: lastFrameIndex, throwIndex: lastThrowIndex };
      }
    } else {
      this.cancelEdit(game);
    }
  }

  enableEdit(game: Game, accordionId?: string): void {
    this.isEditMode[game.gameId] = !this.isEditMode[game.gameId];
    this.hapticService.vibrate(ImpactStyle.Light);

    if (accordionId) {
      this.openExpansionPanel(accordionId);
      this.delayedCloseMap[game.gameId] = true;
    }
  }

  onBallSelect(selectedBalls: string[], game: Game, modal: IonModal): void {
    modal.dismiss();
    game.balls = selectedBalls;
  }

  onScoreCellClick(game: Game, frameIndex: number, throwIndex: number): void {
    if (!this.isEditMode[game.gameId] || !game.isPinMode) return;

    const editedGame = this.getEditedGameState(game);

    const canClick = this.gameUtilsService.isCellAccessible(editedGame.frames, frameIndex, throwIndex);

    if (canClick) {
      this.editedFocus[game.gameId] = { frameIndex, throwIndex };
    }
  }

  getPinsLeftStandingForEditedGame(game: Game): number[] {
    const focus = this.editedFocus[game.gameId];
    if (!focus) return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    const edited = this.getEditedGameState(game);
    const frame = edited.frames[focus.frameIndex];
    const throws = frame.throws || [];

    return this.gameUtilsService.getAvailablePins(focus.frameIndex, focus.throwIndex, throws);
  }

  canRecordStrike(game: Game): boolean {
    const pinsLeft = this.getPinsLeftStandingForEditedGame(game);
    return pinsLeft.length === 10;
  }

  canRecordSpare(game: Game): boolean {
    const pinsLeft = this.getPinsLeftStandingForEditedGame(game);
    return pinsLeft.length > 0 && pinsLeft.length < 10;
  }

  async onPinThrowConfirmed(event: { pinsKnockedDown: number[] }, game: Game): Promise<void> {
    if (!this.isEditMode[game.gameId] || !game.isPinMode) return;

    const focus = this.editedFocus[game.gameId] || { frameIndex: 0, throwIndex: 0 };
    const editedGame = this.getEditedGameState(game);

    const result = this.gameUtilsService.processPinThrow(editedGame.frames, focus.frameIndex, focus.throwIndex, event.pinsKnockedDown || []);

    this.editedFocus[game.gameId] = {
      frameIndex: result.nextFrameIndex,
      throwIndex: result.nextThrowIndex,
    };

    this.updateEditedGameWithNewFrames(game.gameId, result.updatedFrames);
  }

  handlePinUndoRequested(game: Game): void {
    if (!this.isEditMode[game.gameId] || !game.isPinMode) return;
    const focus = this.editedFocus[game.gameId];
    if (!focus) return;

    const editedGame = this.getEditedGameState(game);

    const result = this.gameUtilsService.applyPinModeUndo(editedGame.frames, focus.frameIndex, focus.throwIndex);

    if (!result) return;

    this.editedFocus[game.gameId] = {
      frameIndex: result.nextFrameIndex,
      throwIndex: result.nextThrowIndex,
    };

    this.updateEditedGameWithNewFrames(game.gameId, result.updatedFrames);
  }

  getSelectedBallsText(game: Game): string {
    const balls = game.balls || [];
    return balls.length > 0 ? balls.join(', ') : 'None';
  }

  cancelEdit(game: Game): void {
    const saved = this.originalGameState[game.gameId];
    if (saved) {
      Object.assign(game, saved);
      delete this.originalGameState[game.gameId];
    }

    // Clear edited state
    delete this.editedGameStates[game.gameId];

    if (game.isSeries) {
      this.updateSeries(game, game.league, game.patterns);
    }

    this.isEditMode[game.gameId] = false;
    this.hapticService.vibrate(ImpactStyle.Light);

    const wasOpen = this.delayedCloseMap[game.gameId];
    this.openExpansionPanel(wasOpen ? game.gameId : undefined);
    delete this.delayedCloseMap[game.gameId];
  }

  getEditedGameState(game: Game): Game {
    if (!this.editedGameStates[game.gameId]) {
      this.editedGameStates[game.gameId] = structuredClone(game);
    }
    return this.editedGameStates[game.gameId];
  }

  onEditThrowInput(event: { frameIndex: number; throwIndex: number; value: string }, game: Game): void {
    const { frameIndex, throwIndex, value } = event;

    // Get or create the edited state
    const editedGame = this.getEditedGameState(game);
    const frames = cloneFrames(editedGame.frames);

    // Handle empty input (remove throw)
    if (value.length === 0) {
      this.removeThrow(frames, frameIndex, throwIndex);
      this.updateEditedGameWithNewFrames(game.gameId, frames);
      return;
    }

    // Parse the input value using validation service
    const parsedValue = this.gameUtilsService.parseInputValue(value, frameIndex, throwIndex, frames);

    // Validate the input using validation service
    if (!this.validationService.isValidNumber0to10(parsedValue)) {
      this.handleEditInvalidInput(game.gameId, frameIndex, throwIndex);
      return;
    }

    if (!this.validationService.isValidFrameScore(parsedValue, frameIndex, throwIndex, frames)) {
      this.handleEditInvalidInput(game.gameId, frameIndex, throwIndex);
      return;
    }

    // Record the throw
    this.recordThrow(frames, frameIndex, throwIndex, parsedValue);
    this.updateEditedGameWithNewFrames(game.gameId, frames);

    // Focus next input in the grid
    const grid = this.gameGrids.find((g) => g.game()?.gameId === game.gameId);
    if (grid) {
      grid.focusNextInput(frameIndex, throwIndex);
    }
  }

  private handleEditInvalidInput(gameId: string, frameIndex: number, throwIndex: number): void {
    this.hapticService.vibrate(ImpactStyle.Heavy);
    const grid = this.gameGrids.find((g) => g.game()?.gameId === gameId);
    if (grid) {
      grid.handleInvalidInput(frameIndex, throwIndex);
    }
  }

  private recordThrow(frames: Frame[], frameIndex: number, throwIndex: number, value: number): void {
    const frame = frames[frameIndex];
    if (!frame) return;

    while (frame.throws.length <= throwIndex) {
      frame.throws.push(createThrow(0, frame.throws.length + 1));
    }

    frame.throws[throwIndex] = createThrow(value, throwIndex + 1);
  }

  private removeThrow(frames: Frame[], frameIndex: number, throwIndex: number): void {
    const frame = frames[frameIndex];
    if (!frame || !frame.throws) return;

    if (throwIndex >= 0 && throwIndex < frame.throws.length) {
      frame.throws.splice(throwIndex, 1);
      frame.throws.forEach((t, idx) => {
        t.throwIndex = idx + 1;
      });
    }
  }

  private updateEditedGameWithNewFrames(gameId: string, frames: Frame[]): void {
    const scoreResult = this.gameScoreCalculatorService.calculateScoreFromFrames(frames);
    const editedGame = this.editedGameStates[gameId];

    if (editedGame) {
      this.editedGameStates[gameId] = {
        ...editedGame,
        frames,
        frameScores: scoreResult.frameScores,
        totalScore: scoreResult.totalScore,
      };
    }
  }

  updateSeries(game: Game, league?: string, patterns?: string[]): void {
    if (!game.isSeries) return;

    this.storageService.games.update((gamesArr) =>
      gamesArr.map((g) => {
        if (g.seriesId === game.seriesId) {
          return {
            ...g,
            ...(league !== undefined && { league }),
            ...(patterns !== undefined && { patterns }),
          };
        }
        return g;
      }),
    );
  }

  async saveEdit(game: Game): Promise<void> {
    try {
      const editedState = this.editedGameStates[game.gameId];

      const updatedGame: Game = editedState
        ? {
            ...game,
            frames: editedState.frames,
            frameScores: editedState.frameScores,
            totalScore: editedState.totalScore,
            isPractice: !game.league,
          }
        : {
            ...game,
            isPractice: !game.league,
          };

      // 1) Validate using the current data
      if (!this.isGameValid(updatedGame)) {
        this.hapticService.vibrate(ImpactStyle.Heavy);
        this.toastService.showToast(ToastMessages.invalidInput, 'bug', true);
        return;
      }

      // 2) Did we change league or patterns? Compare original with current data.
      const originalGameSnapshot = this.originalGameState[game.gameId];
      const leagueChanged = originalGameSnapshot && originalGameSnapshot.league !== updatedGame.league;
      const patternsChanged = originalGameSnapshot && JSON.stringify(originalGameSnapshot.patterns) !== JSON.stringify(updatedGame.patterns);

      // 3) If part of a series and league/patterns changed → update everyone
      if (updatedGame.isSeries && (leagueChanged || patternsChanged)) {
        const seriesIdToUpdate = updatedGame.seriesId;
        const newLeague = updatedGame.league;
        const newPatterns = updatedGame.patterns;
        const newIsPractice = !newLeague;

        // First, save the primary edited game
        await this.storageService.saveGameToLocalStorage(updatedGame);

        // Then, update other games in the same series
        const gamesToUpdateInStorage = this.storageService
          .games()
          .filter((g) => g.seriesId === seriesIdToUpdate && g.gameId !== updatedGame.gameId)
          .map((g) => ({
            ...g,
            league: newLeague,
            patterns: newPatterns,
            isPractice: newIsPractice,
          }));
        await this.storageService.saveGamesToLocalStorage(gamesToUpdateInStorage);
      } else {
        await this.storageService.saveGameToLocalStorage(updatedGame);
      }

      this.toastService.showToast(ToastMessages.gameUpdateSuccess, 'refresh-outline');
      this.isEditMode[game.gameId] = false;
      this.hapticService.vibrate(ImpactStyle.Light);

      const wasOpen = this.delayedCloseMap[game.gameId];
      this.openExpansionPanel(wasOpen ? game.gameId : undefined);

      this.analyticsService.trackGameEdited();
      delete this.originalGameState[game.gameId];
      delete this.editedGameStates[game.gameId];
      delete this.delayedCloseMap[game.gameId];
    } catch (error) {
      this.toastService.showToast(ToastMessages.gameUpdateError, 'bug', true);
      console.error('Error saving game edit:', error);
    }
  }

  // Hides the accordion content so it renders faster
  hideContent(event: CustomEvent): void {
    const openGameIds: string[] = event.detail.value || [];

    openGameIds.forEach((gameId) => {
      if (this.closeTimers[gameId]) {
        clearTimeout(this.closeTimers[gameId]);
        delete this.closeTimers[gameId];
      }
      this.delayedCloseMap[gameId] = true;
    });

    Object.keys(this.delayedCloseMap).forEach((gameId) => {
      if (!openGameIds.includes(gameId)) {
        if (!this.closeTimers[gameId]) {
          this.closeTimers[gameId] = setTimeout(() => {
            if (!(this.accordionGroup?.value || []).includes(gameId)) {
              this.delayedCloseMap[gameId] = false;
            }
            delete this.closeTimers[gameId];
          }, 500);
        }
      }
    });
  }

  navigateToBallsPage(balls: string[]): void {
    const searchQuery = balls.join(', ');
    if (this.isLeaguePage) {
      this.modalCtrl.dismiss();
    }
    this.router.navigate(['tabs/balls'], { queryParams: { search: searchQuery } });
  }

  isDelayedOpen(gameId: string): boolean {
    return this.delayedCloseMap[gameId];
  }

  isNewMonth(index: number): boolean {
    if (index === 0) {
      return true;
    }
    const currentGameDate = new Date(this.showingGames[index].date);
    const previousGameDate = new Date(this.showingGames[index - 1].date);
    return currentGameDate.getMonth() !== previousGameDate.getMonth() || currentGameDate.getFullYear() !== previousGameDate.getFullYear();
  }

  getMonthName(timestamp: number): string {
    const date = new Date(timestamp);
    const options: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  }

  getMonthGameCount(date: number): number {
    return this.showingGames.filter((game) => new Date(game.date).getMonth() === new Date(date).getMonth()).length;
  }

  isGameValid(game: Game): boolean {
    return this.validationService.isGameValid(game);
  }

  parseIntValue(value: unknown): number {
    return this.utilsService.parseIntValue(value) as number;
  }

  async takeScreenshotAndShare(game: Game): Promise<void> {
    this.delayedCloseMap[game.gameId] = true;
    const accordion = document.getElementById(game.gameId);
    if (!accordion) {
      throw new Error('Accordion not found');
    }

    await new Promise((resolve) => setTimeout(resolve, 30));

    const scoreTemplate = accordion.querySelector('.grid-container') as HTMLElement;

    if (!scoreTemplate) {
      throw new Error('Score template not found in the accordion');
    }

    const accordionGroupEl = this.accordionGroup;
    const accordionGroupValues = this.accordionGroup.value;
    const accordionIsOpen = accordionGroupEl.value?.includes(game.gameId) ?? false;

    if (!accordionIsOpen) {
      this.openExpansionPanel(game.gameId);
    }
    const childNode = accordion.childNodes[1] as HTMLElement;

    const originalWidth = childNode.style.width;

    try {
      this.loadingService.setLoading(true);

      // Temporarily show the panel content
      this.renderer.setStyle(childNode, 'width', '700px');

      const formattedDate = this.datePipe.transform(game.date, 'dd.MM.yy');

      const messageParts = [
        game.totalScore === 300
          ? `Look at me bitches, perfect game on ${formattedDate}! 🎳🎉.`
          : `Check out this game from ${formattedDate}. A ${game.totalScore}.`,

        game.balls && game.balls.length > 0
          ? game.balls.length === 1
            ? `Bowled with: ${game.balls[0]}`
            : `Bowled with: ${game.balls.join(', ')}`
          : null,

        game.patterns && game.patterns.length > 0 ? `Patterns: ${game.patterns.join(', ')}` : null,
      ];

      const message = messageParts.filter((part) => part !== null).join('\n');

      await new Promise((resolve) => setTimeout(resolve, 100)); // Give time for layout to update

      // Generate screenshot
      const dataUrl = await toPng(scoreTemplate, { quality: 0.7 });
      const base64Data = dataUrl.split(',')[1];

      if (navigator.share && navigator.canShare({ files: [new File([], '')] })) {
        // Web Share API is supported
        const blob = await (await fetch(dataUrl)).blob();
        const filesArray = [
          new File([blob], `score_${game.gameId}.png`, {
            type: blob.type,
          }),
        ];

        await navigator.share({
          title: 'Game Score',
          text: message,
          files: filesArray,
        });
      } else {
        // Fallback for native mobile platforms
        const fileName = `score_${game.gameId}.png`;

        await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache,
          encoding: Encoding.UTF8,
        });

        const fileUri = await Filesystem.getUri({
          directory: Directory.Cache,
          path: fileName,
        });

        await Share.share({
          title: 'Game Score',
          text: message,
          url: fileUri.uri,
          dialogTitle: 'Share Game Score',
        });
        this.toastService.showToast(ToastMessages.screenshotShareSuccess, 'share-social-outline');
      }
    } catch (error) {
      console.error('Error taking screenshot and sharing', error);
      this.toastService.showToast(ToastMessages.screenshotShareError, 'bug', true);
    } finally {
      // Restore the original state
      this.renderer.setStyle(childNode, 'width', originalWidth);
      this.accordionGroup.value = accordionGroupValues;
      this.delayedCloseMap[game.gameId] = false;
      this.loadingService.setLoading(false);
    }
  }
}
