import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, OnInit, QueryList, signal, ViewChild, ViewChildren } from '@angular/core';
import {
  ActionSheetController,
  AlertController,
  IonModal,
  isPlatform,
  IonHeader,
  IonToolbar,
  IonButton,
  IonIcon,
  IonTitle,
  IonAlert,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonButtons,
  IonSegment,
  IonSegmentButton,
  IonSegmentView,
  IonSegmentContent,
  IonLabel,
} from '@ionic/angular/standalone';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Game, Frame, createEmptyGame, numberArraysToFrames, cloneFrames, createThrow, getThrowValue, Throw } from 'src/app/core/models/game.model';
import { addIcons } from 'ionicons';
import { add, chevronDown, chevronUp, cameraOutline, documentTextOutline, medalOutline, bowlingBallOutline, bowlingBall } from 'ionicons/icons';
import { NgIf, NgFor } from '@angular/common';
import { ImpactStyle } from '@capacitor/haptics';
import { HapticService } from 'src/app/core/services/haptic/haptic.service';
import { ImageProcesserService } from 'src/app/core/services/image-processer/image-processer.service';
import { LoadingService } from 'src/app/core/services/loader/loading.service';
import { ToastService } from 'src/app/core/services/toast/toast.service';
import { UserService } from 'src/app/core/services/user/user.service';
import { defineCustomElements } from '@teamhive/lottie-player/loader';
import { GameUtilsService } from 'src/app/core/services/game-utils/game-utils.service';
import { GameScoreCalculatorService } from 'src/app/core/services/game-score-calculator/game-score-calculator.service';
import { GameDataTransformerService } from 'src/app/core/services/game-transform/game-data-transform.service';
import { InputCustomEvent, ModalController } from '@ionic/angular';
import { ToastMessages } from 'src/app/core/constants/toast-messages.constants';
import { GameGridComponent } from 'src/app/shared/components/game-grid/game-grid.component';
import { HighScoreAlertService } from 'src/app/core/services/high-score-alert/high-score-alert.service';
import { StorageService } from 'src/app/core/services/storage/storage.service';
import { AnalyticsService } from 'src/app/core/services/analytics/analytics.service';
import { BowlingGameValidationService } from 'src/app/core/services/game-utils/bowling-game-validation.service';
import { GameScoreToolbarComponent } from 'src/app/shared/components/game-score-toolbar/game-score-toolbar.component';
import { ThrowConfirmedEvent } from 'src/app/shared/components/pin-input/pin-input.component';

const enum SeriesMode {
  Single = 'Single',
  Series3 = '3 Series',
  Series4 = '4 Series',
  Series5 = '5 Series',
  Series6 = '6 Series',
}

defineCustomElements(window);

@Component({
  selector: 'app-add-game',
  templateUrl: 'add-game.page.html',
  styleUrls: ['add-game.page.scss'],
  standalone: true,
  providers: [ModalController],
  imports: [
    IonHeader,
    IonToolbar,
    IonButton,
    IonIcon,
    IonTitle,
    IonAlert,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonModal,
    IonButtons,
    IonSegmentButton,
    IonSegment,
    IonSegmentContent,
    IonSegmentView,
    IonLabel,
    NgIf,
    NgFor,
    GameGridComponent,
    GameScoreToolbarComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AddGamePage implements OnInit {
  // UI State
  selectedMode: SeriesMode = SeriesMode.Single;
  sheetOpen = false;
  isAlertOpen = false;
  isModalOpen = false;
  is300 = false;
  selectedSegment = 'Game 1';
  segments: string[] = ['Game 1'];
  showScoreToolbar = false;
  toolbarOffset = 0;
  toolbarDisabledState = { strikeDisabled: true, spareDisabled: true };

  // Game Data State
  gameData!: Game; // For OCR Modal
  games = signal(Array.from({ length: 19 }, () => createEmptyGame()));
  totalScores = signal(new Array(19).fill(0));
  maxScores = signal(new Array(19).fill(300));

  // Pin Input Mode State
  isPinInputMode = false;

  // Per-game pin mode state
  pinModeState = signal<
    {
      currentFrameIndex: number;
      currentThrowIndex: number;
      throwsData: Throw[][];
    }[]
  >(
    Array.from({ length: 19 }, () => ({
      currentFrameIndex: 0,
      currentThrowIndex: 0,
      throwsData: Array.from({ length: 10 }, () => []),
    })),
  );

  // Computed State
  seriesMaxscore = computed(() => {
    return this.getActiveTrackIndexes().reduce((acc, idx) => acc + this.maxScores()[idx], 0);
  });

  seriesCurrentScore = computed(() => {
    return this.getActiveTrackIndexes().reduce((acc, idx) => acc + this.totalScores()[idx], 0);
  });

  // View Children & DOM References
  @ViewChildren(GameGridComponent) gameGrids!: QueryList<GameGridComponent>;
  @ViewChild('modalGrid', { static: false }) modalGrid!: GameGridComponent;
  presentingElement!: HTMLElement;

  // Internal Logic State
  private seriesId = '';
  private activeGameIndex = 0;
  private currentFocusedFrame: number | null = null;
  private currentFocusedThrow: number | null = null;

  constructor(
    private actionSheetCtrl: ActionSheetController,
    private imageProcessingService: ImageProcesserService,
    private alertController: AlertController,
    private toastService: ToastService,
    private gameScoreCalculatorService: GameScoreCalculatorService,
    private transformGameService: GameDataTransformerService,
    private loadingService: LoadingService,
    private userService: UserService,
    private hapticService: HapticService,
    private gameUtilsService: GameUtilsService,
    private validationService: BowlingGameValidationService,
    private highScroreAlertService: HighScoreAlertService,
    private storageService: StorageService,
    private analyticsService: AnalyticsService,
  ) {
    addIcons({ cameraOutline, bowlingBallOutline, bowlingBall, chevronDown, chevronUp, medalOutline, documentTextOutline, add });
  }

  async ngOnInit(): Promise<void> {
    this.presentingElement = document.querySelector('.ion-page')!;
    this.loadPinInputMode();
  }

  // PIN INPUT MODE - PARENT LOGIC
  getPinsLeftStanding(gameIndex: number): number[] {
    const allPins = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const state = this.pinModeState()[gameIndex];
    const { currentFrameIndex, currentThrowIndex, throwsData } = state;

    // First throw of any frame always has all pins
    if (currentThrowIndex === 0) {
      return allPins;
    }

    const frameData = throwsData[currentFrameIndex];

    // 10th frame special cases
    if (currentFrameIndex === 9) {
      const firstThrowData = frameData?.[0];
      const secondThrowData = frameData?.[1];

      if (currentThrowIndex === 1) {
        // Second throw of 10th frame
        if (firstThrowData?.value === 10) {
          return allPins; // Strike on first - pins reset
        }
        // Not a strike - use pins left from first throw
        return firstThrowData?.pinsLeftStanding ?? allPins;
      }

      if (currentThrowIndex === 2) {
        // Third throw of 10th frame
        if (firstThrowData?.value === 10 && secondThrowData?.value === 10) {
          return allPins; // Two strikes - pins reset
        }
        if (firstThrowData?.value === 10 && secondThrowData?.value !== 10) {
          // Strike then non-strike - use second throw's remaining pins
          return secondThrowData?.pinsLeftStanding ?? allPins;
        }
        if (firstThrowData && secondThrowData && firstThrowData.value !== 10 && firstThrowData.value + secondThrowData.value === 10) {
          return allPins; // Spare - pins reset
        }
      }
    }

    // Normal frames (1-9): second throw uses pins left from first throw
    const prevThrow = frameData?.[currentThrowIndex - 1];
    if (prevThrow) {
      return prevThrow.pinsLeftStanding!;
    }

    return allPins;
  }

  canRecordStrikeForPinMode(gameIndex: number): boolean {
    const state = this.pinModeState()[gameIndex];
    const game = this.games()[gameIndex];
    return this.validationService.canRecordStrike(state.currentFrameIndex, state.currentThrowIndex, game.frames);
  }

  canRecordSpareForPinMode(gameIndex: number): boolean {
    const state = this.pinModeState()[gameIndex];
    const game = this.games()[gameIndex];
    return this.validationService.canRecordSpare(state.currentFrameIndex, state.currentThrowIndex, game.frames);
  }

  canUndoForPinMode(gameIndex: number): boolean {
    const game = this.games()[gameIndex];
    return this.validationService.canUndoLastThrow(game.frames);
  }

  isGameCompleteForPinMode(gameIndex: number): boolean {
    const game = this.games()[gameIndex];
    return this.validationService.isGameComplete(game.frames);
  }

  getCurrentFrameIndex(gameIndex: number): number {
    return this.pinModeState()[gameIndex].currentFrameIndex;
  }

  getCurrentThrowIndex(gameIndex: number): number {
    return this.pinModeState()[gameIndex].currentThrowIndex;
  }

  handlePinThrowConfirmed(event: ThrowConfirmedEvent, gameIndex: number): void {
    const { pinsKnockedDown } = event;
    const state = this.pinModeState()[gameIndex];
    const { currentFrameIndex, currentThrowIndex, throwsData } = state;

    // 1. Calculate pins left standing
    const availablePins = this.getPinsLeftStanding(gameIndex);
    const pinsLeftStanding = availablePins.filter((pin) => !pinsKnockedDown.includes(pin));
    const pinsKnockedDownCount = pinsKnockedDown.length;

    // 2. Determine if this is a split (only on first throw of frame, or special 10th frame cases)
    const isSplit = this.calculateSplit(currentFrameIndex, currentThrowIndex, pinsLeftStanding, throwsData);

    // 3. Create throw data
    const throwData: Throw = {
      value: pinsKnockedDownCount,
      throwIndex: currentThrowIndex + 1,
      pinsLeftStanding,
      pinsKnockedDown,
      isSplit,
    };

    // 4. Update throws data
    const newThrowsData = [...throwsData];
    if (!newThrowsData[currentFrameIndex]) {
      newThrowsData[currentFrameIndex] = [];
    }
    newThrowsData[currentFrameIndex] = [...newThrowsData[currentFrameIndex]];
    newThrowsData[currentFrameIndex][currentThrowIndex] = throwData;

    // 5. Update game frames
    const game = this.games()[gameIndex];
    const frames = cloneFrames(game.frames);
    const frame = frames[currentFrameIndex];

    while (frame.throws.length <= currentThrowIndex) {
      frame.throws.push(createThrow(0, frame.throws.length + 1));
    }
    frame.throws[currentThrowIndex] = {
      value: pinsKnockedDownCount,
      throwIndex: currentThrowIndex + 1,
      isSplit,
      pinsLeftStanding,
      pinsKnockedDown: pinsKnockedDown,
    };

    // 6. Calculate next position
    const { nextFrameIndex, nextThrowIndex } = this.calculateNextPosition(currentFrameIndex, currentThrowIndex, pinsKnockedDownCount, frames);

    // 7. Update all state
    this.pinModeState.update((states) => {
      const newStates = [...states];
      newStates[gameIndex] = {
        currentFrameIndex: nextFrameIndex,
        currentThrowIndex: nextThrowIndex,
        throwsData: newThrowsData,
      };
      return newStates;
    });

    // 8. Update game state (scores)
    this.updateGameState(frames, gameIndex, false);
  }

  handlePinUndoRequested(gameIndex: number): void {
    const state = this.pinModeState()[gameIndex];
    const { currentFrameIndex, currentThrowIndex, throwsData } = state;

    // Find previous position
    const { prevFrameIndex, prevThrowIndex } = this.calculatePreviousPosition(currentFrameIndex, currentThrowIndex, throwsData);

    if (prevFrameIndex < 0) {
      return; // Nothing to undo
    }

    // Clear throw data
    const newThrowsData = [...throwsData];
    if (newThrowsData[prevFrameIndex]) {
      newThrowsData[prevFrameIndex] = newThrowsData[prevFrameIndex].slice(0, prevThrowIndex);
    }

    // Clear frame throw
    const game = this.games()[gameIndex];
    const frames = cloneFrames(game.frames);
    const frame = frames[prevFrameIndex];
    if (frame.throws.length > prevThrowIndex) {
      frame.throws = frame.throws.slice(0, prevThrowIndex);
    }

    // Update state
    this.pinModeState.update((states) => {
      const newStates = [...states];
      newStates[gameIndex] = {
        currentFrameIndex: prevFrameIndex,
        currentThrowIndex: prevThrowIndex,
        throwsData: newThrowsData,
      };
      return newStates;
    });

    // Update game state
    this.updateGameState(frames, gameIndex, false);
  }

  private calculateSplit(frameIndex: number, throwIndex: number, pinsLeftStanding: number[], throwsData: Throw[][]): boolean {
    // Only first throw of a frame can result in a split (in normal frames)
    if (frameIndex < 9) {
      if (throwIndex === 0) {
        return this.validationService.isSplit(pinsLeftStanding);
      }
      return false;
    }

    // 10th frame special logic
    if (frameIndex === 9) {
      if (throwIndex === 0) {
        return this.validationService.isSplit(pinsLeftStanding);
      }

      // Second throw after strike - pins reset, can have split
      const firstThrowData = throwsData[9]?.[0];
      if (throwIndex === 1 && firstThrowData?.value === 10) {
        return this.validationService.isSplit(pinsLeftStanding);
      }

      // Third throw after two strikes or spare - pins reset, can have split
      if (throwIndex === 2) {
        const secondThrowData = throwsData[9]?.[1];
        if (firstThrowData?.value === 10 && secondThrowData?.value === 10) {
          return this.validationService.isSplit(pinsLeftStanding);
        }
        if (firstThrowData && secondThrowData && firstThrowData.value !== 10 && firstThrowData.value + secondThrowData.value === 10) {
          return this.validationService.isSplit(pinsLeftStanding);
        }
      }
    }

    return false;
  }

  private calculateNextPosition(
    frameIndex: number,
    throwIndex: number,
    pinsKnockedDown: number,
    frames: Frame[],
  ): { nextFrameIndex: number; nextThrowIndex: number } {
    if (frameIndex < 9) {
      // Frames 1-9: Strike advances to next frame, otherwise second throw
      if (throwIndex === 0) {
        if (pinsKnockedDown === 10) {
          return { nextFrameIndex: frameIndex + 1, nextThrowIndex: 0 };
        }
        return { nextFrameIndex: frameIndex, nextThrowIndex: 1 };
      }
      // After second throw, move to next frame
      return { nextFrameIndex: frameIndex + 1, nextThrowIndex: 0 };
    }

    // 10th frame logic
    const frame = frames[9];
    const firstThrow = getThrowValue(frame, 0);
    const secondThrow = getThrowValue(frame, 1);

    if (throwIndex === 0) {
      return { nextFrameIndex: 9, nextThrowIndex: 1 };
    }

    if (throwIndex === 1) {
      // Check if third throw is earned
      if (firstThrow === 10 || (firstThrow !== undefined && secondThrow !== undefined && firstThrow + secondThrow === 10)) {
        return { nextFrameIndex: 9, nextThrowIndex: 2 };
      }
      // No third throw - game complete, stay at position
      return { nextFrameIndex: 9, nextThrowIndex: 1 };
    }

    // After third throw, stay at position (game complete)
    return { nextFrameIndex: 9, nextThrowIndex: 2 };
  }

  private calculatePreviousPosition(
    frameIndex: number,
    throwIndex: number,
    throwsData: Throw[][],
  ): { prevFrameIndex: number; prevThrowIndex: number } {
    if (throwIndex > 0) {
      return { prevFrameIndex: frameIndex, prevThrowIndex: throwIndex - 1 };
    }

    if (frameIndex === 0) {
      return { prevFrameIndex: -1, prevThrowIndex: -1 }; // Nothing to undo
    }

    // Find last throw in previous frame
    const prevFrameData = throwsData[frameIndex - 1];
    const prevThrowIndex = prevFrameData ? prevFrameData.length - 1 : 0;

    return { prevFrameIndex: frameIndex - 1, prevThrowIndex: Math.max(0, prevThrowIndex) };
  }

  // GAME STATE UPDATE HANDLERS
  onGameChange(game: Game, index = 0, isModal = false): void {
    if (isModal) {
      this.gameData = { ...game };
    } else {
      this.games.update((games) => games.map((g, i) => (i === index ? { ...game } : g)));
    }
  }

  updateSingleGameProperty(key: keyof Game, value: unknown, index: number, isModal: boolean): void {
    if (isModal) {
      this.gameData = { ...this.gameData, [key]: value };
    } else {
      this.games.update((games) => games.map((g, i) => (i === index ? { ...g, [key]: value } : g)));
    }
  }

  updateSeriesProperty(key: keyof Game, value: unknown, isModal: boolean): void {
    if (isModal) {
      this.gameData = { ...this.gameData, [key]: value };

      if (key === 'league') {
        const isPractice = value === '' || value === 'New';
        this.gameData.isPractice = isPractice;
        if (this.modalGrid?.checkbox) {
          this.modalGrid.checkbox.checked = isPractice;
          this.modalGrid.checkbox.disabled = !isPractice;
        }
      }
    } else {
      const trackIndexes = this.getActiveTrackIndexes();

      this.games.update((games) =>
        games.map((g, i) => {
          if (trackIndexes.includes(i)) {
            const updates: Partial<Game> = { [key]: value };

            if (key === 'league') {
              updates.isPractice = value === '' || value === 'New';
            }
            if (key === 'patterns' && Array.isArray(value) && value.length > 2) {
              updates.patterns = value.slice(-2);
            }
            return { ...g, ...updates };
          }
          return g;
        }),
      );

      if (key === 'league') {
        const isPractice = value === '' || value === 'New';
        this.gameGrids.forEach((grid, i) => {
          if (trackIndexes.includes(i)) {
            grid.leagueSelector.selectedLeague = value as string;
            grid.checkbox.checked = isPractice;
            grid.checkbox.disabled = !isPractice;
          }
        });
      }
    }
  }

  // Wrapper methods for Template Binding
  onNoteChange(note: string, index = 0, isModal = false) {
    this.updateSingleGameProperty('note', note, index, isModal);
  }
  onBallsChange(balls: string[], index = 0, isModal = false) {
    this.updateSingleGameProperty('balls', balls, index, isModal);
  }
  onIsPracticeChange(isPractice: boolean, index = 0, isModal = false) {
    this.updateSingleGameProperty('isPractice', isPractice, index, isModal);
  }
  onLeagueChange(league: string, isModal = false) {
    this.updateSeriesProperty('league', league, isModal);
  }
  onPatternChange(patterns: string[], isModal = false) {
    this.updateSeriesProperty('patterns', patterns, isModal);
  }

  // GRID MODE INPUT & SCORING LOGIC
  handleThrowInput(event: { frameIndex: number; throwIndex: number; value: string }, index: number, isModal = false): void {
    const { frameIndex, throwIndex, value } = event;
    const currentGame = isModal ? this.gameData : this.games()[index];
    const frames = cloneFrames(currentGame.frames);

    if (value.length === 0) {
      this.removeThrow(frames, frameIndex, throwIndex);
      this.updateGameState(frames, index, isModal);
      return;
    }

    const parsedValue = this.validationService.parseInputValue(value, frameIndex, throwIndex, frames);
    const isValidNumber = this.validationService.isValidNumber0to10(parsedValue);
    const isValidScore = this.validationService.isValidFrameScore(parsedValue, frameIndex, throwIndex, frames);

    if (!isValidNumber || !isValidScore) {
      this.handleInvalidInputUI(index, frameIndex, throwIndex, isModal);
      return;
    }

    this.recordThrow(frames, frameIndex, throwIndex, parsedValue);
    this.updateGameState(frames, index, isModal);
    this.focusNextInputUI(index, frameIndex, throwIndex, isModal);
  }

  updateFrameScore(event: InputCustomEvent, index: number): void {
    this.gameData.frameScores[index] = parseInt(event.detail.value!, 10);
  }

  // UI INTERACTION
  togglePinInputMode(): void {
    this.isPinInputMode = !this.isPinInputMode;
    localStorage.setItem('pinInputMode', String(this.isPinInputMode));
  }

  onInputFocused(event: { frameIndex: number; throwIndex: number }, index: number): void {
    this.activeGameIndex = index;
    this.currentFocusedFrame = event.frameIndex;
    this.currentFocusedThrow = event.throwIndex;
    this.updateToolbarDisabledState(index);
  }

  onToolbarStateChange(state: { show: boolean; offset: number }): void {
    this.showScoreToolbar = state.show;
    this.toolbarOffset = state.offset;
  }

  onToolbarButtonClick(char: string): void {
    const activeGrid = this.gameGrids.toArray().find((_, i) => i === this.activeGameIndex);
    if (activeGrid) {
      activeGrid.selectSpecialScore(char);
    }
  }

  async presentActionSheet(): Promise<void> {
    const buttons: { text: string; handler?: () => void; role?: string }[] = [];
    this.hapticService.vibrate(ImpactStyle.Medium);
    this.sheetOpen = true;

    const modes = [SeriesMode.Single, SeriesMode.Series3, SeriesMode.Series4, SeriesMode.Series5, SeriesMode.Series6];

    modes.forEach((mode) => {
      if (mode !== this.selectedMode) {
        buttons.push({
          text: mode,
          handler: () => {
            this.selectedMode = mode;
            this.propagateMetadataToSeries();
          },
        });
      }
    });

    buttons.push({ text: 'Cancel', role: 'cancel' });

    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Choose series mode',
      buttons,
    });

    actionSheet.onWillDismiss().then(() => {
      this.sheetOpen = false;
      this.updateSegments();
    });
    await actionSheet.present();
  }

  async presentWarningAlert() {
    localStorage.removeItem('alert');
    const alert = await this.alertController.create({
      header: 'Warning!',
      subHeader: 'Experimental Feature',
      message: 'It only works in certain alleys and will probably NOT work in yours!',
      buttons: [
        { text: 'Dismiss', role: 'cancel' },
        { text: 'OK', role: 'confirm' },
      ],
    });
    await alert.present();
    alert.onDidDismiss().then((data) => {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7);
      const alertData = { value: 'true', expiration: expirationDate.getTime() };
      localStorage.setItem('alert', JSON.stringify(alertData));
      if (data.role === 'confirm') {
        this.handleImageUpload();
      }
    });
  }

  // SAVE & RESET LOGIC
  clearFrames(index?: number): void {
    if (index !== undefined && index >= 0) {
      this.games.update((games) => games.map((g, i) => (i === index ? createEmptyGame() : g)));
      // Reset pin mode state for this game
      this.pinModeState.update((states) => {
        const newStates = [...states];
        newStates[index] = {
          currentFrameIndex: 0,
          currentThrowIndex: 0,
          throwsData: Array.from({ length: 10 }, () => []),
        };
        return newStates;
      });
    } else {
      this.initializeGames();
      // Reset all pin mode states
      this.pinModeState.set(
        Array.from({ length: 19 }, () => ({
          currentFrameIndex: 0,
          currentThrowIndex: 0,
          throwsData: Array.from({ length: 10 }, () => []),
        })),
      );
    }
    this.toastService.showToast(ToastMessages.gameResetSuccess, 'refresh-outline');
  }

  async confirm(modal: IonModal): Promise<void> {
    const success = await this.processAndSaveGames([this.gameData]);
    if (success) modal.dismiss();
  }

  async calculateScore(): Promise<void> {
    const activeIndexes = this.getActiveTrackIndexes();
    const gamesToSave = activeIndexes.map((idx) => this.games()[idx]);
    const isSeries = this.selectedMode !== SeriesMode.Single;

    if (isSeries) {
      this.seriesId = this.generateUniqueSeriesId();
    }

    const success = await this.processAndSaveGames(gamesToSave, isSeries, this.seriesId);
    if (success) {
      const perfectGame = gamesToSave.some((g) => g.totalScore === 300);
      if (perfectGame) {
        this.is300 = true;
        setTimeout(() => (this.is300 = false), 4000);
      }
      this.initializeGames();
      // Reset pin mode states
      this.pinModeState.set(
        Array.from({ length: 19 }, () => ({
          currentFrameIndex: 0,
          currentThrowIndex: 0,
          throwsData: Array.from({ length: 10 }, () => []),
        })),
      );
    }
  }

  private async processAndSaveGames(games: Game[], isSeries = false, seriesId = ''): Promise<boolean> {
    if (!games.every((g) => this.isGameValid(g))) {
      this.hapticService.vibrate(ImpactStyle.Heavy);
      this.isAlertOpen = true;
      return false;
    }

    try {
      const savePromises = games.map((game) =>
        this.saveGame(
          game.frames,
          game.frameScores,
          game.totalScore,
          game.isPractice,
          game.league || '',
          isSeries,
          seriesId,
          game.note || '',
          game.patterns || [],
          game.balls || [],
          this.isPinInputMode,
          game.gameId,
          game.date,
        ),
      );

      const savedGames = (await Promise.all(savePromises)).filter((g): g is Game => g !== null);

      if (savedGames.length > 0) {
        const allGames = this.storageService.games();
        if (savedGames.length === 1) {
          await this.highScroreAlertService.checkAndDisplayHighScoreAlerts(savedGames[0], allGames);
        } else {
          await this.highScroreAlertService.checkAndDisplayHighScoreAlertsForMultipleGames(savedGames, allGames);
        }
        this.hapticService.vibrate(ImpactStyle.Medium);
        this.toastService.showToast(ToastMessages.gameSaveSuccess, 'add');
        return true;
      }
    } catch (error) {
      console.error(error);
      this.toastService.showToast(ToastMessages.gameSaveError, 'bug', true);
      await this.analyticsService.trackError('game_save_error', error instanceof Error ? error.message : String(error));
    }
    return false;
  }

  // PRIVATE HELPERS - GAME STATE
  private loadPinInputMode(): void {
    this.isPinInputMode = localStorage.getItem('pinInputMode') === 'true';
  }

  private updateGameState(frames: Frame[], index: number, isModal: boolean): void {
    const scoreResult = this.gameScoreCalculatorService.calculateScoreFromFrames(frames);
    const maxScore = this.gameScoreCalculatorService.calculateMaxScoreFromFrames(frames, scoreResult.totalScore);
    const updatedGameData = { frames, frameScores: scoreResult.frameScores, totalScore: scoreResult.totalScore };

    if (isModal) {
      this.gameData = { ...this.gameData, ...updatedGameData };
    } else {
      this.games.update((games) => games.map((g, i) => (i === index ? { ...g, ...updatedGameData } : g)));
      this.totalScores.update((scores) => {
        const s = [...scores];
        s[index] = scoreResult.totalScore;
        return s;
      });
      this.maxScores.update((scores) => {
        const s = [...scores];
        s[index] = maxScore;
        return s;
      });
    }
  }

  private initializeGames(): void {
    this.games.set(Array.from({ length: 19 }, () => createEmptyGame()));
  }

  private getActiveTrackIndexes(): number[] {
    const countMatch = this.selectedMode.match(/\d+/);
    const count = countMatch ? parseInt(countMatch[0], 10) : 1;
    return Array.from({ length: count }, (_, i) => i);
  }

  private propagateMetadataToSeries(): void {
    const activeIndexes = this.getActiveTrackIndexes();
    const sourceGame = this.games()[0];

    this.games.update((games) =>
      games.map((g, i) => {
        if (activeIndexes.includes(i) && i !== 0) {
          return {
            ...g,
            league: sourceGame.league,
            isPractice: sourceGame.isPractice,
            patterns: [...sourceGame.patterns],
          };
        }
        return g;
      }),
    );

    setTimeout(() => {
      this.gameGrids.forEach((grid, i) => {
        if (activeIndexes.includes(i) && i !== 0) {
          if (grid.leagueSelector) {
            grid.leagueSelector.selectedLeague = sourceGame.league || '';
          }
          if (grid.checkbox) {
            grid.checkbox.checked = sourceGame.isPractice;
            grid.checkbox.disabled = !sourceGame.isPractice;
          }
        }
      });
    }, 50);
  }

  private updateSegments(): void {
    const activeIndexes = this.getActiveTrackIndexes();
    this.segments = activeIndexes.map((i) => `Game ${i + 1}`);
  }

  // PRIVATE HELPERS - VALIDATION
  isGameValid(game: Game): boolean {
    return this.validationService.isGameValid(game);
  }

  canRecordStrike(index: number): boolean {
    if (this.currentFocusedFrame === null || this.currentFocusedThrow === null) return false;
    return this.validationService.canRecordStrike(this.currentFocusedFrame, this.currentFocusedThrow, this.games()[index].frames);
  }

  canRecordSpare(index: number): boolean {
    if (this.currentFocusedFrame === null || this.currentFocusedThrow === null) return false;
    return this.validationService.canRecordSpare(this.currentFocusedFrame, this.currentFocusedThrow, this.games()[index].frames);
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

  private async saveGame(
    frames: Frame[],
    frameScores: number[],
    totalScore: number,
    isPractice: boolean,
    league: string,
    isSeries: boolean,
    seriesId: string,
    note: string,
    patterns: string[],
    balls: string[],
    isPinMode: boolean,
    gameId?: string,
    date?: number,
  ): Promise<Game | null> {
    if (league === 'New') {
      this.toastService.showToast(ToastMessages.selectLeague, 'bug', true);
      return null;
    }
    try {
      const gameData = this.transformGameService.transformGameData(
        frames,
        frameScores,
        totalScore,
        isPractice,
        league,
        isSeries,
        seriesId,
        note,
        patterns,
        balls,
        gameId,
        date,
        isPinMode,
      );
      await this.storageService.saveGameToLocalStorage(gameData);
      this.analyticsService.trackGameSaved({ score: gameData.totalScore });
      return gameData;
    } catch (error) {
      console.error('Error saving game:', error);
      throw error;
    }
  }

  private generateUniqueSeriesId(): string {
    return 'series-' + Math.random().toString(36).substring(2, 15);
  }

  private handleInvalidInputUI(index: number, frameIndex: number, throwIndex: number, isModal: boolean): void {
    this.hapticService.vibrate(ImpactStyle.Heavy);
    const grid = isModal ? this.modalGrid : this.gameGrids.toArray()[index];
    if (grid) grid.handleInvalidInput(frameIndex, throwIndex);
  }

  private focusNextInputUI(index: number, frameIndex: number, throwIndex: number, isModal: boolean): void {
    const grid = isModal ? this.modalGrid : this.gameGrids.toArray()[index];
    if (grid) grid.focusNextInput(frameIndex, throwIndex);
  }

  private updateToolbarDisabledState(index: number): void {
    this.toolbarDisabledState = {
      strikeDisabled: !this.canRecordStrike(index),
      spareDisabled: !this.canRecordSpare(index),
    };
  }

  // CAMERA / OCR LOGIC
  async handleImageUpload(): Promise<void> {
    const alertData = localStorage.getItem('alert');
    if (!alertData) {
      await this.presentWarningAlert();
      return;
    }

    const { value, expiration } = JSON.parse(alertData);
    if (value !== 'true' || new Date().getTime() >= expiration) {
      await this.presentWarningAlert();
      return;
    }

    try {
      const imageUrl: File | Blob | undefined = await this.takeOrChoosePicture();
      if (imageUrl instanceof File) {
        this.loadingService.setLoading(true);
        const gameText = await this.imageProcessingService.performOCR(imageUrl);
        this.parseBowlingScores(gameText!);
        await this.analyticsService.trackOCRUsed(!!gameText);
      } else {
        this.toastService.showToast(ToastMessages.noImage, 'bug', true);
      }
    } catch (error) {
      this.toastService.showToast(ToastMessages.imageUploadError, 'bug', true);
      console.error(error);
      await this.analyticsService.trackError('ocr_error', error instanceof Error ? error.message : String(error));
    } finally {
      this.loadingService.setLoading(false);
    }
  }

  private async takeOrChoosePicture(): Promise<File | Blob | undefined> {
    if ((isPlatform('android') || isPlatform('ios')) && !isPlatform('mobileweb')) {
      const permissionRequestResult = await Camera.checkPermissions();
      if (permissionRequestResult.photos === 'prompt' || permissionRequestResult.photos === 'denied') {
        const permissions = await Camera.requestPermissions();
        if (!permissions.photos) {
          await this.showPermissionDeniedAlert();
          return undefined;
        }
      }
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Prompt,
      });
      return await fetch(image.webPath!).then((r) => r.blob());
    } else {
      return await this.openFileInput();
    }
  }

  private async openFileInput(): Promise<File | undefined> {
    return new Promise((resolve) => {
      try {
        const fileInput = document.getElementById('upload') as HTMLInputElement;
        fileInput.value = '';
        fileInput.onchange = () => resolve(fileInput.files?.[0]);
        fileInput.click();
      } catch (error) {
        console.error('Upload Error:', error);
        this.toastService.showToast(ToastMessages.unexpectedError, 'bug', true);
        resolve(undefined);
      }
    });
  }

  private async showPermissionDeniedAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Permission Denied',
      message: 'To take or choose a picture, you need to grant camera access.',
      buttons: [
        {
          text: 'OK',
          handler: async () => {
            const res = await Camera.requestPermissions();
            if (res.photos === 'granted') this.takeOrChoosePicture();
          },
        },
      ],
    });
    await alert.present();
  }

  private parseBowlingScores(input: string): void {
    try {
      const { frames, frameScores, totalScore } = this.gameUtilsService.parseBowlingScores(input, this.userService.username());
      const framesAsFrameArray = numberArraysToFrames(frames);
      this.gameData = this.transformGameService.transformGameData(framesAsFrameArray, frameScores, totalScore, false, '', false, '', '', [], []);
      this.gameData.isPractice = true;
      this.isModalOpen = true;
    } catch (error) {
      this.toastService.showToast(ToastMessages.unexpectedError, 'bug', true);
      console.error(error);
    }
  }
}
