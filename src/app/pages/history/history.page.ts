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
} from '@ionic/angular/standalone';
import { Filesystem } from '@capacitor/filesystem';
import { merge, Subscription } from 'rxjs';
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
import { Game } from 'src/app/models/game-model';
import { FilterComponent } from 'src/app/components/filter/filter.component';
import { ModalController } from '@ionic/angular';
import { FilterService } from 'src/app/services/filter/filter.service';
import { StorageService } from 'src/app/services/storage/storage.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GameComponent } from 'src/app/components/game/game.component';
import { ExcelService } from 'src/app/services/excel/excel.service';
import { SortUtilsService } from 'src/app/services/sort-utils/sort-utils.service';

@Component({
  selector: 'app-history',
  templateUrl: 'history.page.html',
  styleUrls: ['history.page.scss'],
  standalone: true,
  providers: [DatePipe, ModalController],
  imports: [
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
  gameHistory: Game[] = [];
  filteredGameHistory: Game[] = [];
  leagues: string[] = [];
  arrayBuffer: any;
  file!: File;
  private gameSubscriptions: Subscription = new Subscription();
  private filteredGamesSubscription!: Subscription;
  private loadingSubscription: Subscription;
  private leagueSubscriptions: Subscription = new Subscription();
  isLoading: boolean = false;
  activeFilterCount = this.filterService.activeFilterCount;

  constructor(
    private alertController: AlertController,
    private toastService: ToastService,
    private storageService: StorageService,
    private loadingService: LoadingService,
    private hapticService: HapticService,
    private modalCtrl: ModalController,
    private filterService: FilterService,
    private sortUtilsService: SortUtilsService,
    private excelService: ExcelService
  ) {
    this.loadingSubscription = this.loadingService.isLoading$.subscribe((isLoading) => {
      this.isLoading = isLoading;
    });

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

  async ngOnInit(): Promise<void> {
    try {
      this.loadingService.setLoading(true);
      await this.loadGameHistory();
      await this.getLeagues();
      this.subscribeToDataEvents();
      this.filteredGameHistory = this.gameHistory;
    } catch (error) {
      console.error(error);
    } finally {
      this.loadingService.setLoading(false);
    }
  }

  async getLeagues() {
    this.leagues = await this.storageService.loadLeagues();
  }

  async openFilterModal() {
    const modal = await this.modalCtrl.create({
      component: FilterComponent,
      componentProps: {
        games: this.gameHistory,
        filteredGames: this.filteredGameHistory,
      },
    });

    return await modal.present();
  }

  ngOnDestroy(): void {
    this.gameSubscriptions.unsubscribe();
    this.leagueSubscriptions.unsubscribe();
    this.loadingSubscription.unsubscribe();
    this.filteredGamesSubscription.unsubscribe();
  }

  async handleRefresh(event: any): Promise<void> {
    try {
      this.hapticService.vibrate(ImpactStyle.Medium, 200);
      this.loadingService.setLoading(true);
      await this.loadGameHistory();
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
    const gotPermission = await this.excelService.exportToExcel(this.gameHistory);
    if (!gotPermission) {
      this.showPermissionDeniedAlert();
    }
  }

  async loadGameHistory(): Promise<void> {
    try {
      this.gameHistory = await this.storageService.loadGameHistory();
    } catch (error) {
      this.toastService.showToast(`Error loading history! ${error}`, 'bug', true);
    }
  }

  private subscribeToDataEvents(): void {
    this.gameSubscriptions.add(
      merge(this.storageService.newGameAdded, this.storageService.gameDeleted, this.storageService.gameEditLeague).subscribe(() => {
        this.loadGameHistory()
          .then(() => {
            this.filterService.filterGames(this.gameHistory);
          })
          .then(() => {
            this.sortUtilsService.sortGameHistoryByDate(this.gameHistory);
          })
          .catch((error) => {
            console.error('Error loading game history:', error);
          });
      })
    );

    this.filteredGamesSubscription = this.filterService.filteredGames$.subscribe((games) => {
      this.filteredGameHistory = games;
      this.sortUtilsService.sortGameHistoryByDate(this.filteredGameHistory);
      this.activeFilterCount = this.filterService.activeFilterCount;
    });

    this.leagueSubscriptions.add(
      merge(this.storageService.newLeagueAdded, this.storageService.leagueDeleted, this.storageService.leagueChanged).subscribe(() => {
        this.getLeagues();
      })
    );
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
