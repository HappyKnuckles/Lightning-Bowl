import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
import { Subscription } from 'rxjs';
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
} from 'ionicons/icons';
import { NgIf, DatePipe } from '@angular/common';
import { ImpactStyle } from '@capacitor/haptics';
import { HapticService } from 'src/app/services/haptic/haptic.service';
import { LoadingService } from 'src/app/services/loader/loading.service';
import { ToastService } from 'src/app/services/toast/toast.service';
import { ModalController } from '@ionic/angular';
import { StorageService } from 'src/app/services/storage/storage.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GameComponent } from 'src/app/components/game/game.component';
import { ExcelService } from 'src/app/services/excel/excel.service';
import { SortUtilsService } from 'src/app/services/sort-utils/sort-utils.service';
import { GameFilterService } from 'src/app/services/game-filter/game-filter.service';
import { GameFilterComponent } from 'src/app/components/game-filter/game-filter.component';

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
  ],
})
export class HistoryPage implements OnInit, OnDestroy {
  @ViewChild('accordionGroup') accordionGroup!: IonAccordionGroup;
  file!: File;
  private gameSubscriptions: Subscription = new Subscription();
  private filteredGamesSubscription!: Subscription;
  private leagueSubscriptions: Subscription = new Subscription();

  constructor(
    private alertController: AlertController,
    private toastService: ToastService,
    private storageService: StorageService,
    public loadingService: LoadingService,
    private hapticService: HapticService,
    private modalCtrl: ModalController,
    public gameFilterService: GameFilterService,
    private sortUtilsService: SortUtilsService,
    private excelService: ExcelService
  ) {
    // this.loadingSubscription = this.loadingService.isLoading$.subscribe((isLoading) => {
    //   this.isLoading = isLoading;
    // });
    // effect(() => {
    //   this.gameHistory = this.storageService.games();
    //   console.log("called")
    //   if (this.gameHistory) {
    //     this.sortUtilsService.sortGameHistoryByDate(this.gameHistory);
    //     this.gameFilterService.filterGames(this.gameHistory);
    //   }
    // });
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
    try {
      this.loadingService.setLoading(true);
    } catch (error) {
      console.error(error);
    } finally {
      this.loadingService.setLoading(false);
    }
  }

  async openFilterModal() {
    const modal = await this.modalCtrl.create({
      component: GameFilterComponent,
      componentProps: {
        // games: this.gameHistory,
        // filteredGames: this.filteredGameHistory,
      },
    });

    return await modal.present();
  }

  ngOnDestroy(): void {
    this.gameSubscriptions.unsubscribe();
    this.leagueSubscriptions.unsubscribe();
    this.filteredGamesSubscription.unsubscribe();
  }

  async handleRefresh(event: any): Promise<void> {
    try {
      this.hapticService.vibrate(ImpactStyle.Medium, 200);
      this.loadingService.setLoading(true);
      await this.storageService.loadGameHistory();
    } catch (error) {
      console.error(error);
    } finally {
      event.target.complete();
      this.loadingService.setLoading(false);
    }
  }

  async handleFileUpload(event: any): Promise<void> {
    try {
      this.loadingService.setLoading(true);
      this.file = event.target.files[0];
      const gameData = await this.excelService.readExcelData(this.file);
      await this.excelService.transformData(gameData);
      this.toastService.showToast('Uploaded Excel file successfully.', 'checkmark-outline');
    } catch (error) {
      this.toastService.showToast(`Error: ${error}`, 'bug', true);
    } finally {
      event.target.value = '';
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
    const gotPermission = await this.excelService.exportToExcel(this.storageService.games());
    if (!gotPermission) {
      this.showPermissionDeniedAlert();
    }
  }

  // async loadGameHistory(): Promise<void> {
  //   try {
  //     this.gameHistory = await this.storageService.loadGameHistory();
  //     this.gameFilterService.filterGames(this.gameHistory);
  //   } catch (error) {
  //     this.toastService.showToast(`Error loading history! ${error}`, 'bug', true);
  //   }
  // }

  private subscribeToDataEvents(): void {
    // this.gameSubscriptions.add(
    //   merge(this.storageService.newGameAdded, this.storageService.gameDeleted, this.storageService.gameEditLeague).subscribe(() => {
    //     this.loadGameHistory()
    //       .then(() => {
    //         this.sortUtilsService.sortGameHistoryByDate(this.gameHistory);
    //       })
    //       .catch((error) => {
    //         console.error('Error loading game history:', error);
    //       });
    //   })
    // );

    // this.filteredGamesSubscription = this.gameFilterService.filteredGames$.subscribe((games) => {
    //   this.filteredGameHistory = games;
    //   this.sortUtilsService.sortGameHistoryByDate(this.filteredGameHistory);
    //   this.activeFilterCount = this.gameFilterService.activeFilterCount;
    // });

    // this.leagueSubscriptions.add(
    //   merge(this.storageService.newLeagueAdded, this.storageService.leagueDeleted, this.storageService.leagueChanged).subscribe(() => {
    //     this.getLeagues();
    //   })
    // );
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
              this.exportToExcel();
            }
          },
        },
      ],
    });
    await alert.present();
  }
}
