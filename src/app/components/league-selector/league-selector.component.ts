import { NgFor, NgIf } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
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
import { merge, Subscription } from 'rxjs';
import { StorageService } from 'src/app/services/storage/storage.service';
import { ToastService } from 'src/app/services/toast/toast.service';

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
export class LeagueSelectorComponent implements OnInit, OnDestroy {
  @Input() isAddPage: boolean = false;
  @Output() leagueChanged = new EventEmitter<string>();
  leagues: string[] = [];
  selectedLeague: string = '';
  newLeague: string = '';
  leaguesToDelete: string[] = [];
  leagueToChange: string = '';
  private leagueSubscriptions: Subscription = new Subscription();
  isModalOpen: boolean = false;

  constructor(private storageService: StorageService, private toastService: ToastService, private alertController: AlertController) {
    this.leagueSubscriptions.add(
      merge(this.storageService.newLeagueAdded, this.storageService.leagueDeleted, this.storageService.leagueChanged).subscribe(() => {
        this.getLeagues();
      })
    );
    addIcons({ medalOutline, addOutline, createOutline });
  }

  ngOnDestroy(): void {
    this.leagueSubscriptions.unsubscribe();
  }

  async ngOnInit(): Promise<void> {
    await this.getLeagues();
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
    const key = 'league' + '_' + this.newLeague;
    await this.storageService.addLeague(key, this.newLeague);
    this.selectedLeague = this.newLeague;
    this.leagueChanged.emit(this.selectedLeague);
    this.newLeague = '';
    this.toastService.showToast('League saved sucessfully.', 'add');
    this.isModalOpen = false;
  }

  cancel(): void {
    this.leaguesToDelete = [];
    this.isModalOpen = false;
  }

  async editLeague(): Promise<void> {
    const key = 'league' + '_' + this.newLeague;
    await this.storageService.editLeague(key, this.newLeague, this.leagueToChange);
    this.newLeague = '';
    this.leagueToChange = '';
    this.toastService.showToast('League edited sucessfully.', 'checkmark-outline');
    this.isModalOpen = false;
  }

  private async getLeagues(): Promise<void> {
    this.leagues = await this.storageService.loadLeagues();
  }

  private async deleteLeague(): Promise<void> {
    for (const league of this.leaguesToDelete) {
      await this.storageService.deleteLeague('league' + '_' + league);
    }
    this.toastService.showToast('League deleted sucessfully.', 'checkmark-outline');
    this.isModalOpen = false;
  }

  private async openDeleteAlert(): Promise<void> {
    await this.alertController
      .create({
        header: 'Delete League',
        message: 'Select the leagues to delete',
        inputs: this.leagues.map((league) => {
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
              this.leagueChanged.emit(this.selectedLeague);
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
