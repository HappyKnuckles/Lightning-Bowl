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

  isLegacyLeague(league: LeagueData): boolean {
    return typeof league === 'string';
  }

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

    // Handle special cases
    if (!selectedValue || selectedValue === 'new' || selectedValue === 'edit' || selectedValue === 'delete') {
      this.selectedLeague = selectedValue;
      this.leagueChanged.emit(selectedValue);
      return;
    }

    // Find the actual League object based on selected value
    const selectedLeague = this.leagues().find((league) => this.getLeagueValue(league) === selectedValue);

    if (selectedLeague) {
      this.selectedLeague = selectedLeague;
      this.leagueChanged.emit(selectedLeague);
    } else {
      // Fallback to string if league not found
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

    // Reset the select to empty after handling management actions
    if (selectedValue === 'new' || selectedValue === 'edit' || selectedValue === 'delete') {
      // Don't update selectedLeague for management actions
      setTimeout(() => {
        // Reset the select value after the action
        this.selectedLeague = '';
      }, 100);
    }
  }

  async saveLeague(): Promise<void> {
    try {
      // Create new League object with all required properties
      const newLeagueObj: League = {
        name: this.newLeague,
        show: true, // Default to visible
        event: this.newLeagueEventType,
      };

      await this.storageService.addLeague(newLeagueObj);
      this.selectedLeague = newLeagueObj;
      this.leagueChanged.emit(newLeagueObj); // Emit the new League object
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
    this.leagueChanged.emit(''); // Emit empty string for no selection
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
    // Find the selected league object
    this.selectedLeagueForEdit = this.leagues().find((league) => this.getLeagueValue(league) === this.leagueToChange) || null;

    // Set the new league name to the current name
    this.newLeague = this.leagueToChange;

    // If it's a League object, set the event type
    if (this.selectedLeagueForEdit && isLeagueObject(this.selectedLeagueForEdit)) {
      this.newLeagueEventType = this.selectedLeagueForEdit.event;
    }
  }

  async editLeague(): Promise<void> {
    try {
      if (this.selectedLeagueForEdit && isLeagueObject(this.selectedLeagueForEdit)) {
        // Create updated League object with new name and event type
        const updatedLeague: League = {
          name: this.newLeague,
          show: this.selectedLeagueForEdit.show, // Preserve show setting
          event: this.newLeagueEventType,
        };
        await this.storageService.editLeague(updatedLeague, this.selectedLeagueForEdit);
      } else {
        // For legacy string leagues, convert to string editing
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

  // Method to toggle the Show property of a league
  async toggleLeagueVisibility(league: LeagueData): Promise<void> {
    try {
      if (isLeagueObject(league)) {
        // Create updated league with toggled show property
        const updatedLeague: League = {
          ...league,
          show: !league.show,
        };
        await this.storageService.editLeague(updatedLeague, league);
        const statusText = updatedLeague.show ? 'shown' : 'hidden';
        this.toastService.showToast(`${league.name} is now ${statusText}`, updatedLeague.show ? 'eye' : 'eye-off');
      } else {
        // For legacy string leagues, we can't toggle Show property directly
        // This would need to be converted to League object first
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

  // Method to programmatically trigger league management action sheet
  async showLeagueManagementOptions(): Promise<void> {
    // Create an action sheet with the same options as the select
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

  // Method to programmatically open edit modal with specific league
  openEditModalWithLeague(league: LeagueData): void {
    // Set the league to change to the display name of the provided league
    this.leagueToChange = this.getLeagueDisplayName(league);
    this.selectedLeagueForEdit = league;

    // Set the new league name to the current name
    this.newLeague = this.leagueToChange;

    // If it's a League object, set the event type
    if (isLeagueObject(league)) {
      this.newLeagueEventType = league.event;
    } else {
      this.newLeagueEventType = 'League'; // Default for legacy leagues
    }

    // Open the edit modal
    this.isEditModalOpen = true;
  }
}
