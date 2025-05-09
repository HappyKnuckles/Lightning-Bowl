import { NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, model, output, signal } from '@angular/core';
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
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeagueSelectorComponent {
  isAddPage = input.required<boolean>();
  leagueChanged = output<string>();
  selectedLeague = model<string>('');
  newLeague = model<string>('');
  leaguesToDelete: string[] = [];
  leagueToChange = model<string>('');
  isModalOpen = signal(false);
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

  async onLeagueChange(event: IonSelectCustomEvent<SelectChangeEventDetail>): Promise<void> {
    if (event.detail.value === 'new') {
      await this.openAddAlert();
    } else if (event.detail.value === 'edit') {
      this.isModalOpen.set(true);
    } else if (event.detail.value === 'delete') {
      await this.openDeleteAlert();
    }
  }

  async saveLeague(): Promise<void> {
    try {
      await this.storageService.addLeague(this.newLeague());
      this.selectedLeague.set(this.newLeague());
      this.leagueChanged.emit(this.selectedLeague());
      this.newLeague.set('');
      this.toastService.showToast(ToastMessages.leagueSaveSuccess, 'add');
      this.isModalOpen.set(false);
    } catch (error) {
      console.error(error);
      this.toastService.showToast(ToastMessages.leagueSaveError, 'bug', true);
    }
  }

  cancel(): void {
    this.leaguesToDelete = [];
    this.isModalOpen.set(false);
  }

  async editLeague(): Promise<void> {
    try {
      await this.storageService.editLeague(this.newLeague(), this.leagueToChange());
      this.newLeague.set('');
      this.leagueToChange.set('');
      this.toastService.showToast(ToastMessages.leagueEditSuccess, 'checkmark-outline');
      this.isModalOpen.set(false);
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
      this.isModalOpen.set(false);
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
              this.selectedLeague.set('');
              this.leagueChanged.emit(this.selectedLeague());
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
