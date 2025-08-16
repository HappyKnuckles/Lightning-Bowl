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
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
} from '@ionic/angular/standalone';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Game } from 'src/app/core/models/game.model';
import { addIcons } from 'ionicons';
import { add, chevronDown, chevronUp, cameraOutline, documentTextOutline, medalOutline, calculatorOutline, gridOutline } from 'ionicons/icons';
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
import { StorageService } from 'src/app/core/services/storage/storage.service';
import { GameUtilsService } from 'src/app/core/services/game-utils/game-utils.service';
import { GameScoreCalculatorService } from 'src/app/core/services/game-score-calculator/game-score-calculator.service';
import { GameDataTransformerService } from 'src/app/core/services/game-transform/game-data-transform.service';
import { InputCustomEvent, ModalController } from '@ionic/angular';
import { ToastMessages } from 'src/app/core/constants/toast-messages.constants';
import { GameGridComponent } from 'src/app/shared/components/game-grid/game-grid.component';
import { PinSetupComponent } from 'src/app/shared/components/pin-setup/pin-setup.component';
import { PinData } from 'src/app/core/models/game.model';

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
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    NgIf,
    NgFor,
    GameGridComponent,
    PinSetupComponent,
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
  username = '';
  gameData!: Game;
  deviceId = '';
  @ViewChildren(GameGridComponent) gameGrids!: QueryList<GameGridComponent>;
  @ViewChild(IonModal) modal!: IonModal;
  @ViewChild('modalGrid', { static: false }) modalGrid!: GameGridComponent;
  @ViewChild('modalCheckbox') modalCheckbox!: IonCheckbox;
  selectedSegment = 'Game 1';
  segments: string[] = ['Game 1'];
  presentingElement!: HTMLElement;
  // Pin setup properties
  usePinInput = false;
  isPinSetupModalOpen = false;
  currentFrame = 1;
  currentThrowIndex = 0;
  currentGameIndex = 0;
  availablePins = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  pinInputFrames: any[][] = []; // Store frames with pin data
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
    public storageService: StorageService,
    private transformGameService: GameDataTransformerService,
    private loadingService: LoadingService,
    private userService: UserService,
    private adService: AdService,
    private hapticService: HapticService,
    private gameUtilsService: GameUtilsService,
  ) {
    addIcons({ cameraOutline, chevronDown, chevronUp, medalOutline, documentTextOutline, add, calculatorOutline, gridOutline });
  }

  async ngOnInit(): Promise<void> {
    this.userService.getUsername().subscribe((username: string) => {
      this.username = username;
    });
    this.deviceId = (await Device.getId()).identifier;
    this.presentingElement = document.querySelector('.ion-page')!;
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
          } else {
            this.toastService.showToast(ToastMessages.noImage, 'bug', true);
          }
        } catch (error) {
          this.toastService.showToast(ToastMessages.imageUploadError, 'bug', true);
          console.error(error);
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
      this.gameGrids.forEach((trackGrid: GameGridComponent) => {
        trackGrid.leagueSelector.selectedLeague = league;
        trackGrid.game().league = league;
        trackGrid.game().isPractice = isPractice;
        trackGrid.checkbox.checked = isPractice;
        trackGrid.checkbox.disabled = !isPractice;
      });
    }
  }

  onIsPracticeChange(isPractice: boolean): void {
    this.gameGrids.forEach((trackGrid: GameGridComponent) => {
      trackGrid.game().isPractice = isPractice;
    });
  }

  onPatternChange(patterns: string[]): void {
    // Limit to maximum of 2 patterns
    if (patterns.length > 2) {
      patterns = patterns.slice(-2);
    }
    this.gameGrids.forEach((trackGrid: GameGridComponent) => {
      trackGrid.game().patterns = [...patterns];
    });
  }

  async confirm(): Promise<void> {
    try {
      if (!this.isGameValid(this.gameData)) {
        this.hapticService.vibrate(ImpactStyle.Heavy);
        this.toastService.showToast(ToastMessages.invalidInput, 'bug', true);
        return;
      } else {
        // await this.storageService.saveGameToLocalStorage(this.gameData);
        this.modalGrid.saveGameToLocalStorage(false, '');
        this.toastService.showToast(ToastMessages.gameSaveSuccess, 'add');
        this.modal.dismiss(null, 'confirm');
      }
    } catch (error) {
      this.toastService.showToast(ToastMessages.gameSaveError, 'bug', true);
      console.error(error);
    }
  }

  isGameValid(game: Game): boolean {
    return this.gameUtilsService.isGameValid(game);
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

  calculateScore(): void {
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
      const perfectGame = gameGridArray.some((grid: GameGridComponent) => grid.game().totalScore === 300);

      gameGridArray.forEach((grid: GameGridComponent) => {
        setTimeout(async () => await grid.saveGameToLocalStorage(isSeries, this.seriesId), 5);
      });

      if (perfectGame) {
        this.is300 = true;
        setTimeout(() => (this.is300 = false), 4000);
      }

      this.hapticService.vibrate(ImpactStyle.Medium);
      this.toastService.showToast(ToastMessages.gameSaveSuccess, 'add');
    } catch (error) {
      console.error(error);
      this.toastService.showToast(ToastMessages.gameSaveError, 'bug', true);
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

    const captureGameData = () =>
      this.gameGrids.map((gameGrid: GameGridComponent) => ({
        frames: gameGrid.game().frames,
        league: gameGrid.game().league,
        note: gameGrid.game().note,
        balls: gameGrid.game().balls,
        patterns: gameGrid.game().patterns,
        isPractice: gameGrid.game().isPractice,
      }));

    actionSheet.onWillDismiss().then(() => {
      gameData = captureGameData();
      this.sheetOpen = false;
      this.updateSegments();
    });
    actionSheet.onDidDismiss().then(() => {
      this.gameGrids.forEach((gameGrid: GameGridComponent, index: number) => {
        const data = gameData[index];
        if (!data) return;
        gameGrid.game().frames = data.frames;
        gameGrid.game().note = data.note!;
        gameGrid.game().balls = data.balls!;
        gameGrid.game().isPractice = data.isPractice!;
        gameGrid.game().patterns = data.patterns!;
        gameGrid.onPatternChanged(data.patterns!);
        gameGrid.onLeagueChanged(data.league!);
        gameGrid.updateScores();
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
      const { frames, frameScores, totalScore } = this.gameUtilsService.parseBowlingScores(input, this.username!);
      this.gameData = this.transformGameService.transformGameData(frames, frameScores, totalScore, false, '', false, '', '', [], []);
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

  // Pin setup methods
  toggleInputMode(): void {
    this.usePinInput = !this.usePinInput;
  }

  get currentThrowLabel(): string {
    const labels = ['First Throw', 'Second Throw', 'Third Throw'];
    return labels[this.currentThrowIndex] || 'Throw';
  }

  startPinInput(gameIndex: number): void {
    this.currentGameIndex = gameIndex;
    this.currentFrame = 1;
    this.currentThrowIndex = 0;
    this.availablePins = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    this.pinInputFrames[gameIndex] = [];
    this.isPinSetupModalOpen = true;
  }

  closePinSetupModal(): void {
    this.isPinSetupModalOpen = false;
  }

  skipPinSetup(): void {
    this.closePinSetupModal();
    // Fall back to numeric input for this game
    this.usePinInput = false;
  }

  onPinThrowConfirmed(event: { score: number; pinData: PinData }): void {
    const { score, pinData } = event;
    
    // Store the throw data
    if (!this.pinInputFrames[this.currentGameIndex]) {
      this.pinInputFrames[this.currentGameIndex] = [];
    }
    
    if (!this.pinInputFrames[this.currentGameIndex][this.currentFrame - 1]) {
      this.pinInputFrames[this.currentGameIndex][this.currentFrame - 1] = [];
    }
    
    this.pinInputFrames[this.currentGameIndex][this.currentFrame - 1].push({
      value: score,
      throwIndex: this.currentThrowIndex,
      pins: pinData
    });

    // Update scores in real-time
    this.updatePinInputScores();

    // Update available pins for next throw
    this.availablePins = this.availablePins.filter(pin => !pinData.pinsKnocked.includes(pin));

    // Move to next throw
    this.advanceToNextThrow();
  }

  private updatePinInputScores(): void {
    // Update the corresponding game grid with current data
    const gameGrid = this.gameGrids.toArray()[this.currentGameIndex];
    if (gameGrid && this.pinInputFrames[this.currentGameIndex]) {
      const frames = this.convertPinInputToFrames(this.pinInputFrames[this.currentGameIndex]);
      
      frames.forEach((frame, index) => {
        if (frame && frame.length > 0) {
          gameGrid.game().frames[index] = frame.map((throw_: any) => throw_.value || throw_);
        }
      });
      
      gameGrid.updateScores();
      
      // Update our local score tracking
      this.totalScores[this.currentGameIndex] = gameGrid.game().totalScore;
      this.maxScores[this.currentGameIndex] = 300; // Max possible score is always 300
    }
  }

  private advanceToNextThrow(): void {
    // Check if frame is complete
    const currentFrameData = this.pinInputFrames[this.currentGameIndex][this.currentFrame - 1];
    const isStrike = currentFrameData.length === 1 && currentFrameData[0].value === 10;
    const isSpare = currentFrameData.length === 2 && 
      currentFrameData.reduce((sum: number, throw_: any) => sum + throw_.value, 0) === 10;
    
    // Handle 10th frame logic
    if (this.currentFrame === 10) {
      if (currentFrameData.length === 1 && (isStrike || currentFrameData[0].value < 10)) {
        this.currentThrowIndex = 1;
        if (!isStrike) {
          this.availablePins = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter(pin => 
            !currentFrameData[0].pins?.pinsKnocked.includes(pin) || false
          );
        } else {
          this.availablePins = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        }
        return;
      } else if (currentFrameData.length === 2 && (isStrike || isSpare)) {
        this.currentThrowIndex = 2;
        this.availablePins = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        return;
      } else {
        // Game complete
        this.completeFrameInput();
        return;
      }
    }

    // For frames 1-9, check if frame is complete
    if (isStrike || currentFrameData.length === 2) {
      this.moveToNextFrame();
    } else {
      this.currentThrowIndex = 1;
    }
  }

  private moveToNextFrame(): void {
    this.currentFrame++;
    this.currentThrowIndex = 0;
    this.availablePins = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    
    if (this.currentFrame > 10) {
      this.completeFrameInput();
    }
  }

  private completeFrameInput(): void {
    // Convert pin input frames to regular game format and process
    try {
      const frames = this.convertPinInputToFrames(this.pinInputFrames[this.currentGameIndex]);
      
      // Update the corresponding game grid with the data
      const gameGrid = this.gameGrids.toArray()[this.currentGameIndex];
      if (gameGrid) {
        frames.forEach((frame, index) => {
          gameGrid.game().frames[index] = frame.map((throw_: any) => throw_.value || throw_);
        });
        gameGrid.updateScores();
        
        // Update our local score tracking
        this.totalScores[this.currentGameIndex] = gameGrid.game().totalScore;
        this.maxScores[this.currentGameIndex] = 300; // Max possible score is always 300
      }

      this.toastService.showToast('Pin input complete! Game saved successfully.', 'checkmark', false);
      this.closePinSetupModal();
    } catch (error) {
      console.error('Error processing pin input:', error);
      this.toastService.showToast('Error processing pin input. Please try again.', 'bug', true);
    }
  }

  private convertPinInputToFrames(pinFrames: any[][]): number[][] {
    return pinFrames.map(frame => 
      frame.map((throw_: any) => throw_.value)
    );
  }

  // Helper methods for pin input display
  getPinInputFrameValue(gameIndex: number, frameIndex: number, throwIndex: number): string {
    if (!this.pinInputFrames[gameIndex] || !this.pinInputFrames[gameIndex][frameIndex]) {
      return '';
    }
    
    const frameData = this.pinInputFrames[gameIndex][frameIndex];
    const throwData = frameData.find((throw_: any) => throw_.throwIndex === throwIndex);
    
    if (!throwData) {
      return '';
    }
    
    const value = throwData.value;
    
    // Handle special display cases
    if (throwIndex === 0 && value === 10) {
      return 'X'; // Strike
    }
    
    if (throwIndex === 1 && frameData.length === 2) {
      const firstThrow = frameData.find((throw_: any) => throw_.throwIndex === 0);
      if (firstThrow && firstThrow.value + value === 10) {
        return '/'; // Spare
      }
    }
    
    return value.toString();
  }

  getPinInputFrameScore(gameIndex: number, frameIndex: number): string {
    if (!this.pinInputFrames[gameIndex] || !this.pinInputFrames[gameIndex][frameIndex]) {
      return '0';
    }
    
    // Calculate cumulative score up to this frame
    let totalScore = 0;
    for (let i = 0; i <= frameIndex; i++) {
      if (this.pinInputFrames[gameIndex][i]) {
        const frameData = this.pinInputFrames[gameIndex][i];
        const frameTotal = frameData.reduce((sum: number, throw_: any) => sum + throw_.value, 0);
        totalScore += frameTotal;
        
        // Add bonus for strikes and spares (simplified calculation)
        if (i < 9) { // Frames 1-9
          const isStrike = frameData.length === 1 && frameData[0].value === 10;
          const isSpare = frameData.length === 2 && frameTotal === 10;
          
          if (isStrike && this.pinInputFrames[gameIndex][i + 1]) {
            const nextFrame = this.pinInputFrames[gameIndex][i + 1];
            if (nextFrame.length > 0) {
              totalScore += nextFrame[0].value;
              if (nextFrame.length > 1 || (i + 2 < 10 && this.pinInputFrames[gameIndex][i + 2] && this.pinInputFrames[gameIndex][i + 2].length > 0)) {
                totalScore += nextFrame.length > 1 ? nextFrame[1].value : (this.pinInputFrames[gameIndex][i + 2] ? this.pinInputFrames[gameIndex][i + 2][0].value : 0);
              }
            }
          } else if (isSpare && this.pinInputFrames[gameIndex][i + 1]) {
            const nextFrame = this.pinInputFrames[gameIndex][i + 1];
            if (nextFrame.length > 0) {
              totalScore += nextFrame[0].value;
            }
          }
        }
      }
    }
    
    return totalScore.toString();
  }

  getCurrentPinFrame(gameIndex: number): number {
    if (!this.pinInputFrames[gameIndex]) {
      return 1;
    }
    
    // Find the first incomplete frame
    for (let i = 0; i < 10; i++) {
      const frameData = this.pinInputFrames[gameIndex][i];
      if (!frameData || frameData.length === 0) {
        return i + 1;
      }
      
      // Check if frame is complete
      const frameTotal = frameData.reduce((sum: number, throw_: any) => sum + throw_.value, 0);
      const isStrike = frameData.length === 1 && frameData[0].value === 10;
      const isComplete = isStrike || frameData.length === 2 || (i === 9 && frameData.length === 3);
      
      if (!isComplete) {
        return i + 1;
      }
    }
    
    return 10; // All frames complete
  }

  getCurrentPinThrow(gameIndex: number): string {
    if (!this.pinInputFrames[gameIndex]) {
      return 'First Throw';
    }
    
    const currentFrame = this.getCurrentPinFrame(gameIndex) - 1;
    const frameData = this.pinInputFrames[gameIndex][currentFrame];
    
    if (!frameData || frameData.length === 0) {
      return 'First Throw';
    }
    
    const labels = ['First Throw', 'Second Throw', 'Third Throw'];
    return labels[frameData.length] || 'Complete';
  }

  isPinInputActive(gameIndex: number): boolean {
    return this.pinInputFrames[gameIndex] && this.pinInputFrames[gameIndex].length > 0;
  }

  continuePinInput(gameIndex: number): void {
    this.currentGameIndex = gameIndex;
    this.currentFrame = this.getCurrentPinFrame(gameIndex);
    
    // Set up current throw state
    const frameData = this.pinInputFrames[gameIndex][this.currentFrame - 1];
    if (frameData && frameData.length > 0) {
      this.currentThrowIndex = frameData.length;
      // Update available pins based on previous throws in this frame
      let knockedPins: number[] = [];
      frameData.forEach((throw_: any) => {
        if (throw_.pins && throw_.pins.pinsKnocked) {
          knockedPins = knockedPins.concat(throw_.pins.pinsKnocked);
        }
      });
      this.availablePins = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter(pin => !knockedPins.includes(pin));
    } else {
      this.currentThrowIndex = 0;
      this.availablePins = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    }
    
    this.isPinSetupModalOpen = true;
  }
}
