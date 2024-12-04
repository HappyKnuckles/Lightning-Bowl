import { NgIf, NgFor, NgClass, DatePipe } from '@angular/common';
import { Component, Input, OnInit, Renderer2, ViewChild } from '@angular/core';
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
} from 'ionicons/icons';
import { Game } from 'src/app/models/game-model';
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
export class GameComponent implements OnInit {
  @Input() games!: Game[];
  showingGames: Game[] = [];
  @Input() leagues!: string[];
  @Input() isLeaguePage?: boolean = false;
  @Input() gameCount?: number;
  @ViewChild('accordionGroup') accordionGroup!: IonAccordionGroup;
  isEditMode: { [key: string]: boolean } = {};
  private originalGameState: { [key: string]: Game } = {};
  constructor(
    private alertController: AlertController,
    private toastService: ToastService,
    private storageService: StorageService,
    private loadingService: LoadingService,
    private datePipe: DatePipe,
    private hapticService: HapticService,
    private renderer: Renderer2,
    private utilsService: UtilsService
  ) {
    addIcons({
      cloudUploadOutline,
      cloudDownloadOutline,
      filterOutline,
      trashOutline,
      createOutline,
      shareOutline,
      documentTextOutline,
      medalOutline,
    });
  }

  ngOnInit(): void {
    this.showingGames = this.games.slice(0, 15);
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
          handler: () => {},
        },
        {
          text: 'Delete',
          handler: async () => {
            const key = 'game' + gameId;
            await this.storageService.deleteGame(key);
            this.toastService.showToast('Game deleted sucessfully.', 'checkmark-outline');
          },
        },
      ],
    });

    await alert.present();
  }

  loadMoreGames(event: any): void {
    const nextPage = this.showingGames.length + 15;
    setTimeout(() => {
      (event as InfiniteScrollCustomEvent).target.complete();
      this.showingGames = this.games.slice(0, nextPage);
    }, 150);
  }

  parseIntValue(value: any): any {
    return this.utilsService.parseIntValue(value);
  }

  saveOriginalStateAndEnableEdit(game: Game) {
    this.originalGameState[game.gameId] = JSON.parse(JSON.stringify(game));
    this.enableEdit(game, game.gameId);
  }

  enableEdit(game: Game, accordionId?: string): void {
    this.isEditMode[game.gameId] = !this.isEditMode[game.gameId];
    this.hapticService.vibrate(ImpactStyle.Light, 100);

    if (accordionId) {
      this.openExpansionPanel(accordionId);
    }
  }

  openExpansionPanel(accordionId: string): void {
    const nativeEl = this.accordionGroup;

    if (nativeEl.value === accordionId) {
      nativeEl.value = undefined;
    } else nativeEl.value = accordionId;
  }

  deleteAll(): void {
    this.storageService.deleteAllData();
    window.dispatchEvent(new Event('dataDeleted'));
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
        if (game.league === undefined || game.league === '') {
          game.isPractice = true;
        } else game.isPractice = false;

        await this.storageService.saveGameToLocalStorage(game, true);
        this.toastService.showToast('Game edit saved sucessfully!', 'refresh-outline');
        this.enableEdit(game);
      }
    } catch (error) {
      this.toastService.showToast(`Error saving game to localstorage: ${error}`, 'bug', true);
    }
  }
  isGameValid(game: Game): boolean {
    return this.utilsService.isGameValid(undefined, game);
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
