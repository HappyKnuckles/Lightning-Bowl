import { NgFor, NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output, computed } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AlertController, SelectChangeEventDetail, ActionSheetController } from '@ionic/angular';
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
import { addOutline, medalOutline, createOutline, flagOutline } from 'ionicons/icons';
import { ToastMessages } from 'src/app/core/constants/toast-messages.constants';
import { StorageService } from 'src/app/core/services/storage/storage.service';
import { ToastService } from 'src/app/core/services/toast/toast.service';
import { League, LeagueData, isLeagueObject, EventType } from 'src/app/core/models/league.model';

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
})
export class LeagueSelectorComponent {
  @Input() isAddPage = false;
  @Output() leagueChanged = new EventEmitter<LeagueData>();

  private _selectedLeague: LeagueData | '' = '';

  @Input()
  set selectedLeague(value: LeagueData | '') {
    if (!value || value === 'new' || value === 'edit' || value === 'delete') {
      this._selectedLeague = value;
      return;
    }

    // If it's a string, try to find the corresponding League object
    if (typeof value === 'string') {
      const foundLeague = this.leagues().find((league) => this.getLeagueDisplayName(league) === value);
      this._selectedLeague = foundLeague || value;
    } else {
      this._selectedLeague = value;
    }
  }

  get selectedLeague(): LeagueData | '' {
    return this._selectedLeague;
  }

  newLeague = '';
  newLeagueEventType: EventType = 'League';
  leaguesToDelete: string[] = [];
  leagueToChange = '';
  isAddModalOpen = false;
  isEditModalOpen = false;
  selectedLeagueForEdit: LeagueData | null = null;

  isLeagueObjectType(league: LeagueData): league is League {
    return isLeagueObject(league);
  }

  getLeagueDisplayName(league: LeagueData): string {
    return this.storageService.getLeagueDisplayName(league);
  }

  getLeagueDisplayText(league: LeagueData): string {
    if (typeof league === 'string') {
      return league;
    }
    if (isLeagueObject(league)) {
      return `${league.name} (${league.event})`;
    }
    return String(league);
  }

  getLeagueValue(league: LeagueData): string {
    return this.getLeagueDisplayName(league);
  }

  getSelectedLeagueValue(): string {
    if (!this.selectedLeague) {
      return '';
    }
    return this.getLeagueDisplayName(this.selectedLeague);
  }

  setSelectedLeagueFromValue(value: string): void {
    if (!value || value === 'new' || value === 'edit' || value === 'delete') {
      this.selectedLeague = value;
      return;
    }

    const foundLeague = this.leagues().find((league) => this.getLeagueDisplayName(league) === value);
    this.selectedLeague = foundLeague || value;
  }

  getSelectLabel(): string {
    if (!this.selectedLeague) {
      return 'League/Tournament';
    }

    if (isLeagueObject(this.selectedLeague)) {
      return this.selectedLeague.event;
    }

    if (typeof this.selectedLeague === 'string') {
      const foundLeague = this.leagues().find((league) => this.getLeagueDisplayName(league) === this.selectedLeague);
      if (foundLeague && isLeagueObject(foundLeague)) {
        return foundLeague.event;
      }
    }

    return 'League/Tournament';
  }

  asLeagueObject(league: LeagueData): League {
    return league as League;
  }
  leagues = computed(() => {
    const savedLeagues = this.storageService.leagues();
    const savedJson = localStorage.getItem('leagueSelection');

    return savedLeagues.filter((league) => {
      const leagueName = this.storageService.getLeagueDisplayName(league);

      // Check Show property for League objects
      if (isLeagueObject(league) && !league.show) {
        return false;
      }

      // Check localStorage selection state
      if (savedJson) {
        const savedSelection: Record<string, boolean> = JSON.parse(savedJson);
        return savedSelection[leagueName] !== false;
      }

      return true;
    });
  });
  constructor(
    public storageService: StorageService,
    private toastService: ToastService,
    private alertController: AlertController,
    private actionSheetController: ActionSheetController,
  ) {
    // this.leagueSubscriptions.add(
    //   merge(this.storageService.newLeagueAdded, this.storageService.leagueDeleted, this.storageService.leagueChanged).subscribe(() => {
    //     this.getLeagues();
    //   })
    // );
    addIcons({ medalOutline, addOutline, createOutline, flagOutline });
  }

  onLeagueSelectionChange(event: IonSelectCustomEvent<SelectChangeEventDetail>): void {
    const selectedValue = event.detail.value;

    if (!selectedValue || selectedValue === 'new' || selectedValue === 'edit' || selectedValue === 'delete') {
      this.selectedLeague = selectedValue;
      this.leagueChanged.emit(selectedValue);
      return;
    }

    const selectedLeague = this.leagues().find((league) => this.getLeagueValue(league) === selectedValue);

    if (selectedLeague) {
      this.selectedLeague = selectedLeague;
      this.leagueChanged.emit(selectedLeague);
    } else {
      this.selectedLeague = selectedValue;
      this.leagueChanged.emit(selectedValue);
    }
  }

  async onLeagueChange(event: IonSelectCustomEvent<SelectChangeEventDetail>): Promise<void> {
    const selectedValue = event.detail.value;

    if (selectedValue === 'new') {
      this.isAddModalOpen = true;
    } else if (selectedValue === 'edit') {
      this.isEditModalOpen = true;
    } else if (selectedValue === 'delete') {
      await this.openDeleteAlert();
    }

    if (selectedValue === 'new' || selectedValue === 'edit' || selectedValue === 'delete') {
      setTimeout(() => {
        this.selectedLeague = '';
      }, 100);
    }
  }

  async saveLeague(): Promise<void> {
    try {
      const newLeagueObj: League = {
        name: this.newLeague,
        show: true,
        event: this.newLeagueEventType,
      };

      await this.storageService.addLeague(newLeagueObj);
      this.selectedLeague = newLeagueObj;
      this.leagueChanged.emit(newLeagueObj);
      this.newLeague = '';
      this.newLeagueEventType = 'League';
      this.toastService.showToast(ToastMessages.leagueSaveSuccess, 'add');
      this.isAddModalOpen = false;
    } catch (error) {
      console.error(error);
      this.toastService.showToast(ToastMessages.leagueSaveError, 'bug', true);
    }
  }

  cancelAdd(): void {
    this.newLeague = '';
    this.newLeagueEventType = 'League';
    this.selectedLeague = '';
    this.leagueChanged.emit('');
    this.isAddModalOpen = false;
  }

  cancelEdit(): void {
    this.leaguesToDelete = [];
    this.newLeague = '';
    this.leagueToChange = '';
    this.selectedLeagueForEdit = null;
    this.isEditModalOpen = false;
  }

  onLeagueToChangeSelect(): void {
    this.selectedLeagueForEdit = this.leagues().find((league) => this.getLeagueValue(league) === this.leagueToChange) || null;

    this.newLeague = this.leagueToChange;

    if (this.selectedLeagueForEdit && isLeagueObject(this.selectedLeagueForEdit)) {
      this.newLeagueEventType = this.selectedLeagueForEdit.event;
    }
  }

  async editLeague(): Promise<void> {
    try {
      if (this.selectedLeagueForEdit && isLeagueObject(this.selectedLeagueForEdit)) {
        const updatedLeague: League = {
          name: this.newLeague,
          show: this.selectedLeagueForEdit.show,
          event: this.newLeagueEventType,
        };
        await this.storageService.editLeague(updatedLeague, this.selectedLeagueForEdit);
      } else {
        await this.storageService.editLeague(this.newLeague, this.leagueToChange);
      }

      this.newLeague = '';
      this.leagueToChange = '';
      this.selectedLeagueForEdit = null;
      this.toastService.showToast(ToastMessages.leagueEditSuccess, 'checkmark-outline');
      this.isEditModalOpen = false;
    } catch (error) {
      console.error(error);
      this.toastService.showToast(ToastMessages.leagueEditError, 'bug', true);
    }
  }

  async toggleLeagueVisibility(league: LeagueData): Promise<void> {
    try {
      if (isLeagueObject(league)) {
        const updatedLeague: League = {
          ...league,
          show: !league.show,
        };
        await this.storageService.editLeague(updatedLeague, league);
        const statusText = updatedLeague.show ? 'shown' : 'hidden';
        this.toastService.showToast(`${league.name} is now ${statusText}`, updatedLeague.show ? 'eye' : 'eye-off');
      } else {
        this.toastService.showToast('Legacy leagues cannot be toggled. Please edit to update.', 'information-circle');
      }
    } catch (error) {
      console.error(error);
      this.toastService.showToast('Error toggling league visibility', 'bug', true);
    }
  }

  private async deleteLeague(): Promise<void> {
    try {
      for (const league of this.leaguesToDelete) {
        await this.storageService.deleteLeague(league);
      }
      this.toastService.showToast(ToastMessages.leagueDeleteSuccess, 'checkmark-outline');
      this.isEditModalOpen = false;
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
          const leagueName = this.getLeagueDisplayName(league);
          return {
            name: leagueName,
            type: 'checkbox' as const,
            label: leagueName,
            value: leagueName,
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

  async showLeagueManagementOptions(): Promise<void> {
    const actionSheet = await this.actionSheetController.create({
      header: 'Manage Leagues',
      buttons: [
        {
          text: 'Add League',
          handler: () => {
            this.isAddModalOpen = true;
          },
        },
        ...(this.leagues().length > 0
          ? [
              {
                text: 'Edit League',
                handler: () => {
                  this.isEditModalOpen = true;
                },
              },
              {
                text: 'Delete League',
                handler: async () => {
                  await this.openDeleteAlert();
                },
              },
            ]
          : []),
        {
          text: 'Cancel',
          role: 'cancel',
        },
      ],
    });

    await actionSheet.present();
  }

  openEditModalWithLeague(league: LeagueData): void {
    this.leagueToChange = this.getLeagueDisplayName(league);
    this.selectedLeagueForEdit = league;

    this.newLeague = this.leagueToChange;

    if (isLeagueObject(league)) {
      this.newLeagueEventType = league.event;
    } else {
      this.newLeagueEventType = 'League';
    }

    this.isEditModalOpen = true;
  }
}
