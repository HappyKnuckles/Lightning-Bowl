import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, QueryList, signal, ViewChild, ViewChildren } from '@angular/core';
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
  IonInput,
  IonSegment,
  IonSegmentButton,
  IonSegmentView,
  IonSegmentContent,
  IonCheckbox,
} from '@ionic/angular/standalone';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Game } from 'src/app/core/models/game.model';
import { addIcons } from 'ionicons';
import { add, chevronDown, chevronUp, cameraOutline, documentTextOutline, medalOutline, warningOutline } from 'ionicons/icons';
import { NgIf, NgFor } from '@angular/common';
import { ImpactStyle } from '@capacitor/haptics';
import { AdService } from 'src/app/core/services/ad/ad.service';
import { HapticService } from 'src/app/core/services/haptic/haptic.service';
import { ImageProcesserService } from 'src/app/core/services/image-processer/image-processer.service';
import { LoadingService } from 'src/app/core/services/loader/loading.service';
import { ToastService } from 'src/app/core/services/toast/toast.service';
import { UserService } from 'src/app/core/services/user/user.service';
import { defineCustomElements } from '@teamhive/lottie-player/loader';
import { StorageService } from 'src/app/core/services/storage/storage.service';
import { GameUtilsService } from 'src/app/core/services/game-utils/game-utils.service';
import { GameScoreCalculatorService } from 'src/app/core/services/game-score-calculator/game-score-calculator.service';
import { GameDataTransformerService } from 'src/app/core/services/game-transform/game-data-transform.service';
import { InputCustomEvent, ModalController } from '@ionic/angular';
import { ToastMessages } from 'src/app/core/constants/toast-messages.constants';
import { GameGridComponent } from 'src/app/shared/components/game-grid/game-grid.component';
import { LeagueSelectorComponent } from 'src/app/shared/components/league-selector/league-selector.component';
import { PatternTypeaheadComponent } from 'src/app/shared/components/pattern-typeahead/pattern-typeahead.component';

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
    IonInput,
    IonCheckbox,
    IonSegmentButton,
    IonSegment,
    IonSegmentContent,
    IonSegmentView,
    NgIf,
    NgFor,
    GameGridComponent,
    LeagueSelectorComponent,
    PatternTypeaheadComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddGamePage implements OnInit {
  totalScores = signal<number[]>(new Array(8).fill(0));
  maxScores = signal<number[]>(new Array(8).fill(300));
  seriesMode = signal([true, false, false, false, false]);
  private seriesId = '';
  selectedMode = signal<SeriesMode>(SeriesMode.Single);
  trackIndexes = signal<number[][]>([[0], [1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11, 12], [13, 14, 15, 16, 17, 18]]);
  sheetOpen = signal(false);
  isAlertOpen = signal(false);
  isModalOpen = signal(false);
  is300 = signal(false);
  gameData = signal<Game>({
    gameId: '',
    date: 0,
    frames: undefined,
    totalScore: 0,
    frameScores: [],
    isClean: false,
    isPerfect: false,
    isPractice: false,
    pattern: '',
  });
  @ViewChildren(GameGridComponent) gameGrids!: QueryList<GameGridComponent>;
  @ViewChild(IonModal) modal!: IonModal;
  @ViewChild('modalCheckbox') modalCheckbox!: IonCheckbox;
  selectedSegment = 'Game 1';
  segments = signal(['Game 1']);
  presentingElement!: HTMLElement;

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
    addIcons({ cameraOutline, chevronDown, chevronUp, warningOutline, medalOutline, documentTextOutline, add });
  }

  async ngOnInit(): Promise<void> {
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
      this.gameData.update((currentGame) => ({
        ...currentGame,
        league: league,
        isPractice: isPractice,
      }));
      this.modalCheckbox.checked = isPractice;
      this.modalCheckbox.disabled = !isPractice;
    } else {
      this.gameGrids.forEach((trackGrid: GameGridComponent) => {
        trackGrid.leagueSelector.selectedLeague = league;
        trackGrid.selectedLeague = league;
        trackGrid.isPractice = isPractice;
        trackGrid.checkbox.checked = isPractice;
        trackGrid.checkbox.disabled = !isPractice;
      });
    }
  }

  onIsPracticeChange(isPractice: boolean): void {
    this.gameGrids.forEach((trackGrid: GameGridComponent) => {
      trackGrid.isPractice = isPractice;
    });
  }

  async confirm(): Promise<void> {
    try {
      if (!this.isGameValid(this.gameData())) {
        this.hapticService.vibrate(ImpactStyle.Heavy);
        this.toastService.showToast(ToastMessages.invalidInput, 'bug', true);
        return;
      } else {
        await this.storageService.saveGameToLocalStorage(this.gameData());
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
    this.gameData.update((currentGame) => {
      const newGame = { ...currentGame };
      newGame.frameScores = [...(currentGame.frameScores || [])];
      newGame.frameScores[index] = parseInt(event.detail.value!, 10);
      return newGame;
    });
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
    const isSeries = this.seriesMode().some((mode, i) => mode && i !== 0);
    if (isSeries) {
      this.seriesId = this.generateUniqueSeriesId();
    }

    const gameGridArray = this.gameGrids.toArray();
    if (!gameGridArray.every((grid: GameGridComponent) => grid.isGameValid())) {
      this.hapticService.vibrate(ImpactStyle.Heavy);
      this.isAlertOpen.set(true);
      return;
    }

    try {
      const perfectGame = gameGridArray.some((grid: GameGridComponent) => grid.totalScore === 300);

      gameGridArray.forEach((grid: GameGridComponent) => {
        setTimeout(async () => await grid.saveGameToLocalStorage(isSeries, this.seriesId), 5);
      });

      if (perfectGame) {
        this.is300.set(true);
        setTimeout(() => this.is300.set(false), 4000);
      }

      this.hapticService.vibrate(ImpactStyle.Medium);
      this.toastService.showToast(ToastMessages.gameSaveSuccess, 'add');
    } catch (error) {
      console.error(error);
      this.toastService.showToast(ToastMessages.gameSaveError, 'bug', true);
    }
  }

  onMaxScoreChanged(maxScore: number, index: number): void {
    this.maxScores.update((currentScores) => {
      const newScores = [...currentScores];
      newScores[index] = maxScore;
      return newScores;
    });
  }

  onTotalScoreChange(totalScore: number, index: number): void {
    this.totalScores.update((currentScores) => {
      const newScores = [...currentScores];
      newScores[index] = totalScore;
      return newScores;
    });
  }

  getSeriesMaxScore(index: number): number {
    return this.gameScoreCalculatorService.getSeriesMaxScore(index, this.maxScores());
  }

  getSeriesCurrentScore(index: number): number {
    return this.gameScoreCalculatorService.getSeriesCurrentScore(index, this.totalScores());
  }

  async presentActionSheet(): Promise<void> {
    const buttons = [];
    this.hapticService.vibrate(ImpactStyle.Medium);
    this.sheetOpen.set(true);

    const modes = [SeriesMode.Single, SeriesMode.Series3, SeriesMode.Series4, SeriesMode.Series5, SeriesMode.Series6];

    modes.forEach((mode, index) => {
      if (!this.seriesMode()[index]) {
        buttons.push({
          text: mode,
          handler: () => {
            this.seriesMode.set(this.seriesMode().map((_, i) => i === index));
            this.selectedMode.set(mode);
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
        frames: gameGrid.frames,
        league: gameGrid.selectedLeague,
        note: gameGrid.note,
        balls: gameGrid.balls,
        pattern: gameGrid.pattern,
        isPractice: gameGrid.isPractice,
      }));

    actionSheet.onWillDismiss().then(() => {
      gameData = captureGameData();
      this.sheetOpen.set(false);
      this.updateSegments();
    });
    actionSheet.onDidDismiss().then(() => {
      this.gameGrids.forEach((gameGrid: GameGridComponent, index: number) => {
        const data = gameData[index];
        if (!data) return;
        gameGrid.frames = data.frames;
        gameGrid.note = data.note!;
        gameGrid.balls = data.balls!;
        gameGrid.isPractice = data.isPractice!;
        gameGrid.pattern = data.pattern!;
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
    if (this.selectedMode() === SeriesMode.Series3) {
      this.segments.set(['Game 1', 'Game 2', 'Game 3']);
    } else if (this.selectedMode() === SeriesMode.Series4) {
      this.segments.set(['Game 1', 'Game 2', 'Game 3', 'Game 4']);
    } else if (this.selectedMode() === SeriesMode.Series5) {
      this.segments.set(['Game 1', 'Game 2', 'Game 3', 'Game 4', 'Game 5']);
    } else if (this.selectedMode() === SeriesMode.Series6) {
      this.segments.set(['Game 1', 'Game 2', 'Game 3', 'Game 4', 'Game 5', 'Game 6']);
    } else {
      this.segments.set(['Game 1']);
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
      const transformedGame = this.transformGameService.transformGameData(frames, frameScores, totalScore, false, '', false, '', '', '', []);
      this.gameData.set(transformedGame);
      this.gameData.update((game) => ({ ...game, isPractice: true }));
      if (this.gameData().frames.length === 10 && this.gameData().frameScores.length === 10 && this.gameData().totalScore <= 300) {
        this.isModalOpen.set(true);
      } else {
        // this.toastService.showToast('Spielinhalt wurde nicht richtig erkannt! Probiere einen anderen Winkel.', 'bug-outline', true);
        this.isModalOpen.set(false);
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
