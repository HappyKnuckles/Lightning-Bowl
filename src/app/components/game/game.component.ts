import { NgIf, NgFor, NgClass, DatePipe } from '@angular/common';
import { Component, Input, Renderer2, ViewChild, OnChanges, SimpleChanges, computed } from '@angular/core';
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
} from 'ionicons/icons';
import { Game } from 'src/app/models/game.model';
import { GameUtilsService } from 'src/app/services/game-utils/game-utils.service';
import { HapticService } from 'src/app/services/haptic/haptic.service';
import { LoadingService } from 'src/app/services/loader/loading.service';
import { StorageService } from 'src/app/services/storage/storage.service';
import { ToastService } from 'src/app/services/toast/toast.service';
import { UtilsService } from 'src/app/services/utils/utils.service';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
  providers: [DatePipe, ModalController],
  imports: [
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
    NgClass,
    IonSelect,
    IonSelectOption,
    ReactiveFormsModule,
    FormsModule,
  ],
  standalone: true,
})
export class GameComponent implements OnChanges {
  @Input() games!: Game[];
  @Input() isLeaguePage?: boolean = false;
  @Input() gameCount?: number;
  @ViewChild('accordionGroup') accordionGroup!: IonAccordionGroup;
  leagues = computed(() => {
    const savedLeagues = this.storageService.leagues();
    const leagueKeys = this.games.reduce((acc: string[], game: Game) => {
      if (game.league && !acc.includes(game.league)) {
        acc.push(game.league);
      }
      return acc;
    }, []);
    return [...new Set([...leagueKeys, ...savedLeagues])];
  });
  sortedGames: Game[] = [];
  showingGames: Game[] = [];
  private batchSize = 100;
  public loadedCount = 0;
  isEditMode: Record<string, boolean> = {};
  private closeTimers: Record<string, NodeJS.Timeout> = {};
  public delayedCloseMap: Record<string, boolean> = {};
  private originalGameState: Record<string, Game> = {};
  constructor(
    private alertController: AlertController,
    private toastService: ToastService,
    public storageService: StorageService,
    private loadingService: LoadingService,
    private datePipe: DatePipe,
    private hapticService: HapticService,
    private renderer: Renderer2,
    private gameUtilsService: GameUtilsService,
    private utilsService: UtilsService,
  ) {
    addIcons({
      trashOutline,
      createOutline,
      shareOutline,
      documentTextOutline,
      medalOutline,
      bowlingBallOutline,
      cloudUploadOutline,
      cloudDownloadOutline,
      filterOutline,
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['games'] && this.games) {
      this.sortedGames = [...this.games].sort((a, b) => b.date - a.date);
      this.showingGames = this.sortedGames.slice(0, this.batchSize);
      this.loadedCount += this.batchSize;
    }
  }

  async deleteGame(gameId: string): Promise<void> {
    this.hapticService.vibrate(ImpactStyle.Heavy, 300);
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
            await this.storageService.deleteGame(gameId);
            this.toastService.showToast('Game deleted sucessfully.', 'remove-outline');
          },
        },
      ],
    });

    await alert.present();
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

  isDelayedOpen(gameId: string): boolean {
    return this.delayedCloseMap[gameId];
  }

  openExpansionPanel(accordionId: string): void {
    const nativeEl = this.accordionGroup;

    if (nativeEl.value === accordionId) {
      nativeEl.value = undefined;
    } else nativeEl.value = accordionId;
  }

  parseIntValue(value: unknown): number {
    return this.utilsService.parseIntValue(value) as number;
  }

  saveOriginalStateAndEnableEdit(game: Game): void {
    this.originalGameState[game.gameId] = JSON.parse(JSON.stringify(game));
    this.enableEdit(game, game.gameId);
  }

  enableEdit(game: Game, accordionId?: string): void {
    this.isEditMode[game.gameId] = !this.isEditMode[game.gameId];
    this.hapticService.vibrate(ImpactStyle.Light, 100);

    if (accordionId) {
      this.openExpansionPanel(accordionId);
      this.delayedCloseMap[game.gameId] = true;
    }
  }
  cancelEdit(game: Game): void {
    // Revert to the original game state
    if (this.originalGameState[game.gameId]) {
      Object.assign(game, this.originalGameState[game.gameId]);
      delete this.originalGameState[game.gameId];
    }
    this.enableEdit(game);
  }

  async saveEdit(game: Game): Promise<void> {
    try {
      if (!this.isGameValid(game)) {
        this.hapticService.vibrate(ImpactStyle.Heavy, 300);
        this.toastService.showToast('Invalid input.', 'bug', true);
        return;
      } else {
        // Create a deep copy of the game object
        const gameCopy = structuredClone(game);

        gameCopy.frames.forEach((frame: any) => {
          delete frame.isInvalid;
        });

        if (gameCopy.league === undefined || gameCopy.league === '') {
          gameCopy.isPractice = true;
        } else {
          gameCopy.isPractice = false;
        }
        gameCopy.totalScore = gameCopy.frameScores[9];
        await this.storageService.saveGameToLocalStorage(gameCopy);
        this.toastService.showToast('Game edit saved successfully!', 'refresh-outline');
        this.enableEdit(game);
      }
    } catch (error) {
      this.toastService.showToast(`Error saving game to localstorage: ${error}`, 'bug', true);
    }
  }

  isGameValid(game: Game): boolean {
    return this.gameUtilsService.isGameValid(game);
  }

  async takeScreenshotAndShare(game: Game): Promise<void> {
    const accordion = document.getElementById(game.gameId);
    if (!accordion) {
      throw new Error('Accordion not found');
    }

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

      const message =
        game.totalScore === 300 ? `Look at me bitches, perfect game on ${formattedDate}! 🎳🎉.` : `Check out this game from ${formattedDate}`;

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
        this.toastService.showToast('Screenshot shared successfully.', 'share-social-outline');
      }
    } catch (error) {
      console.error('Error taking screenshot and sharing', error);
      this.toastService.showToast('Error sharing screenshot!', 'bug', true);
    } finally {
      // Restore the original state
      this.renderer.setStyle(childNode, 'width', originalWidth);
      this.accordionGroup.value = accordionGroupValues;
      this.loadingService.setLoading(false);
    }
  }
}
