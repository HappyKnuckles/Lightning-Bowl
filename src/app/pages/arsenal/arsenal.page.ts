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
  IonInput,
  IonSelect,
  IonSelectOption,
  IonActionSheet,
} from '@ionic/angular/standalone';
import { StorageService } from 'src/app/core/services/storage/storage.service';
import { ArsenalService } from 'src/app/core/services/arsenal/arsenal.service';
import { Ball } from 'src/app/core/models/ball.model';
import { ToastService } from 'src/app/core/services/toast/toast.service';
import { addIcons } from 'ionicons';
import {
  chevronBack,
  add,
  openOutline,
  trashOutline,
  ellipsisVerticalOutline,
  copyOutline,
  swapHorizontalOutline,
  documentTextOutline,
  pricetagOutline,
  settingsOutline,
  addOutline,
  createOutline,
  chevronDown,
  checkmark,
  close,
} from 'ionicons/icons';
import { AlertController, ItemReorderCustomEvent, ModalController, ActionSheetController } from '@ionic/angular';
import { LoadingService } from 'src/app/core/services/loader/loading.service';
import { ImpactStyle } from '@capacitor/haptics';
import { HapticService } from 'src/app/core/services/haptic/haptic.service';
import { BallService } from 'src/app/core/services/ball/ball.service';
import { BallListComponent } from 'src/app/shared/components/ball-list/ball-list.component';
import { ToastMessages } from 'src/app/core/constants/toast-messages.constants';
import { GenericTypeaheadComponent } from 'src/app/shared/components/generic-typeahead/generic-typeahead.component';
import { createBallTypeaheadConfig } from 'src/app/shared/components/generic-typeahead/typeahead-configs';
import { TypeaheadConfig } from 'src/app/shared/components/generic-typeahead/typeahead-config.interface';
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
    GenericTypeaheadComponent,
    IonSegmentContent,
    IonSegmentView,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonActionSheet,
  ],
})
export class ArsenalPage implements OnInit {
  @ViewChild('core', { static: false }) coreModal!: IonModal;
  @ViewChild('coverstock', { static: false }) coverstockModal!: IonModal;
  @ViewChild('balls', { static: false }) ballChart?: ElementRef;
  coverstockBalls: Ball[] = [];
  coreBalls: Ball[] = [];
  presentingElement?: HTMLElement;
  ballTypeaheadConfig!: TypeaheadConfig<Ball>;
  ballsWithoutArsenal: Signal<Ball[]> = computed(() =>
    this.storageService
      .allBalls()
      .filter((ball) => !this.arsenalService.arsenal().some((b) => b.ball_id === ball.ball_id && b.core_weight === ball.core_weight)),
  );
  selectedSegment = model('arsenal');
  private ballsChartInstance: Chart | null = null;
  actionSheetButtons = [
    {
      text: 'Add Arsenal',
      icon: addOutline,
      handler: () => {
        this.openAddArsenalAlert();
      },
    },
    {
      text: 'Edit Arsenal',
      icon: createOutline,
      handler: () => {
        this.openEditArsenalModal();
      },
    },
    {
      text: 'Delete Arsenal',
      icon: trashOutline,
      role: 'destructive',
      handler: () => {
        this.openDeleteArsenalAlert();
      },
    },
    {
      text: 'Close',
      icon: close,
      role: 'cancel',
    },
  ];
  // Arsenal management properties
  isEditArsenalModalOpen = false;
  arsenalToEdit = '';
  newArsenalName = '';

  constructor(
    public storageService: StorageService,
    public arsenalService: ArsenalService,
    private hapticService: HapticService,
    private alertController: AlertController,
    private loadingService: LoadingService,
    public toastService: ToastService,
    public modalCtrl: ModalController,
    private ballService: BallService,
    private chartGenerationService: ChartGenerationService,
    private actionSheetController: ActionSheetController,
  ) {
    addIcons({
      add,
      ellipsisVerticalOutline,
      trashOutline,
      chevronBack,
      openOutline,
      copyOutline,
      swapHorizontalOutline,
      documentTextOutline,
      pricetagOutline,
      settingsOutline,
      addOutline,
      createOutline,
      chevronDown,
      checkmark,
      close,
    });
    effect(() => {
      if (this.selectedSegment() === 'compare') {
        this.generateBallDistributionChart();
      }
    });
  }

  ngOnInit() {
    this.presentingElement = document.querySelector('.ion-page')!;
    this.ballTypeaheadConfig = createBallTypeaheadConfig(this.storageService);
  }

  async onArsenalChange(arsenalName: string): Promise<void> {
    try {
      await this.storageService.setCurrentArsenal(arsenalName);
    } catch (error) {
      console.error('Error switching arsenal:', error);
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

  async editNotesAndTags(ball: Ball): Promise<void> {
    try {
      const currentNotes = ball.notes || '';
      const currentTags = ball.tags ? ball.tags.join(', ') : '';

      const alert = await this.alertController.create({
        header: `Edit Notes & Tags`,
        message: `Add custom notes and tags for ${ball.ball_name}`,
        inputs: [
          {
            name: 'notes',
            type: 'textarea',
            placeholder: 'Add your notes here...',
            value: currentNotes,
          },
          {
            name: 'tags',
            type: 'text',
            placeholder: 'Enter tags separated by commas...',
            value: currentTags,
          },
        ],
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
          },
          {
            text: 'Save',
            handler: async (data) => {
              try {
                const notes = data.notes?.trim() || '';
                const tagsString = data.tags?.trim() || '';
                const tags = tagsString
                  ? tagsString
                      .split(',')
                      .map((tag: string) => tag.trim())
                      .filter((tag: string) => tag.length > 0)
                  : [];

                await this.storageService.updateBallNotesAndTags(ball, notes, tags);
                this.toastService.showToast(`Notes and tags updated for ${ball.ball_name}`, 'checkmark-outline');
              } catch (error) {
                console.error('Error updating notes and tags:', error);
                this.toastService.showToast('Error updating notes and tags', 'bug', true);
              }
            },
          },
        ],
      });

      await alert.present();
    } catch (error) {
      console.error('Error showing notes and tags editor:', error);
      this.toastService.showToast('Error opening notes and tags editor', 'bug', true);
    }
  }

  async showBallOptionsActionSheet(ball: Ball): Promise<void> {
    try {
      const availableArsenals = this.storageService.arsenals().filter((a) => a !== this.storageService.currentArsenal());

      // Build the buttons array dynamically based on available arsenals
      const buttons: any[] = [
        {
          text: 'Edit Notes & Tags',
          icon: 'document-text-outline',
          handler: () => {
            this.editNotesAndTags(ball);
          },
        },
      ];

      // Only add copy and move options if there are other arsenals available
      if (availableArsenals.length > 0) {
        buttons.push(
          {
            text: 'Copy to Another Arsenal',
            icon: 'copy-outline',
            handler: () => {
              this.showArsenalSelection(ball, 'copy');
            },
          },
          {
            text: 'Move to Another Arsenal',
            icon: 'swap-horizontal-outline',
            handler: () => {
              this.showArsenalSelection(ball, 'move');
            },
          },
        );
      }

      // Always add remove option
      buttons.push(
        {
          text: 'Remove from Arsenal',
          icon: 'trash-outline',
          role: 'destructive',
          handler: () => {
            this.removeFromArsenal(ball);
          },
        },
        {
          text: 'Cancel',
          icon: 'close',
          role: 'cancel',
        },
      );

      const actionSheet = await this.actionSheetController.create({
        header: `${ball.ball_name} Options`,
        buttons,
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
      const allArsenals = this.storageService.arsenals().filter((a) => a !== currentArsenal);

      if (allArsenals.length === 0) {
        this.toastService.showToast('No other arsenals available', 'information-circle-outline');
        return;
      }

      // Filter out arsenals that already contain this ball
      const availableArsenals: string[] = [];
      for (const arsenal of allArsenals) {
        const ballExists = await this.storageService.ballExistsInArsenal(ball, arsenal);
        if (!ballExists) {
          availableArsenals.push(arsenal);
        }
      }

      if (availableArsenals.length === 0) {
        this.toastService.showToast(`${ball.ball_name} (${ball.core_weight}lbs) already exists in all other arsenals`, 'information-circle-outline');
        return;
      }

      const operationText = operation === 'copy' ? 'Copy' : 'Move';
      const inputs = availableArsenals.map((arsenal) => ({
        name: 'arsenals',
        type: 'checkbox' as const,
        label: arsenal,
        value: arsenal,
      }));

      const alert = await this.alertController.create({
        header: `${operationText} Ball`,
        message: `Select which arsenal(s) to ${operation.toLowerCase()} "${ball.ball_name}" to:`,
        inputs,
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
          },
          {
            text: operationText,
            handler: async (selectedArsenals: string[]) => {
              if (selectedArsenals && selectedArsenals.length > 0) {
                await this.performBallOperation(ball, selectedArsenals, operation);
              }
            },
          },
        ],
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
      let duplicateCount = 0;
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
          if (error instanceof Error && error.message.includes('already exists')) {
            duplicateCount++;
          } else {
            errorCount++;
          }
        }
      }

      // Show success message
      if (successCount > 0) {
        const operationPastTense = operation === 'copy' ? 'copied' : 'moved';
        const arsenalList = successfulArsenals.join(', ');
        const message =
          targetArsenals.length === 1
            ? `Ball ${operationPastTense} to ${arsenalList}`
            : `Ball ${operationPastTense} to ${successCount} arsenal(s): ${arsenalList}`;
        this.toastService.showToast(message, 'checkmark-outline');
      }

      // Show duplicate message
      if (duplicateCount > 0) {
        this.toastService.showToast(`Ball already exists in ${duplicateCount} arsenal(s)`, 'information-circle-outline');
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
  onBallSelectionChange(ballIds: string[]): void {
    const selectedBalls = this.ballsWithoutArsenal().filter((ball) => ballIds.includes(ball.ball_id));
    this.saveBallToArsenal(selectedBalls);
  }
  async openArsenalSelector(): Promise<void> {
    try {
      const availableArsenals = this.storageService.arsenals();

      // Only show selector if there are multiple arsenals
      if (availableArsenals.length <= 1) {
        return;
      }

      const currentArsenal = this.storageService.currentArsenal();

      const buttons: any[] = [];

      // Add arsenal buttons
      availableArsenals.forEach((arsenal) => {
        buttons.push({
          text: arsenal,
          cssClass: arsenal === currentArsenal ? 'action-sheet-selected' : undefined,
          handler: async () => {
            if (arsenal !== currentArsenal) {
              await this.onArsenalChange(arsenal);
            }
          },
        });
      });

      // Add cancel button
      buttons.push({
        text: 'Cancel',
        role: 'cancel',
      });

      const actionSheet = await this.actionSheetController.create({
        header: 'Select Arsenal',
        buttons,
      });

      await actionSheet.present();
    } catch (error) {
      console.error('Error showing arsenal selector:', error);
      this.toastService.showToast('Error showing arsenal selector', 'bug', true);
    }
  }

  async openAddArsenalAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Add Arsenal',
      inputs: [
        {
          name: 'arsenalName',
          type: 'text',
          placeholder: 'Arsenal name',
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Save',
          handler: async (data) => {
            if (data.arsenalName && data.arsenalName.trim()) {
              try {
                await this.storageService.addArsenal(data.arsenalName.trim());
                this.toastService.showToast(`Arsenal "${data.arsenalName.trim()}" created successfully`, 'add');
                this.modalCtrl.dismiss();
              } catch (error) {
                console.error('Error creating arsenal:', error);
                this.toastService.showToast('Error creating arsenal', 'bug', true);
              }
            }
          },
        },
      ],
    });

    await alert.present();
  }

  openEditArsenalModal(): void {
    this.isEditArsenalModalOpen = true;
    this.modalCtrl.dismiss();
  }

  cancelEditArsenal(): void {
    this.arsenalToEdit = '';
    this.newArsenalName = '';
    this.isEditArsenalModalOpen = false;
  }

  async saveEditArsenal(): Promise<void> {
    try {
      await this.storageService.editArsenal(this.newArsenalName, this.arsenalToEdit);
      this.arsenalToEdit = '';
      this.newArsenalName = '';
      this.toastService.showToast('Arsenal name updated successfully', 'checkmark-outline');
      this.isEditArsenalModalOpen = false;
    } catch (error) {
      console.error(error);
      this.toastService.showToast('Error updating arsenal name', 'bug', true);
    }
  }

  async openDeleteArsenalAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Delete Arsenal',
      message: 'Select which arsenal(s) to delete. Note: You cannot delete all arsenals.',
      inputs: this.storageService.arsenals().map((arsenal) => ({
        name: arsenal,
        type: 'checkbox' as const,
        label: arsenal,
        value: arsenal,
      })),
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Delete',
          handler: async (data) => {
            if (data && data.length > 0) {
              // Check if trying to delete all arsenals
              if (data.length >= this.storageService.arsenals().length) {
                this.toastService.showToast('Cannot delete all arsenals. At least one must remain.', 'warning', true);
                return false;
              }

              for (const arsenal of data) {
                try {
                  await this.storageService.deleteArsenal(arsenal);
                  this.toastService.showToast(`Arsenal "${arsenal}" deleted`, 'checkmark-outline');
                } catch (error) {
                  console.error(`Error deleting arsenal ${arsenal}:`, error);
                  this.toastService.showToast(`Error deleting arsenal ${arsenal}`, 'bug', true);
                }
              }
              this.modalCtrl.dismiss();
            }
            return true;
          },
        },
      ],
    });

    await alert.present();
  }
}
