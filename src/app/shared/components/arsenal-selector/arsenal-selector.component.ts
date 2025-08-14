import { Component, EventEmitter, Input, Output, computed } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  IonContent,
  IonTitle,
  IonHeader,
  IonButtons,
  IonToolbar,
  IonModal,
  IonIcon,
  IonItem,
  IonButton,
  IonInput,
  IonSelect,
  IonSelectOption,
  SelectChangeEventDetail,
} from '@ionic/angular/standalone';
import { IonSelectCustomEvent } from '@ionic/core';
import { StorageService } from 'src/app/core/services/storage/storage.service';
import { ToastService } from 'src/app/core/services/toast/toast.service';
import { AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { list, addOutline, createOutline } from 'ionicons/icons';

@Component({
  selector: 'app-arsenal-selector',
  templateUrl: './arsenal-selector.component.html',
  styleUrls: ['./arsenal-selector.component.scss'],
  imports: [
    IonContent,
    IonTitle,
    IonHeader,
    IonButtons,
    IonToolbar,
    IonModal,
    IonIcon,
    IonItem,
    IonButton,
    IonInput,
    IonSelect,
    NgIf,
    NgFor,
    FormsModule,
    ReactiveFormsModule,
    IonSelectOption,
  ],
  standalone: true,
})
export class ArsenalSelectorComponent {
  @Input() isSelectionMode = false;
  @Output() arsenalChanged = new EventEmitter<string>();
  selectedArsenal = '';
  newArsenal = '';
  arsenalsToDelete: string[] = [];
  arsenalToChange = '';
  isModalOpen = false;
  arsenals = computed(() => {
    return this.storageService.arsenals();
  });

  constructor(
    public storageService: StorageService,
    private toastService: ToastService,
    private alertController: AlertController,
  ) {
    addIcons({ list, addOutline, createOutline });
    // Set initial selected arsenal to current arsenal
    this.selectedArsenal = this.storageService.currentArsenal();
  }

  async onArsenalChange(event: IonSelectCustomEvent<SelectChangeEventDetail>): Promise<void> {
    if (event.detail.value === 'new') {
      await this.openAddAlert();
    } else if (event.detail.value === 'edit') {
      this.isModalOpen = true;
    } else if (event.detail.value === 'delete') {
      await this.openDeleteAlert();
    } else if (typeof event.detail.value === 'string') {
      // Arsenal selection
      this.selectedArsenal = event.detail.value;
      this.arsenalChanged.emit(event.detail.value);
    }
  }

  async saveArsenal(): Promise<void> {
    try {
      await this.storageService.addArsenal(this.newArsenal);
      this.selectedArsenal = this.newArsenal;
      this.arsenalChanged.emit(this.selectedArsenal);
      this.newArsenal = '';
      this.toastService.showToast(`Arsenal "${this.selectedArsenal}" created successfully`, 'add');
      this.isModalOpen = false;
    } catch (error) {
      console.error(error);
      this.toastService.showToast('Error creating arsenal', 'bug', true);
    }
  }

  cancel(): void {
    this.arsenalsToDelete = [];
    this.isModalOpen = false;
  }

  async editArsenal(): Promise<void> {
    try {
      await this.storageService.editArsenal(this.newArsenal, this.arsenalToChange);
      this.newArsenal = '';
      this.arsenalToChange = '';
      this.toastService.showToast('Arsenal name updated successfully', 'checkmark-outline');
      this.isModalOpen = false;
    } catch (error) {
      console.error(error);
      this.toastService.showToast('Error updating arsenal name', 'bug', true);
    }
  }

  private async openAddAlert(): Promise<void> {
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
                this.selectedArsenal = data.arsenalName.trim();
                this.arsenalChanged.emit(this.selectedArsenal);
                this.toastService.showToast(`Arsenal "${data.arsenalName.trim()}" created successfully`, 'add');
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

  private async openDeleteAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Delete Arsenal',
      inputs: this.arsenals().map((arsenal) => ({
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
              for (const arsenal of data) {
                try {
                  await this.storageService.deleteArsenal(arsenal);
                  this.toastService.showToast(`Arsenal "${arsenal}" deleted`, 'checkmark-outline');
                } catch (error) {
                  console.error(`Error deleting arsenal ${arsenal}:`, error);
                  this.toastService.showToast(`Error deleting arsenal ${arsenal}`, 'bug', true);
                }
              }
            }
          },
        },
      ],
    });

    await alert.present();
  }
}