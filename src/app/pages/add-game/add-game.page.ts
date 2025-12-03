import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
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
  IonCheckbox,
} from '@ionic/angular/standalone';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Game, Frame, createEmptyGame, numberArraysToFrames } from 'src/app/core/models/game.model';
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
  totalScores: number[] = new Array(19).fill(0);
  maxScores: number[] = new Array(19).fill(300);
  seriesMode: boolean[] = [true, false, false, false, false];
  seriesId = '';
  selectedMode: SeriesMode = SeriesMode.Single;
  trackIndexes: number[][] = [[0], [1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11, 12], [13, 14, 15, 16, 17, 18]];
  sheetOpen = false;
  isAlertOpen = false;
  isModalOpen = false;
  is300 = false;
  gameData!: Game;
  deviceId = '';

  // Parent-owned game state - array of games for series mode
  // Initialize immediately so the template always has valid game objects
  games: Game[] = Array.from({ length: 19 }, () => createEmptyGame());

  // Toolbar state
  showScoreToolbar = false;
  toolbarOffset = 0;
  toolbarDisabledState = { strikeDisabled: true, spareDisabled: true };
  activeGameGrid: GameGridComponent | null = null;

  @ViewChildren(GameGridComponent) gameGrids!: QueryList<GameGridComponent>;
  @ViewChild(IonModal) modal!: IonModal;
  @ViewChild('modalGrid', { static: false }) modalGrid!: GameGridComponent;
  @ViewChild('modalCheckbox') modalCheckbox!: IonCheckbox;
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
    private highScoreAlertService: HighScoreAlertService,
    private storageService: StorageService,
    private analyticsService: AnalyticsService,
  ) {
    addIcons({ cameraOutline, chevronDown, chevronUp, medalOutline, documentTextOutline, add });
  }

  async ngOnInit(): Promise<void> {
    this.deviceId = (await Device.getId()).identifier;
    this.presentingElement = document.querySelector('.ion-page')!;
    // games are already initialized in the class declaration
  }

  /**
   * Initialize empty game objects for all possible series slots
   */
  private initializeGames(): void {
    this.games = Array.from({ length: 19 }, () => createEmptyGame());
  }

  /**
   * Handle game state changes from child GameGridComponent
   */
  onGameChanged(game: Game, index: number): void {
    this.games[index] = { ...game };
  }

  /**
   * Handle note changes from child GameGridComponent
   */
  onNoteChanged(note: string, index: number): void {
    this.games[index] = { ...this.games[index], note };
  }

  /**
   * Handle balls changes from child GameGridComponent
   */
  onBallsChanged(balls: string[], index: number): void {
    this.games[index] = { ...this.games[index], balls };
  }

  /**
   * Handle frames cleared event from child GameGridComponent
   */
  onFramesCleared(event: { clearMetadata: boolean }, index: number): void {
    if (event.clearMetadata) {
      this.games[index] = createEmptyGame();
    } else {
      this.games[index] = {
        ...this.games[index],
        frames: Array.from({ length: 10 }, (_, i) => ({ frameIndex: i + 1, throws: [] })),
        frameScores: [],
        totalScore: 0,
      };
    }
  }

  /**
   * Handle league changes for modal game
   */
  onModalLeagueChange(league: string): void {
    const isPractice = league === '' || league === 'New';
    this.gameData = {
      ...this.gameData,
      league,
      isPractice,
    };
  }

  /**
   * Handle practice toggle changes for modal game
   */
  onModalIsPracticeChange(isPractice: boolean): void {
    this.gameData = { ...this.gameData, isPractice };
  }

  /**
   * Handle game state changes for modal game
   */
  onModalGameChanged(game: Game): void {
    this.gameData = { ...game };
  }

  /**
   * Handle note changes for modal game
   */
  onModalNoteChanged(note: string): void {
    this.gameData = { ...this.gameData, note };
  }

  /**
   * Handle balls changes for modal game
   */
  onModalBallsChanged(balls: string[]): void {
    this.gameData = { ...this.gameData, balls };
  }

  /**
   * Handle pattern changes for modal game
   */
  onModalPatternChanged(patterns: string[]): void {
    this.gameData = { ...this.gameData, patterns };
  }

  async handleImageUpload(): Promise<void> {
    // if (!this.allowedDeviceIds.includes(this.deviceId)) {
    //   this.toastService.showToast('You are not allowed to use this feature yet.', 'bug', true);
    //   return;
    // }
    const alertData = localStorage.getItem('alert');
    if (alertData) {
      const { value, expiration } = JSON.parse(alertData);
      if (value === 'true' && new Date().getTime() < expiration) {
        try {
          // if ((isPlatform('android') || isPlatform('ios')) && !isPlatform('mobileweb')) {
          //   const adWatched = await this.showAdAlert();
          //   if (!adWatched) {
          //     this.toastService.showToast('You need to watch the ad to use this service.', 'bug', true);
          //     return;
          //   }
          // }
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

  cancel(): void {
    this.modal.dismiss(null, 'cancel');
  }

  onLeagueChange(league: string, isModal = false): void {
    const isPractice = league === '' || league === 'New';

    if (isModal) {
      this.gameData.league = league;
      this.gameData.isPractice = isPractice;
      this.modalCheckbox.checked = isPractice;
      this.modalCheckbox.disabled = !isPractice;
    } else {
      // Update parent-owned games array
      const activeModeIndex = this.seriesMode.findIndex((mode) => mode);
      const trackIndexes = this.trackIndexes[activeModeIndex] || [0];

      trackIndexes.forEach((trackIndex) => {
        this.games[trackIndex] = {
          ...this.games[trackIndex],
          league,
          isPractice,
        };
      });

      // Update UI elements in child components
      this.gameGrids.forEach((trackGrid: GameGridComponent) => {
        trackGrid.leagueSelector.selectedLeague = league;
        trackGrid.checkbox.checked = isPractice;
        trackGrid.checkbox.disabled = !isPractice;
      });
    }
  }

  onIsPracticeChange(isPractice: boolean): void {
    // Update parent-owned games array
    const activeModeIndex = this.seriesMode.findIndex((mode) => mode);
    const trackIndexes = this.trackIndexes[activeModeIndex] || [0];

    trackIndexes.forEach((trackIndex) => {
      this.games[trackIndex] = {
        ...this.games[trackIndex],
        isPractice,
      };
    });
  }

  onPatternChange(patterns: string[]): void {
    // Limit to maximum of 2 patterns
    if (patterns.length > 2) {
      patterns = patterns.slice(-2);
    }

    // Update parent-owned games array
    const activeModeIndex = this.seriesMode.findIndex((mode) => mode);
    const trackIndexes = this.trackIndexes[activeModeIndex] || [0];

    trackIndexes.forEach((trackIndex) => {
      this.games[trackIndex] = {
        ...this.games[trackIndex],
        patterns: [...patterns],
      };
    });
  }

  async confirm(): Promise<void> {
    try {
      if (!this.isGameValid(this.gameData)) {
        this.hapticService.vibrate(ImpactStyle.Heavy);
        this.toastService.showToast(ToastMessages.invalidInput, 'bug', true);
        return;
      }

      // Get the current game state from the modal grid and save from parent
      const gridState = this.modalGrid.getCurrentGameState();
      const savedGame = await this.saveGame(
        gridState.frames,
        gridState.frameScores,
        gridState.totalScore,
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
        await this.highScoreAlertService.checkAndDisplayHighScoreAlerts(savedGame, allGames);

        await this.analyticsService.trackGameSaved({
          score: savedGame.totalScore,
        });
      }

      this.toastService.showToast(ToastMessages.gameSaveSuccess, 'add');
      this.modal.dismiss(null, 'confirm');
    } catch (error) {
      this.toastService.showToast(ToastMessages.gameSaveError, 'bug', true);
      console.error(error);
      await this.analyticsService.trackError('game_save_confirm_error', error instanceof Error ? error.message : String(error));
    }
  }

  onToolbarStateChanged(state: { show: boolean; offset: number }): void {
    this.showScoreToolbar = state.show;
    this.toolbarOffset = state.offset;
  }

  onToolbarDisabledStateChanged(state: { strikeDisabled: boolean; spareDisabled: boolean }): void {
    this.toolbarDisabledState = state;
  }

  onToolbarButtonClick(char: string): void {
    const activeGrid = this.gameGrids.toArray().find((grid) => grid.showButtonToolbar);
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
    if (index !== undefined && index >= 0 && index < this.gameGrids.length) {
      // Clear frames for the specified index
      this.gameGrids.toArray()[index].clearFrames(false);
    } else {
      // Clear frames for all components
      this.gameGrids.forEach((trackGrid: GameGridComponent) => {
        trackGrid.clearFrames(false);
      });
    }
    this.toastService.showToast(ToastMessages.gameResetSuccess, 'refresh-outline');
  }

  async calculateScore(): Promise<void> {
    const isSeries = this.seriesMode.some((mode, i) => mode && i !== 0);
    if (isSeries) {
      this.seriesId = this.generateUniqueSeriesId();
    }

    const gameGridArray = this.gameGrids.toArray();
    if (!gameGridArray.every((grid: GameGridComponent) => grid.isGameValid())) {
      this.hapticService.vibrate(ImpactStyle.Heavy);
      this.isAlertOpen = true;
      return;
    }

    try {
      const perfectGame = gameGridArray.some((grid: GameGridComponent) => {
        const state = grid.getCurrentGameState();
        return state.totalScore === 300;
      });

      // Save all games from parent - get state from each grid
      const savePromises = gameGridArray.map((grid: GameGridComponent, index: number) => {
        const state = grid.getCurrentGameState();
        const game = this.games[this.getGameIndexFromGridIndex(index)];
        return this.saveGame(
          state.frames,
          state.frameScores,
          state.totalScore,
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
        await this.highScoreAlertService.checkAndDisplayHighScoreAlertsForMultipleGames(validSavedGames, allGames);
      }

      if (perfectGame) {
        this.is300 = true;
        setTimeout(() => (this.is300 = false), 4000);
      }

      // Clear all games after successful save
      this.initializeGames();
      gameGridArray.forEach((grid: GameGridComponent) => grid.clearFrames(true));

      this.hapticService.vibrate(ImpactStyle.Medium);
      this.toastService.showToast(ToastMessages.gameSaveSuccess, 'add');
    } catch (error) {
      console.error(error);
      this.toastService.showToast(ToastMessages.gameSaveError, 'bug', true);
    }
  }

  /**
   * Get the game index from the grid index based on the current series mode
   */
  private getGameIndexFromGridIndex(gridIndex: number): number {
    const activeModeIndex = this.seriesMode.findIndex((mode) => mode);
    const trackIndexes = this.trackIndexes[activeModeIndex] || [0];
    return trackIndexes[gridIndex] ?? 0;
  }

  /**
   * Save a game to local storage - persistence logic owned by parent
   * Frames are already in Frame[] format from getCurrentGameState()
   */
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

  onMaxScoreChanged(maxScore: number, index: number): void {
    this.maxScores[index] = maxScore;
  }

  onTotalScoreChange(totalScore: number, index: number): void {
    this.totalScores[index] = totalScore;
  }

  getSeriesMaxScore(index: number): number {
    return this.gameScoreCalculatorService.getSeriesMaxScore(index, this.maxScores);
  }

  getSeriesCurrentScore(index: number): number {
    return this.gameScoreCalculatorService.getSeriesCurrentScore(index, this.totalScores);
  }

  async presentActionSheet(): Promise<void> {
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

    let gameData: Partial<Game>[] = [];

    const captureGameData = () => {
      // Capture game data from parent-owned games array
      const activeModeIndex = this.seriesMode.findIndex((mode) => mode);
      const trackIndexes = this.trackIndexes[activeModeIndex] || [0];
      return trackIndexes.map((trackIndex) => {
        const game = this.games[trackIndex];
        const grid = this.gameGrids.toArray()[trackIndexes.indexOf(trackIndex)];
        const state = grid?.getCurrentGameState();
        return {
          frames: state?.frames || game.frames,
          frameScores: state?.frameScores || game.frameScores,
          totalScore: state?.totalScore || game.totalScore,
          league: game.league,
          note: game.note,
          balls: game.balls,
          patterns: game.patterns,
          isPractice: game.isPractice,
        };
      });
    };

    actionSheet.onWillDismiss().then(() => {
      gameData = captureGameData();
      this.sheetOpen = false;
      this.updateSegments();
    });
    actionSheet.onDidDismiss().then(() => {
      // Restore game data to parent-owned games array after mode switch
      const activeModeIndex = this.seriesMode.findIndex((mode) => mode);
      const trackIndexes = this.trackIndexes[activeModeIndex] || [0];

      trackIndexes.forEach((trackIndex, gridIndex) => {
        const data = gameData[gridIndex];
        if (!data) return;

        // Update parent-owned games array
        this.games[trackIndex] = {
          ...this.games[trackIndex],
          frames: data.frames || [],
          frameScores: data.frameScores || [],
          totalScore: data.totalScore || 0,
          note: data.note || '',
          balls: data.balls || [],
          isPractice: data.isPractice ?? true,
          patterns: data.patterns || [],
          league: data.league || '',
        };
      });
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

  // private showAdAlert(): Promise<boolean> {
  //   return new Promise((resolve) => {
  //     this.alertController
  //       .create({
  //         header: 'Ad required',
  //         message: 'To use this service, you need to watch an ad.',
  //         buttons: [
  //           {
  //             text: 'Watch ad',
  //             handler: async () => {
  //               try {
  //                 await this.adService.showRewardedAd();
  //                 resolve(true);
  //               } catch (error) {
  //                 console.error(error);
  //                 resolve(false);
  //               }
  //             },
  //           },
  //           {
  //             text: 'Cancel',
  //             role: 'cancel',
  //             handler: () => {
  //               resolve(false);
  //             },
  //           },
  //         ],
  //       })
  //       .then((alert) => alert.present());
  //   });
  // }

  private parseBowlingScores(input: string): void {
    try {
      const { frames, frameScores, totalScore } = this.gameUtilsService.parseBowlingScores(input, this.userService.username());
      // Convert number[][] from OCR parsing to Frame[] format
      const framesAsFrameArray = numberArraysToFrames(frames);
      this.gameData = this.transformGameService.transformGameData(framesAsFrameArray, frameScores, totalScore, false, '', false, '', '', [], []);
      this.gameData.isPractice = true;
      if (this.gameData.frames.length === 10 && this.gameData.frameScores.length === 10 && this.gameData.totalScore <= 300) {
        this.isModalOpen = true;
      } else {
        // this.toastService.showToast('Spielinhalt wurde nicht richtig erkannt! Probiere einen anderen Winkel.', 'bug-outline', true);
        this.isModalOpen = true;
      }
    } catch (error) {
      this.toastService.showToast(ToastMessages.unexpectedError, 'bug', true);
      console.error(error);
    }
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

  private generateUniqueSeriesId(): string {
    return 'series-' + Math.random().toString(36).substring(2, 15);
  }
}
