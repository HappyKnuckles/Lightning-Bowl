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
} from '@ionic/angular/standalone';
import { IonSelectCustomEvent } from '@ionic/core';
import { addIcons } from 'ionicons';
import { addOutline, medalOutline, createOutline } from 'ionicons/icons';
import { ToastMessages } from 'src/app/core/constants/toast-messages.constants';
import { HiddenLeagueSelectionService } from 'src/app/core/services/hidden-league/hidden-league.service';
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
  @Output() leagueChanged = new EventEmitter<string>();
  selectedLeague = '';
  newLeague = '';
  newLeagueEventType: EventType = 'League';
  leaguesToDelete: string[] = [];
  leagueToChange = '';
  isModalOpen = false;
  
  // Helper method to check if a league is a string (legacy)
  isLegacyLeague(league: LeagueData): boolean {
    return typeof league === 'string';
  }
  
  // Helper method to check if a league is a League object
  isLeagueObjectType(league: LeagueData): league is League {
    return isLeagueObject(league);
  }
  
  // Helper method to get display name for leagues
  getLeagueDisplayName(league: LeagueData): string {
    return this.storageService.getLeagueDisplayName(league);
  }
  
  // Helper method to get league value for form binding
  getLeagueValue(league: LeagueData): string {
    // For form binding, we always use the league name
    return this.getLeagueDisplayName(league);
  }
  
  // Helper method to get League object (with type assertion)
  asLeagueObject(league: LeagueData): League {
    return league as League;
  }
  leagues = computed(() => {
    const savedLeagues = this.storageService.leagues();
    this.hiddenLeagueSelectionService.selectionState();
    const savedJson = localStorage.getItem('leagueSelection');
    
    return savedLeagues.filter((league) => {
      const leagueName = this.storageService.getLeagueDisplayName(league);
      
      // Check Show property for League objects
      if (isLeagueObject(league) && !league.Show) {
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
      this.isModalOpen = true;
    } else if (event.detail.value === 'delete') {
      await this.openDeleteAlert();
    }
  }

  async saveLeague(): Promise<void> {
    try {
      // Create new League object with all required properties
      const newLeagueObj: League = {
        Name: this.newLeague,
        Show: true, // Default to visible
        Event: this.newLeagueEventType
      };
      
      await this.storageService.addLeague(newLeagueObj);
      this.selectedLeague = this.newLeague;
      this.leagueChanged.emit(this.selectedLeague);
      this.newLeague = '';
      this.newLeagueEventType = 'League';
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

  // Method to toggle the Show property of a league
  async toggleLeagueVisibility(league: LeagueData): Promise<void> {
    try {
      if (isLeagueObject(league)) {
        // Create updated league with toggled Show property
        const updatedLeague: League = {
          ...league,
          Show: !league.Show
        };
        await this.storageService.editLeague(updatedLeague, league);
        const statusText = updatedLeague.Show ? 'shown' : 'hidden';
        this.toastService.showToast(`${league.Name} is now ${statusText}`, updatedLeague.Show ? 'eye' : 'eye-off');
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

  private async openAddAlert(): Promise<void> {
    await this.alertController
      .create({
        header: 'Add League/Tournament',
        message: 'Enter the league information',
        inputs: [
          {
            name: 'league',
            type: 'text',
            placeholder: 'League name',
            cssClass: 'league-alert-input',
          },
          {
            name: 'eventType',
            type: 'radio',
            label: 'League',
            value: 'League',
            checked: true,
          },
          {
            name: 'eventType', 
            type: 'radio',
            label: 'Tournament',
            value: 'Tournament',
            checked: false,
          },
        ],
        cssClass: 'league-alert-class',
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => {
              this.selectedLeague = '';
              this.leagueChanged.emit(this.selectedLeague);
            },
          },
          {
            text: 'Add',
            handler: async (data) => {
              this.newLeague = data.league;
              this.newLeagueEventType = data.eventType || 'League';
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
