import { NgIf, NgFor, NgClass, DatePipe } from '@angular/common';
import { Component, Input, Renderer2, ViewChild, OnChanges, SimpleChanges, computed, OnInit } from '@angular/core';
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
import { Game } from 'src/app/core/models/game.model';
import { GameUtilsService } from 'src/app/core/services/game-utils/game-utils.service';
import { HapticService } from 'src/app/core/services/haptic/haptic.service';
import { LoadingService } from 'src/app/core/services/loader/loading.service';
import { StorageService } from 'src/app/core/services/storage/storage.service';
import { ToastService } from 'src/app/core/services/toast/toast.service';
import { UtilsService } from 'src/app/core/services/utils/utils.service';
import { PatternTypeaheadComponent } from '../pattern-typeahead/pattern-typeahead.component';
import { LongPressDirective } from 'src/app/core/directives/long-press/long-press.directive';

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
    NgClass,
    IonSelect,
    IonSelectOption,
    ReactiveFormsModule,
    FormsModule,
    PatternTypeaheadComponent,
    LongPressDirective,
    DatePipe,
  ],
  standalone: true,
})
export class GameComponent implements OnChanges, OnInit {
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
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['games'] && this.games) {
      this.sortedGames = [...this.games].sort((a, b) => b.date - a.date);
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

  /** LONG-PRESS or header click entry point */
  saveOriginalStateAndEnableEdit(game: Game): void {
    if (!this.isEditMode[game.gameId]) {
      this.originalGameState[game.gameId] = structuredClone(game);
      this.enableEdit(game, game.gameId);
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

  cancelEdit(game: Game): void {
    const saved = this.originalGameState[game.gameId];
    if (saved) {
      Object.assign(game, saved);
      delete this.originalGameState[game.gameId];
    }

    this.isEditMode[game.gameId] = false;
    this.hapticService.vibrate(ImpactStyle.Light);

    const wasOpen = this.delayedCloseMap[game.gameId];
    this.openExpansionPanel(wasOpen ? game.gameId : undefined);
    delete this.delayedCloseMap[game.gameId];
  }

  async saveEdit(game: Game): Promise<void> {
    try {
      if (!this.isGameValid(game)) {
        this.hapticService.vibrate(ImpactStyle.Heavy);
        this.toastService.showToast(ToastMessages.invalidInput, 'bug', true);
        return;
      }

      const gameCopy = structuredClone(game);
      gameCopy.frames.forEach((f: any) => delete f.isInvalid);
      gameCopy.isPractice = !gameCopy.league;
      gameCopy.totalScore = gameCopy.frameScores[9];
      await this.storageService.saveGameToLocalStorage(gameCopy);

      this.toastService.showToast(ToastMessages.gameUpdateSuccess, 'refresh-outline');

      this.isEditMode[game.gameId] = false;
      this.hapticService.vibrate(ImpactStyle.Light);
      const wasOpen = this.delayedCloseMap[game.gameId];
      this.openExpansionPanel(wasOpen ? game.gameId : undefined);

      delete this.originalGameState[game.gameId];
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
    return this.gameUtilsService.isGameValid(game);
  }

  parseIntValue(value: unknown): number {
    return this.utilsService.parseIntValue(value) as number;
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
        this.toastService.showToast(ToastMessages.screenshotShareSuccess, 'share-social-outline');
      }
    } catch (error) {
      console.error('Error taking screenshot and sharing', error);
      this.toastService.showToast(ToastMessages.screenshotShareError, 'bug', true);
    } finally {
      // Restore the original state
      this.renderer.setStyle(childNode, 'width', originalWidth);
      this.accordionGroup.value = accordionGroupValues;
      this.loadingService.setLoading(false);
    }
  }
}
