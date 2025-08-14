import { Component, OnInit, computed, Signal, ViewChild, ElementRef, effect, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonThumbnail,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonImg,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonButtons,
  IonIcon,
  IonModal,
  IonRow,
  IonCol,
  IonGrid,
  IonCardHeader,
  IonCardContent,
  IonCard,
  IonCardTitle,
  IonText,
  IonItemSliding,
  IonItemOption,
  IonItemOptions,
  IonChip,
  IonReorderGroup,
  IonReorder,
  IonSegment,
  IonSegmentButton,
  IonSegmentContent,
  IonSegmentView,
} from '@ionic/angular/standalone';
import { StorageService } from 'src/app/core/services/storage/storage.service';
import { Ball } from 'src/app/core/models/ball.model';
import { ToastService } from 'src/app/core/services/toast/toast.service';
import { addIcons } from 'ionicons';
import { chevronBack, add, openOutline, trashOutline, ellipsisVerticalOutline, copyOutline, swapHorizontalOutline } from 'ionicons/icons';
import { AlertController, ItemReorderCustomEvent, ModalController, ActionSheetController } from '@ionic/angular';
import { LoadingService } from 'src/app/core/services/loader/loading.service';
import { ImpactStyle } from '@capacitor/haptics';
import { HapticService } from 'src/app/core/services/haptic/haptic.service';
import { BallService } from 'src/app/core/services/ball/ball.service';
import { BallListComponent } from 'src/app/shared/components/ball-list/ball-list.component';
import { ToastMessages } from 'src/app/core/constants/toast-messages.constants';
import { BallTypeaheadComponent } from 'src/app/shared/components/ball-typeahead/ball-typeahead.component';
import { ArsenalSelectorComponent } from 'src/app/shared/components/arsenal-selector/arsenal-selector.component';
import { Chart } from 'chart.js';
import { ChartGenerationService } from 'src/app/core/services/chart/chart-generation.service';

@Component({
  selector: 'app-arsenal',
  templateUrl: './arsenal.page.html',
  styleUrls: ['./arsenal.page.scss'],
  standalone: true,
  providers: [ModalController],
  imports: [
    IonSegmentButton,
    IonSegment,
    IonReorder,
    IonReorderGroup,
    IonChip,
    IonItemOptions,
    IonItemOption,
    IonItemSliding,
    IonText,
    IonThumbnail,
    IonCardTitle,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonGrid,
    IonCol,
    IonRow,
    IonModal,
    IonIcon,
    IonButtons,
    IonButton,
    IonLabel,
    IonItem,
    IonList,
    IonImg,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    BallListComponent,
    BallTypeaheadComponent,
    ArsenalSelectorComponent,
    IonSegmentContent,
    IonSegmentView,
  ],
})
export class ArsenalPage implements OnInit {
  @ViewChild('core', { static: false }) coreModal!: IonModal;
  @ViewChild('coverstock', { static: false }) coverstockModal!: IonModal;
  coverstockBalls: Ball[] = [];
  coreBalls: Ball[] = [];
  presentingElement?: HTMLElement;
  ballsWithoutArsenal: Signal<Ball[]> = computed(() =>
    this.storageService
      .allBalls()
      .filter((ball) => !this.storageService.arsenal().some((b) => b.ball_id === ball.ball_id && b.core_weight === ball.core_weight)),
  );
  selectedSegment = model('arsenal');
  @ViewChild('balls', { static: false }) ballChart?: ElementRef;
  private ballsChartInstance: Chart | null = null;
  constructor(
    public storageService: StorageService,
    private hapticService: HapticService,
    private alertController: AlertController,
    private loadingService: LoadingService,
    public toastService: ToastService,
    public modalCtrl: ModalController,
    private ballService: BallService,
    private chartGenerationService: ChartGenerationService,
    private actionSheetController: ActionSheetController,
  ) {
    addIcons({ add, ellipsisVerticalOutline, trashOutline, chevronBack, openOutline, copyOutline, swapHorizontalOutline });
    effect(() => {
      if (this.selectedSegment() === 'compare') {
        this.generateBallDistributionChart();
      }
    });
  }

  ngOnInit() {
    this.presentingElement = document.querySelector('.ion-page')!;
  }

  async onArsenalChange(arsenalName: string): Promise<void> {
    try {
      await this.storageService.setCurrentArsenal(arsenalName);
      this.toastService.showToast(`Switched to ${arsenalName}`, 'checkmark-outline');
    } catch (error) {
      console.error('Error switching arsenal:', error);
      this.toastService.showToast('Error switching arsenal', 'bug', true);
    }
  }

  private generateBallDistributionChart(): void {
    try {
      if (!this.ballChart) {
        return;
      }
      this.ballsChartInstance = this.chartGenerationService.generateBallDistributionChart(
        this.ballChart!,
        this.storageService.arsenal(),
        this.ballsChartInstance!,
      );
    } catch (error) {
      console.error('Error generating ball distribution chart:', error);
      this.toastService.showToast(ToastMessages.chartGenerationError, 'bug', true);
    }
  }

  async removeFromArsenal(ball: Ball): Promise<void> {
    try {
      this.hapticService.vibrate(ImpactStyle.Heavy);
      const alert = await this.alertController.create({
        header: 'Confirm Deletion',
        message: `Are you sure you want to remove ${ball.ball_name} from your arsenal?`,
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
          },
          {
            text: 'Delete',
            handler: async () => {
              try {
                await this.storageService.removeFromArsenal(ball);
                this.toastService.showToast(`Ball removed from arsenal: ${ball.ball_name}`, 'checkmark-outline');
              } catch (error) {
                console.error('Error removing ball from arsenal:', error);
                this.toastService.showToast(ToastMessages.ballDeleteError, 'bug', true);
              }
            },
          },
        ],
      });

      await alert.present();
    } catch (error) {
      console.error('Error displaying removal alert:', error);
      this.toastService.showToast(ToastMessages.unexpectedError, 'warning', true);
    }
  }

  async reorderArsenal(event: ItemReorderCustomEvent): Promise<void> {
    event.detail.complete();

    const arsenal = this.storageService.arsenal();
    const [movedItem] = arsenal.splice(event.detail.from, 1);
    arsenal.splice(event.detail.to, 0, movedItem);

    arsenal.forEach((ball, idx) => (ball.position = idx + 1));

    await Promise.all(arsenal.map((ball) => this.storageService.saveBallToArsenal(ball)));
  }

  saveBallToArsenal(ball: Ball[]): void {
    // This method is now mainly for backward compatibility
    // The ball typeahead component handles arsenal selection internally
    try {
      ball.forEach(async (ball) => {
        try {
          await this.storageService.saveBallToArsenal(ball);
        } catch (error) {
          console.error(`Error saving ball ${ball.ball_name} to arsenal:`, error);
          this.toastService.showToast(`Failed to add ${ball.ball_name}.`, 'bug', true);
        }
      });

      const ball_names = ball.map((ball) => ball.ball_name).join(', ');
      this.toastService.showToast(`Balls added to arsenal: ${ball_names}`, 'checkmark-outline');
    } catch (error) {
      console.error('Error saving balls to arsenal:', error);
      this.toastService.showToast(ToastMessages.ballSaveError, 'bug', true);
    }
  }

  async showBallOptionsActionSheet(ball: Ball): Promise<void> {
    try {
      const availableArsenals = this.storageService.arsenals().filter(a => a !== this.storageService.currentArsenal());
      
      if (availableArsenals.length === 0) {
        this.toastService.showToast('No other arsenals available', 'information-circle-outline');
        return;
      }

      const actionSheet = await this.actionSheetController.create({
        header: `${ball.ball_name} Options`,
        buttons: [
          {
            text: 'Copy to Another Arsenal',
            icon: 'copy-outline',
            handler: () => {
              this.showArsenalSelection(ball, 'copy');
            }
          },
          {
            text: 'Move to Another Arsenal',
            icon: 'swap-horizontal-outline',
            handler: () => {
              this.showArsenalSelection(ball, 'move');
            }
          },
          {
            text: 'Remove from Arsenal',
            icon: 'trash-outline',
            role: 'destructive',
            handler: () => {
              this.removeFromArsenal(ball);
            }
          },
          {
            text: 'Cancel',
            icon: 'close',
            role: 'cancel'
          }
        ]
      });

      await actionSheet.present();
    } catch (error) {
      console.error('Error showing ball options:', error);
      this.toastService.showToast('Error showing options', 'bug', true);
    }
  }

  async showArsenalSelection(ball: Ball, operation: 'copy' | 'move'): Promise<void> {
    try {
      const currentArsenal = this.storageService.currentArsenal();
      const availableArsenals = this.storageService.arsenals().filter(a => a !== currentArsenal);
      
      if (availableArsenals.length === 0) {
        this.toastService.showToast('No other arsenals available', 'information-circle-outline');
        return;
      }

      const operationText = operation === 'copy' ? 'Copy' : 'Move';
      const inputs = availableArsenals.map(arsenal => ({
        name: 'arsenals',
        type: 'checkbox' as const,
        label: arsenal,
        value: arsenal
      }));

      const alert = await this.alertController.create({
        header: `${operationText} Ball`,
        message: `Select which arsenal(s) to ${operation.toLowerCase()} "${ball.ball_name}" to:`,
        inputs,
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel'
          },
          {
            text: operationText,
            handler: async (selectedArsenals: string[]) => {
              if (selectedArsenals && selectedArsenals.length > 0) {
                await this.performBallOperation(ball, selectedArsenals, operation);
              }
            }
          }
        ]
      });

      await alert.present();
    } catch (error) {
      console.error(`Error showing arsenal selection for ${operation}:`, error);
      this.toastService.showToast(`Error showing ${operation} options`, 'bug', true);
    }
  }

  async performBallOperation(ball: Ball, targetArsenals: string[], operation: 'copy' | 'move'): Promise<void> {
    try {
      const currentArsenal = this.storageService.currentArsenal();
      let successCount = 0;
      let errorCount = 0;
      const successfulArsenals: string[] = [];

      for (const targetArsenal of targetArsenals) {
        try {
          if (operation === 'copy') {
            await this.storageService.copyBallToArsenal(ball, currentArsenal, targetArsenal);
          } else {
            await this.storageService.moveBallToArsenal(ball, currentArsenal, targetArsenal);
          }
          successCount++;
          successfulArsenals.push(targetArsenal);
        } catch (error) {
          console.error(`Error ${operation}ing ball to ${targetArsenal}:`, error);
          errorCount++;
        }
      }

      // Show success message
      if (successCount > 0) {
        const operationPastTense = operation === 'copy' ? 'copied' : 'moved';
        const arsenalList = successfulArsenals.join(', ');
        const message = targetArsenals.length === 1 
          ? `Ball ${operationPastTense} to ${arsenalList}`
          : `Ball ${operationPastTense} to ${successCount} arsenal(s): ${arsenalList}`;
        this.toastService.showToast(message, 'checkmark-outline');
      }

      // Show error message if any
      if (errorCount > 0) {
        this.toastService.showToast(`Failed to ${operation} to ${errorCount} arsenal(s)`, 'bug', true);
      }

    } catch (error) {
      console.error(`Error performing ${operation} operation:`, error);
      this.toastService.showToast(`Error ${operation}ing ball`, 'bug', true);
    }
  }

  async getSameCoreBalls(ball: Ball): Promise<void> {
    try {
      this.hapticService.vibrate(ImpactStyle.Light);
      this.loadingService.setLoading(true);

      this.coreBalls = await this.ballService.getBallsByCore(ball);

      if (this.coreBalls.length > 0) {
        this.coreModal.present();
      } else {
        this.toastService.showToast(`No similar balls found for core: ${ball.core_name}.`, 'information-circle-outline');
      }
    } catch (error) {
      console.error('Error fetching core balls:', error);
      this.toastService.showToast(`Error fetching balls for core ${ball.core_name}`, 'bug', true);
    } finally {
      this.loadingService.setLoading(false);
    }
  }

  async getSameCoverstockBalls(ball: Ball): Promise<void> {
    try {
      this.hapticService.vibrate(ImpactStyle.Light);
      this.loadingService.setLoading(true);

      this.coverstockBalls = await this.ballService.getBallsByCoverstock(ball);

      if (this.coverstockBalls.length > 0) {
        await this.coverstockModal.present();
      } else {
        this.toastService.showToast(`No similar balls found for coverstock: ${ball.coverstock_name}.`, 'information-circle-outline');
      }
    } catch (error) {
      console.error('Error fetching coverstock balls:', error);
      this.toastService.showToast(`Error fetching balls for coverstock ${ball.coverstock_name}`, 'bug', true);
    } finally {
      this.loadingService.setLoading(false);
    }
  }
}
