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
import { Game } from 'src/app/core/models/game.model';
import { LeagueData } from 'src/app/core/models/league.model';
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
import { StorageService } from 'src/app/core/services/storage/storage.service';
import { GameUtilsService } from 'src/app/core/services/game-utils/game-utils.service';
import { GameScoreCalculatorService } from 'src/app/core/services/game-score-calculator/game-score-calculator.service';
import { GameDataTransformerService } from 'src/app/core/services/game-transform/game-data-transform.service';
import { InputCustomEvent, ModalController } from '@ionic/angular';
import { ToastMessages } from 'src/app/core/constants/toast-messages.constants';
import { GameGridComponent } from 'src/app/shared/components/game-grid/game-grid.component';

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
    addIcons({ cameraOutline, chevronDown, chevronUp, medalOutline, documentTextOutline, add });
  }

  // Helper method to get league name from LeagueData
  private getLeagueName(league: LeagueData | undefined): string {
    if (!league) return '';
    return typeof league === 'string' ? league : league.Name;
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

  onLeagueChange(league: LeagueData, isModal = false): void {
    // Helper function to determine if a league selection means "practice"
    const isPracticeLeague = (leagueData: LeagueData): boolean => {
      if (!leagueData) return true;
      if (typeof leagueData === 'string') {
        return leagueData === '' || leagueData === 'New';
      }
      return false; // League objects are never practice
    };
    
    const isPractice = isPracticeLeague(league);

    if (isModal) {
      this.gameData.league = league;
      this.gameData.isPractice = isPractice;
      this.modalCheckbox.checked = isPractice;
      this.modalCheckbox.disabled = !isPractice;
    } else {
      this.gameGrids.forEach((trackGrid: GameGridComponent) => {
        trackGrid.leagueSelector.selectedLeague = this.getLeagueName(league);
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
        gameGrid.onLeagueChanged(this.getLeagueName(data.league!));
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
}
