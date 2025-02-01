import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonButtons,
  IonToolbar,
  IonItem,
  IonButton,
  IonInput,
  IonLabel,
  IonDatetimeButton,
  IonDatetime,
  IonModal,
  IonToggle,
  IonFooter,
  IonSelectOption,
  IonSelect,
  IonList,
} from '@ionic/angular/standalone';
import { TimeRange } from 'src/app/models/filter.model';
import { Game } from 'src/app/models/game.model';
import { GameFilterService } from 'src/app/services/game-filter/game-filter.service';
import { SortUtilsService } from 'src/app/services/sort-utils/sort-utils.service';
import { StorageService } from 'src/app/services/storage/storage.service';
import { UtilsService } from 'src/app/services/utils/utils.service';

@Component({
  selector: 'app-game-filter',
  templateUrl: './game-filter.component.html',
  styleUrls: ['./game-filter.component.scss'],
  standalone: true,
  imports: [
    IonList,
    IonFooter,
    IonToggle,
    IonModal,
    IonDatetime,
    IonDatetimeButton,
    IonLabel,
    IonInput,
    IonButton,
    IonItem,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonSelect,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    IonSelectOption,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class GameFilterComponent implements OnInit {
  @Input({ required: true }) games!: Game[];
  @Input() filteredGames!: Game[];
  filters = this.filterService.filters;
  defaultFilters = this.filterService.defaultFilters;
  highlightedDates: { date: string; textColor: string; backgroundColor: string }[] = [];
  leagues: string[] = [];

  constructor(
    private modalCtrl: ModalController,
    private filterService: GameFilterService,
    private sortUtilsService: SortUtilsService,
    public storageService: StorageService,
    private utilsService: UtilsService
  ) {}

  ngOnInit(): void {
    if (!this.filterService.filters().startDate && !this.filterService.filters().endDate) {
      this.filterService.filters().startDate = new Date(this.games[this.games.length - 1].date).toISOString() || Date.now().toString();
      this.filterService.filters().endDate = new Date(this.games[0].date).toISOString() || Date.now().toString();
    }
    this.getHighlightedDates();
    this.getLeagues();
  }

  startDateChange(event: CustomEvent): void {
    const now = new Date(Date.now());
    switch (event.detail.value) {
      case TimeRange.TODAY:
        this.filters().startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        break;
      case TimeRange.WEEK:
        this.filters().startDate = new Date(now.setDate(now.getDate() - 7)).toISOString();
        break;
      case TimeRange.MONTH:
        this.filters().startDate = new Date(now.setMonth(now.getMonth() - 1)).toISOString();
        break;
      case TimeRange.QUARTER:
        this.filters().startDate = new Date(now.setMonth(now.getMonth() - 3)).toISOString();
        break;
      case TimeRange.HALF:
        this.filters().startDate = new Date(now.setMonth(now.getMonth() - 6)).toISOString();
        break;
      case TimeRange.YEAR:
        this.filters().startDate = new Date(now.setFullYear(now.getFullYear() - 1)).toISOString();
        break;
      case TimeRange.ALL:
      default:
        this.filters().startDate = this.defaultFilters.startDate;
        break;
    }
  }

  handleSelect(event: CustomEvent): void {
    if (event.detail.value.includes('all')) {
      this.filters().leagues = ['all'];
    }
    // else if (event.detail.value.includes('')) {
    //   this.filters.league = [''];
    // }
  }

  cancel(): Promise<boolean> {
    this.filterService.filters.update(() =>
      localStorage.getItem('filter') ? JSON.parse(localStorage.getItem('filter')!) : this.filterService.filters
    );
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  reset(): void {
    this.filterService.resetFilters();
  }

  confirm(): Promise<boolean> {
    this.filterService.filterGames(this.games);
    this.getHighlightedDates();
    return this.modalCtrl.dismiss('confirm');
  }

  updateStart(event: CustomEvent): void {
    this.filterService.filters().startDate = event.detail.value!;
  }

  updateEnd(event: CustomEvent): void {
    this.filterService.filters().endDate = event.detail.value!;
  }

  private getLeagues(): void {
    const gamesByLeague = this.sortUtilsService.sortGamesByLeagues(this.games, false);
    this.leagues = Object.keys(gamesByLeague);
  }

  private getHighlightedDates(): void {
    const textColor = '#000000';
    const rootStyles = getComputedStyle(document.documentElement);
    const backgroundColor = rootStyles.getPropertyValue('--ion-color-primary').trim();
    // TODO Think if using it like this so highlighted dates are only that match the current filter or not
    // maybe make days that are in current filter a different color as well
    this.highlightedDates = this.games.map((game) => {
      const date = new Date(game.date);
      const formattedDate = this.utilsService.transformDate(date);
      return {
        date: formattedDate,
        textColor: textColor,
        backgroundColor: backgroundColor,
      };
    });
  }
}
