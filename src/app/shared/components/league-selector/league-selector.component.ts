import { NgFor, NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output, computed } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AlertController, SelectChangeEventDetail } from '@ionic/angular';
import {
  IonSelect,
  IonInput,
  IonButton,
  IonSelectOption,
  IonItem,
  IonIcon,
  IonModal,
  IonToolbar,
  IonButtons,
  IonHeader,
  IonTitle,
  IonContent,
  IonRadio,
  IonRadioGroup,
  IonLabel,
} from '@ionic/angular/standalone';
import { IonSelectCustomEvent } from '@ionic/core';
import { addIcons } from 'ionicons';
import { addOutline, medalOutline, createOutline } from 'ionicons/icons';
import { ToastMessages } from 'src/app/core/constants/toast-messages.constants';
import { HiddenLeagueSelectionService } from 'src/app/core/services/hidden-league/hidden-league.service';
import { StorageService } from 'src/app/core/services/storage/storage.service';
import { ToastService } from 'src/app/core/services/toast/toast.service';

@Component({
  selector: 'app-league-selector',
  templateUrl: './league-selector.component.html',
  styleUrls: ['./league-selector.component.scss'],
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
    IonRadio,
    IonRadioGroup,
    IonLabel,
  ],
  standalone: true,
})
export class LeagueSelectorComponent {
  @Input() isAddPage = false;
  @Output() leagueChanged = new EventEmitter<{league: string, type: 'League' | 'Tournament'}>();
  selectedLeague = '';
  selectedLeagueType: 'League' | 'Tournament' = 'League';
  newLeague = '';
  leaguesToDelete: string[] = [];
  leagueToChange = '';
  isModalOpen = false;
  leagues = computed(() => {
    const savedLeagues = this.storageService.leagues();
    this.hiddenLeagueSelectionService.selectionState();
    const savedJson = localStorage.getItem('leagueSelection');
    if (!savedJson) {
      return savedLeagues;
    }
    const savedSelection: Record<string, boolean> = savedJson ? JSON.parse(savedJson) : {};
    return savedLeagues.filter((league) => {
      return savedSelection[league] !== false;
    });
  });
  constructor(
    public storageService: StorageService,
    private toastService: ToastService,
    private alertController: AlertController,
    private hiddenLeagueSelectionService: HiddenLeagueSelectionService,
  ) {
    // this.leagueSubscriptions.add(
    //   merge(this.storageService.newLeagueAdded, this.storageService.leagueDeleted, this.storageService.leagueChanged).subscribe(() => {
    //     this.getLeagues();
    //   })
    // );
    addIcons({ medalOutline, addOutline, createOutline });
  }

  onLeagueTypeChange(): void {
    this.emitLeagueChange();
  }

  onLeagueSelected(): void {
    this.emitLeagueChange();
  }

  private emitLeagueChange(): void {
    this.leagueChanged.emit({
      league: this.selectedLeague,
      type: this.selectedLeagueType
    });
  }

  async onLeagueChange(event: IonSelectCustomEvent<SelectChangeEventDetail>): Promise<void> {
    if (event.detail.value === 'new') {
      await this.openAddAlert();
    } else if (event.detail.value === 'edit') {
      this.isModalOpen = true;
    } else if (event.detail.value === 'delete') {
      await this.openDeleteAlert();
    }
  }

  async saveLeague(): Promise<void> {
    try {
      await this.storageService.addLeague(this.newLeague);
      this.selectedLeague = this.newLeague;
      this.emitLeagueChange();
      this.newLeague = '';
      this.toastService.showToast(ToastMessages.leagueSaveSuccess, 'add');
      this.isModalOpen = false;
    } catch (error) {
      console.error(error);
      this.toastService.showToast(ToastMessages.leagueSaveError, 'bug', true);
    }
  }

  cancel(): void {
    this.leaguesToDelete = [];
    this.isModalOpen = false;
  }

  async editLeague(): Promise<void> {
    try {
      await this.storageService.editLeague(this.newLeague, this.leagueToChange);
      this.newLeague = '';
      this.leagueToChange = '';
      this.toastService.showToast(ToastMessages.leagueEditSuccess, 'checkmark-outline');
      this.isModalOpen = false;
    } catch (error) {
      console.error(error);
      this.toastService.showToast(ToastMessages.leagueEditError, 'bug', true);
    }
  }

  private async deleteLeague(): Promise<void> {
    try {
      for (const league of this.leaguesToDelete) {
        await this.storageService.deleteLeague(league);
      }
      this.toastService.showToast(ToastMessages.leagueDeleteSuccess, 'checkmark-outline');
      this.isModalOpen = false;
    } catch (error) {
      console.error(error);
      this.toastService.showToast(ToastMessages.leagueDeleteError, 'bug', true);
    }
  }

  private async openDeleteAlert(): Promise<void> {
    await this.alertController
      .create({
        header: 'Delete League',
        message: 'Select the leagues to delete',
        inputs: this.storageService.leagues().map((league) => {
          return {
            name: league,
            type: 'checkbox',
            label: league,
            value: league,
          };
        }),
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
          },
          {
            text: 'Delete',
            handler: async (data: string[]) => {
              this.leaguesToDelete = data;
              await this.deleteLeague();
            },
          },
        ],
      })
      .then((alert) => {
        alert.present();
      });
  }

  private async openAddAlert(): Promise<void> {
    await this.alertController
      .create({
        header: 'Add League',
        message: 'Enter the league name',
        inputs: [
          {
            name: 'league',
            type: 'text',
            placeholder: 'League name',
            cssClass: 'league-alert-input',
          },
        ],
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => {
              this.selectedLeague = '';
              this.emitLeagueChange();
            },
          },
          {
            text: 'Add',
            handler: async (data) => {
              this.newLeague = data.league;
              await this.saveLeague();
            },
          },
        ],
      })
      .then((alert) => {
        alert.present();
      });
  }
}
