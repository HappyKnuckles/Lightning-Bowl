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
} from 'ionicons/icons';
import { NgIf, DatePipe } from '@angular/common';
import { ImpactStyle } from '@capacitor/haptics';
import { HapticService } from 'src/app/services/haptic/haptic.service';
import { LoadingService } from 'src/app/services/loader/loading.service';
import { ToastService } from 'src/app/services/toast/toast.service';
import { ModalController, RefresherCustomEvent } from '@ionic/angular';
import { StorageService } from 'src/app/services/storage/storage.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GameComponent } from 'src/app/components/game/game.component';
import { ExcelService } from 'src/app/services/excel/excel.service';
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
export class HistoryPage {
  @ViewChild('accordionGroup') accordionGroup!: IonAccordionGroup;
  file!: File;
  constructor(
    private alertController: AlertController,
    private toastService: ToastService,
    public storageService: StorageService,
    public loadingService: LoadingService,
    private hapticService: HapticService,
    private modalCtrl: ModalController,
    public gameFilterService: GameFilterService,
    private excelService: ExcelService,
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

  async openFilterModal() {
    const modal = await this.modalCtrl.create({
      component: GameFilterComponent,
    });

    return await modal.present();
  }

  async handleRefresh(event: RefresherCustomEvent): Promise<void> {
    try {
      this.hapticService.vibrate(ImpactStyle.Medium, 200);
      await this.storageService.loadGameHistory();
    } catch (error) {
      console.error(error);
    } finally {
      event.target.complete();
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
