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
} from '@ionic/angular/standalone';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Game, Frame, createEmptyGame, numberArraysToFrames, cloneFrames, createThrow } from 'src/app/core/models/game.model';
import { addIcons } from 'ionicons';
import { add, chevronDown, chevronUp, cameraOutline, documentTextOutline, medalOutline } from 'ionicons/icons';
import { NgIf, NgFor } from '@angular/common';
import { ImpactStyle } from '@capacitor/haptics';
import { AdService } from 'src/app/core/services/ad/ad.service';
import { HapticService } from 'src/app/core/services/haptic/haptic.service';
import { ImageProcesserService } from 'src/app/core/services/image-processer/image-processer.service';
import { LoadingService } from 'src/app/core/services/loader/loading.service';
import { ToastService } from 'src/app/core/services/toast/toast.service';
import { UserService } from 'src/app/core/services/user/user.service';
import { defineCustomElements } from '@teamhive/lottie-player/loader';
import { Device } from '@capacitor/device';
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
    NgIf,
    NgFor,
    GameGridComponent,
    GameScoreToolbarComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AddGamePage implements OnInit {
  seriesMode: boolean[] = [true, false, false, false, false];
  seriesId = '';
  selectedMode: SeriesMode = SeriesMode.Single;
  trackIndexes: number[][] = [[0], [0, 1, 2], [0, 1, 2, 3], [0, 1, 2, 3, 4], [0, 1, 2, 3, 4, 5]];
  sheetOpen = false;
  isAlertOpen = false;
  isModalOpen = false;
  is300 = false;
  gameData!: Game;
  deviceId = '';
  games = signal(Array.from({ length: 19 }, () => createEmptyGame()));
  totalScores = signal(new Array(19).fill(0));
  maxScores = signal(new Array(19).fill(300));
  seriesMaxscore = computed(() => {
    const activeModeIndex = this.seriesMode.findIndex((mode) => mode);
    const trackIndexes = this.trackIndexes[activeModeIndex] || [0];
    return trackIndexes.reduce((acc, idx) => acc + this.maxScores()[idx], 0);
  });

  seriesCurrentScore = computed(() => {
    const activeModeIndex = this.seriesMode.findIndex((mode) => mode);
    const trackIndexes = this.trackIndexes[activeModeIndex] || [0];
    return trackIndexes.reduce((acc, idx) => acc + this.totalScores()[idx], 0);
  });

  showScoreToolbar = false;
  toolbarOffset = 0;
  toolbarDisabledState = { strikeDisabled: true, spareDisabled: true };
  activeGameGrid: GameGridComponent | null = null;
  private activeGameIndex = 0;
  private currentFocusedFrame: number | null = null;
  private currentFocusedThrow: number | null = null;

  @ViewChildren(GameGridComponent) gameGrids!: QueryList<GameGridComponent>;
  @ViewChild('modalGrid', { static: false }) modalGrid!: GameGridComponent;
  selectedSegment = 'Game 1';
  segments: string[] = ['Game 1'];
  presentingElement!: HTMLElement;
  private allowedDeviceIds = [
    '820fabe8-d29b-45c2-89b3-6bcc0e149f2b',
    '21330a3a-9cff-41ce-981a-00208c21d883',
    'b376db84-c3a4-4c65-8c59-9710b7d05791',
    '01c1e0d1-3469-4091-96a0-76beb68a6f97',
  ];

  constructor(
    private actionSheetCtrl: ActionSheetController,
    private imageProcessingService: ImageProcesserService,
    private alertController: AlertController,
    private toastService: ToastService,
    private gameScoreCalculatorService: GameScoreCalculatorService,
    private transformGameService: GameDataTransformerService,
    private loadingService: LoadingService,
    private userService: UserService,
    private adService: AdService,
    private hapticService: HapticService,
    private gameUtilsService: GameUtilsService,
    private validationService: BowlingGameValidationService,
    private highScroreAlertService: HighScoreAlertService,
    private storageService: StorageService,
    private analyticsService: AnalyticsService,
  ) {
    addIcons({ cameraOutline, chevronDown, chevronUp, medalOutline, documentTextOutline, add });
  }

  async ngOnInit(): Promise<void> {
    this.deviceId = (await Device.getId()).identifier;
    this.presentingElement = document.querySelector('.ion-page')!;
  }

  onGameChange(game: Game, index = 0, isModal = false): void {
    if (isModal) {
      this.gameData = { ...game };
    } else {
      this.games.update((games) => games.map((g, i) => (i === index ? { ...game } : g)));
    }
  }

  onNoteChange(note: string, index = 0, isModal = false): void {
    if (isModal) {
      this.gameData = { ...this.gameData, note };
    } else {
      this.games.update((games) => games.map((g, i) => (i === index ? { ...g, note } : g)));
    }
  }

  onBallsChange(balls: string[], index = 0, isModal = false): void {
    if (isModal) {
      this.gameData = { ...this.gameData, balls };
    } else {
      this.games.update((games) => games.map((g, i) => (i === index ? { ...g, balls } : g)));
    }
  }

  onLeagueChange(league: string, isModal = false): void {
    const isPractice = league === '' || league === 'New';

    if (isModal) {
      this.gameData.league = league;
      this.gameData.isPractice = isPractice;
      this.modalGrid.checkbox.checked = isPractice;
      this.modalGrid.checkbox.disabled = !isPractice;
    } else {
      const activeModeIndex = this.seriesMode.findIndex((mode) => mode);
      const trackIndexes = this.trackIndexes[activeModeIndex] || [0];

      trackIndexes.forEach((trackIndex) => {
        this.games.update((games) => games.map((g, i) => (i === trackIndex ? { ...g, league, isPractice } : g)));
      });

      this.gameGrids.forEach((trackGrid: GameGridComponent) => {
        trackGrid.leagueSelector.selectedLeague = league;
        trackGrid.checkbox.checked = isPractice;
        trackGrid.checkbox.disabled = !isPractice;
      });
    }
  }

  onIsPracticeChange(isPractice: boolean, isModal = false): void {
    if (isModal) {
      this.gameData = { ...this.gameData, isPractice };
    } else {
      const activeModeIndex = this.seriesMode.findIndex((mode) => mode);
      const trackIndexes = this.trackIndexes[activeModeIndex] || [0];

      trackIndexes.forEach((trackIndex) => {
        this.games.update((games) => games.map((g, i) => (i === trackIndex ? { ...g, isPractice } : g)));
      });
    }
  }

  onPatternChange(patterns: string[], isModal = false): void {
    if (patterns.length > 2) {
      patterns = patterns.slice(-2);
    }

    if (isModal) {
      this.gameData = { ...this.gameData, patterns };
    } else {
      const activeModeIndex = this.seriesMode.findIndex((mode) => mode);
      const trackIndexes = this.trackIndexes[activeModeIndex] || [0];

      trackIndexes.forEach((trackIndex) => {
        this.games.update((games) => games.map((g, i) => (i === trackIndex ? { ...g, patterns: [...patterns] } : g)));
      });
    }
  }

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

  onInputFocused(event: { frameIndex: number; throwIndex: number }, index: number): void {
    this.activeGameIndex = index;
    this.currentFocusedFrame = event.frameIndex;
    this.currentFocusedThrow = event.throwIndex;
    this.updateToolbarDisabledState(index);
  }

  canRecordStrike(index: number): boolean {
    if (this.currentFocusedFrame === null || this.currentFocusedThrow === null) return false;
    return this.validationService.canRecordStrike(this.currentFocusedFrame, this.currentFocusedThrow, this.games()[index].frames);
  }

  canRecordSpare(index: number): boolean {
    if (this.currentFocusedFrame === null || this.currentFocusedThrow === null) return false;
    return this.validationService.canRecordSpare(this.currentFocusedFrame, this.currentFocusedThrow, this.games()[index].frames);
  }

  async handleImageUpload(): Promise<void> {
    const alertData = localStorage.getItem('alert');
    if (alertData) {
      const { value, expiration } = JSON.parse(alertData);
      if (value === 'true' && new Date().getTime() < expiration) {
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
      } else {
        await this.presentWarningAlert();
      }
    } else {
      await this.presentWarningAlert();
    }
  }

  async confirm(modal: IonModal): Promise<void> {
    try {
      if (!this.isGameValid(this.gameData)) {
        this.hapticService.vibrate(ImpactStyle.Heavy);
        this.toastService.showToast(ToastMessages.invalidInput, 'bug', true);
        return;
      }

      const savedGame = await this.saveGame(
        this.gameData.frames,
        this.gameData.frameScores,
        this.gameData.totalScore,
        this.gameData.isPractice,
        this.gameData.league || '',
        false,
        '',
        this.gameData.note || '',
        this.gameData.patterns || [],
        this.gameData.balls || [],
        this.gameData.gameId,
        this.gameData.date,
      );

      if (savedGame) {
        const allGames = this.storageService.games();
        await this.highScroreAlertService.checkAndDisplayHighScoreAlerts(savedGame, allGames);

        await this.analyticsService.trackGameSaved({
          score: savedGame.totalScore,
        });
      }

      this.toastService.showToast(ToastMessages.gameSaveSuccess, 'add');
      modal.dismiss();
    } catch (error) {
      this.toastService.showToast(ToastMessages.gameSaveError, 'bug', true);
      console.error(error);
      await this.analyticsService.trackError('game_save_confirm_error', error instanceof Error ? error.message : String(error));
    }
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

  isGameValid(game: Game): boolean {
    return this.validationService.isGameValid(game);
  }

  updateFrameScore(event: InputCustomEvent, index: number): void {
    this.gameData.frameScores[index] = parseInt(event.detail.value!, 10);
  }

  clearFrames(index?: number): void {
    if (index !== undefined && index >= 0) {
      this.games.update((games) => games.map((g, i) => (i === index ? createEmptyGame() : g)));
    } else {
      this.initializeGames();
    }
    this.toastService.showToast(ToastMessages.gameResetSuccess, 'refresh-outline');
  }

  async calculateScore(): Promise<void> {
    const isSeries = this.seriesMode.some((mode, i) => mode && i !== 0);
    if (isSeries) {
      this.seriesId = this.generateUniqueSeriesId();
    }

    const activeModeIndex = this.seriesMode.findIndex((mode) => mode);
    const trackIndexes = this.trackIndexes[activeModeIndex] || [0];
    const gamesToSave = trackIndexes.map((idx) => this.games()[idx]);

    if (!gamesToSave.every((game) => this.isGameValid(game))) {
      this.hapticService.vibrate(ImpactStyle.Heavy);
      this.isAlertOpen = true;
      return;
    }

    try {
      const perfectGame = gamesToSave.some((game) => game.totalScore === 300);

      const savePromises = gamesToSave.map((game) => {
        return this.saveGame(
          game.frames,
          game.frameScores,
          game.totalScore,
          game.isPractice,
          game.league || '',
          isSeries,
          this.seriesId,
          game.note || '',
          game.patterns || [],
          game.balls || [],
        );
      });
      const savedGames = await Promise.all(savePromises);

      const validSavedGames = savedGames.filter((game: Game | null): game is Game => game !== null);

      if (validSavedGames.length > 0) {
        const allGames = this.storageService.games();
        await this.highScroreAlertService.checkAndDisplayHighScoreAlertsForMultipleGames(validSavedGames, allGames);
      }

      if (perfectGame) {
        this.is300 = true;
        setTimeout(() => (this.is300 = false), 4000);
      }

      this.initializeGames();

      this.hapticService.vibrate(ImpactStyle.Medium);
      this.toastService.showToast(ToastMessages.gameSaveSuccess, 'add');
    } catch (error) {
      console.error(error);
      this.toastService.showToast(ToastMessages.gameSaveError, 'bug', true);
    }
  }

  async presentActionSheet(): Promise<void> {
    // TODO this method needs to update all series games pattern, league and isPractice
    const buttons = [];
    this.hapticService.vibrate(ImpactStyle.Medium);
    this.sheetOpen = true;

    const modes = [SeriesMode.Single, SeriesMode.Series3, SeriesMode.Series4, SeriesMode.Series5, SeriesMode.Series6];

    modes.forEach((mode, index) => {
      if (!this.seriesMode[index]) {
        buttons.push({
          text: mode,
          handler: () => {
            this.seriesMode = this.seriesMode.map((_, i) => i === index);
            this.selectedMode = mode;
          },
        });
      }
    });

    buttons.push({
      text: 'Cancel',
      role: 'cancel',
    });

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
        {
          text: 'Dismiss',
          role: 'cancel',
        },
        {
          text: 'OK',
          role: 'confirm',
        },
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

  private updateGameState(frames: Frame[], index: number, isModal: boolean): void {
    const scoreResult = this.gameScoreCalculatorService.calculateScoreFromFrames(frames);
    const maxScore = this.gameScoreCalculatorService.calculateMaxScoreFromFrames(frames, scoreResult.totalScore);

    const updatedGameData = {
      frames,
      frameScores: scoreResult.frameScores,
      totalScore: scoreResult.totalScore,
    };

    if (isModal) {
      this.gameData = { ...this.gameData, ...updatedGameData };
    } else {
      this.games.update((games) => games.map((g, i) => (i === index ? { ...g, ...updatedGameData } : g)));
      this.totalScores.update((scores) => {
        const newScores = [...scores];
        newScores[index] = scoreResult.totalScore;
        return newScores;
      });
      this.maxScores.update((scores) => {
        const newScores = [...scores];
        newScores[index] = maxScore;
        return newScores;
      });
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

  private parseBowlingScores(input: string): void {
    try {
      const { frames, frameScores, totalScore } = this.gameUtilsService.parseBowlingScores(input, this.userService.username());
      const framesAsFrameArray = numberArraysToFrames(frames);
      this.gameData = this.transformGameService.transformGameData(framesAsFrameArray, frameScores, totalScore, false, '', false, '', '', [], []);
      this.gameData.isPractice = true;
      if (this.gameData.frames.length === 10 && this.gameData.frameScores.length === 10 && this.gameData.totalScore <= 300) {
        this.isModalOpen = true;
      } else {
        this.isModalOpen = true;
      }
    } catch (error) {
      this.toastService.showToast(ToastMessages.unexpectedError, 'bug', true);
      console.error(error);
    }
  }

  private initializeGames(): void {
    this.games.set(Array.from({ length: 19 }, () => createEmptyGame()));
  }

  private handleInvalidInputUI(index: number, frameIndex: number, throwIndex: number, isModal: boolean): void {
    this.hapticService.vibrate(ImpactStyle.Heavy);
    const grid = isModal ? this.modalGrid : this.gameGrids.toArray()[index];
    if (grid) {
      grid.handleInvalidInput(frameIndex, throwIndex);
    }
  }

  private focusNextInputUI(index: number, frameIndex: number, throwIndex: number, isModal: boolean): void {
    const grid = isModal ? this.modalGrid : this.gameGrids.toArray()[index];
    if (grid) {
      grid.focusNextInput(frameIndex, throwIndex);
    }
  }

  private updateToolbarDisabledState(index: number): void {
    this.toolbarDisabledState = {
      strikeDisabled: !this.canRecordStrike(index),
      spareDisabled: !this.canRecordSpare(index),
    };
  }

  private updateSegments(): void {
    let numberOfGames = 1;

    if (this.selectedMode !== SeriesMode.Single) {
      const match = this.selectedMode.match(/\d+/);
      if (match) {
        numberOfGames = parseInt(match[0], 10);
      }

      this.segments = Array.from({ length: numberOfGames }, (_, i) => `Game ${i + 1}`);
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
    gameId?: string,
    date?: number,
  ): Promise<Game | null> {
    try {
      if (league === 'New') {
        this.toastService.showToast(ToastMessages.selectLeague, 'bug', true);
        return null;
      }
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
      );
      await this.storageService.saveGameToLocalStorage(gameData);
      this.analyticsService.trackGameSaved({ score: gameData.totalScore });
      return gameData;
    } catch (error) {
      console.error('Error saving game to local storage:', error);
      this.analyticsService.trackError('game_save_error', error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  private generateUniqueSeriesId(): string {
    return 'series-' + Math.random().toString(36).substring(2, 15);
  }

  private async takeOrChoosePicture(): Promise<File | Blob | undefined> {
    if ((isPlatform('android') || isPlatform('ios')) && !isPlatform('mobileweb')) {
      const permissionRequestResult = await Camera.checkPermissions();

      if (permissionRequestResult.photos === 'prompt') {
        const permissions = await Camera.requestPermissions();
        if (permissions.photos) {
          await this.handleImageUpload();
        } else {
          await this.showPermissionDeniedAlert();
        }
      } else if (permissionRequestResult.photos === 'denied') {
        await this.showPermissionDeniedAlert();
      } else {
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Uri,
          source: CameraSource.Prompt,
        });

        const blob = await fetch(image.webPath!).then((r) => r.blob());

        return blob;
      }
    } else {
      const file = await this.openFileInput();
      if (file) {
        return file;
      }
    }

    return;
  }

  private async openFileInput(): Promise<File | undefined> {
    return new Promise((resolve) => {
      try {
        const fileInput = document.getElementById('upload') as HTMLInputElement;
        fileInput.value = '';

        fileInput.addEventListener('change', () => {
          const selectedFile = fileInput.files?.[0];
          resolve(selectedFile);
        });

        fileInput.click();
      } catch (error) {
        console.error('Fehler beim Öffnen des Datei-Uploads:', error);
        this.toastService.showToast(ToastMessages.unexpectedError, 'bug', true);
        resolve(undefined);
      }
    });
  }

  private async showPermissionDeniedAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Permission Denied',
      message: 'To take or choose a picture, you need to grant camera access permission. Please enable camera access in your device settings.',
      buttons: [
        {
          text: 'OK',
          handler: async () => {
            const permissionRequestResult = await Camera.requestPermissions();
            if (permissionRequestResult.photos === 'granted') {
              this.takeOrChoosePicture();
            }
          },
        },
      ],
    });
    await alert.present();
  }
}
