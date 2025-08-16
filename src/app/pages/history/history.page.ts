import { Component, ViewChild } from '@angular/core';
import {
  AlertController,
  IonHeader,
  IonToolbar,
  IonButton,
  IonIcon,
  IonTitle,
  IonBadge,
  IonContent,
  IonRefresher,
  IonText,
  IonButtons,
  IonAccordionGroup,
  IonRefresherContent,
} from '@ionic/angular/standalone';
import { Filesystem } from '@capacitor/filesystem';
import { addIcons } from 'ionicons';
import {
  cloudUploadOutline,
  cloudDownloadOutline,
  trashOutline,
  createOutline,
  shareOutline,
  documentTextOutline,
  filterOutline,
  medalOutline,
  swapVertical,
} from 'ionicons/icons';
import { NgIf, DatePipe } from '@angular/common';
import { ImpactStyle } from '@capacitor/haptics';
import { HapticService } from 'src/app/core/services/haptic/haptic.service';
import { LoadingService } from 'src/app/core/services/loader/loading.service';
import { ToastService } from 'src/app/core/services/toast/toast.service';
import { ModalController, RefresherCustomEvent } from '@ionic/angular';
import { StorageService } from 'src/app/core/services/storage/storage.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ExcelService } from 'src/app/core/services/excel/excel.service';
import { GameFilterService } from 'src/app/core/services/game-filter/game-filter.service';
import { ToastMessages } from 'src/app/core/constants/toast-messages.constants';
import { GameFilterActiveComponent } from 'src/app/shared/components/game-filter-active/game-filter-active.component';
import { GameFilterComponent } from 'src/app/shared/components/game-filter/game-filter.component';
import { GameComponent } from 'src/app/shared/components/game/game.component';
import { SortHeaderComponent } from 'src/app/shared/components/sort-header/sort-header.component';
import { LeagueMigrationService } from 'src/app/core/services/league-migration/league-migration.service';

@Component({
  selector: 'app-history',
  templateUrl: 'history.page.html',
  styleUrls: ['history.page.scss'],
  standalone: true,
  providers: [DatePipe, ModalController],
  imports: [
    IonRefresherContent,
    IonButtons,
    IonHeader,
    IonToolbar,
    IonButton,
    IonIcon,
    IonTitle,
    IonBadge,
    IonContent,
    IonRefresher,
    NgIf,
    IonText,
    ReactiveFormsModule,
    FormsModule,
    GameComponent,
    GameFilterActiveComponent,
    SortHeaderComponent,
  ],
})
export class HistoryPage {
  @ViewChild('accordionGroup') accordionGroup!: IonAccordionGroup;
  @ViewChild(IonContent, { static: false }) content!: IonContent;

  // currentSortOption: GameSortOption = {
  //   field: GameSortField.DATE,
  //   direction: SortDirection.DESC,
  //   label: 'Date (Newest First)'
  // };

  // get displayedGames() {
  //   return this.sortService.sortGames(this.gameFilterService.filteredGames(), this.currentSortOption);
  // }

  constructor(
    private alertController: AlertController,
    private toastService: ToastService,
    public storageService: StorageService,
    public loadingService: LoadingService,
    private hapticService: HapticService,
    private modalCtrl: ModalController,
    public gameFilterService: GameFilterService,
    private excelService: ExcelService,
    private leagueMigrationService: LeagueMigrationService,
    // public sortService: SortService,
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
      swapVertical,
    });
  }

  //  onSortChanged(sortOption: any): void {
  //     this.currentSortOption = sortOption as GameSortOption;
  //     if (this.content) {
  //       setTimeout(() => {
  //         this.content.scrollToTop(300);
  //       }, 100);
  //     }
  //   }

  async openFilterModal() {
    const modal = await this.modalCtrl.create({
      component: GameFilterComponent,
    });

    return await modal.present();
  }

  async handleRefresh(event: RefresherCustomEvent): Promise<void> {
    try {
      this.hapticService.vibrate(ImpactStyle.Medium);
      await this.storageService.loadGameHistory();
    } catch (error) {
      console.error(error);
      this.toastService.showToast(ToastMessages.gameLoadError, 'bug', true);
    } finally {
      event.target.complete();
    }
  }

  async handleFileUpload(event: Event): Promise<void> {
    try {
      this.loadingService.setLoading(true);
      const input = event.target as HTMLInputElement;
      if (!input.files || input.files.length === 0) return;

      const file = input.files[0];
      const gameData = await this.excelService.readExcelData(file);

      // Extract league names to check if we need user input
      const leagueNames = this.leagueMigrationService.extractLeagueNamesFromData(gameData);

      // Disable loading screen for league association alerts
      this.loadingService.setLoading(false);

      // Handle league association for imported leagues
      let leagueAssociationMap = new Map();
      if (leagueNames.size > 0) {
        try {
          leagueAssociationMap = await this.leagueMigrationService.associateImportedLeagues(leagueNames, this.storageService);
        } catch (error) {
          // If user cancelled or error occurred, don't continue with import
          if (error instanceof Error && error.message.includes('cancelled')) {
            this.toastService.showToast('Import cancelled by user', 'information', false);
            return;
          }
          throw error;
        }
      }

      // Re-enable loading screen for data transformation
      this.loadingService.setLoading(true);

      await this.excelService.transformData(gameData, leagueAssociationMap);
      // this.toastService.showToast(ToastMessages.excelFileUploadSuccess, 'checkmark-outline');
    } catch (error) {
      this.toastService.showToast(ToastMessages.excelFileUploadError, 'bug', true);
      console.error(error);
    } finally {
      const input = event.target as HTMLInputElement;
      input.value = '';
      this.loadingService.setLoading(false);
    }
  }

  openExcelFileInput(): void {
    const fileInput = document.getElementById('excelUpload');
    if (fileInput) {
      fileInput.click();
    }
  }

  async exportToExcel(): Promise<void> {
    try {
      const gotPermission = await this.excelService.exportToExcel();
      if (gotPermission) {
        this.toastService.showToast(ToastMessages.excelFileDownloadSuccess, 'checkmark-outline');
      } else {
        await this.showPermissionDeniedAlert();
      }
    } catch (error) {
      this.toastService.showToast(ToastMessages.excelFileDownloadError, 'bug', true);
      console.error('Error exporting to Excel:', error);
    }
  }

  private async showPermissionDeniedAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Permission Denied',
      message: 'To save to Gamedata.xlsx, you need to give permissions!',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Try again',
          handler: async () => {
            const permissionRequestResult = await Filesystem.requestPermissions();
            if (permissionRequestResult.publicStorage === 'granted') {
              await this.exportToExcel();
            }
          },
        },
      ],
    });
    await alert.present();
  }

  async deleteAll(): Promise<void> {
    await this.storageService.deleteAllData();
    window.dispatchEvent(new Event('dataDeleted'));
  }
}
