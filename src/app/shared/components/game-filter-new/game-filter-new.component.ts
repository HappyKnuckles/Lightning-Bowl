import { CommonModule } from '@angular/common';
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, Input, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { GameFilter, TimeRange } from 'src/app/core/models/filter.model';
import { Game } from 'src/app/core/models/game.model';
import { GameFilterService } from 'src/app/core/services/game-filter/game-filter.service';
import { SortUtilsService } from 'src/app/core/services/sort-utils/sort-utils.service';
import { StorageService } from 'src/app/core/services/storage/storage.service';
import { UtilsService } from 'src/app/core/services/utils/utils.service';
import { GenericFilterComponent } from '../generic-filter/generic-filter.component';

@Component({
  selector: 'app-game-filter-new',
  templateUrl: './game-filter-new.component.html',
  styleUrls: ['./game-filter-new.component.scss'],
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
    GenericFilterComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class GameFilterNewComponent implements OnInit {
  @Input() filteredGames!: Game[];
  defaultFilters = this.gameFilterService.defaultFilters;
  highlightedDates: { date: string; textColor: string; backgroundColor: string }[] = [];
  leagues: string[] = [];
  patterns = computed<string[]>(() => {
    return this.storageService
      .games()
      .map((game) => game.patterns)
      .flat()
      .filter((pattern, index, self) => pattern && self.indexOf(pattern) === index);
  });

  constructor(
    public gameFilterService: GameFilterService,
    private sortUtilsService: SortUtilsService,
    public storageService: StorageService,
    private utilsService: UtilsService,
  ) {}

  ngOnInit(): void {
    if (!this.gameFilterService.filters().startDate && !this.gameFilterService.filters().endDate) {
      this.gameFilterService.filters.update((filters) => ({
        ...filters,
        startDate: new Date(this.storageService.games()[this.storageService.games().length - 1].date).toISOString() || Date.now().toString(),
        endDate: new Date(this.storageService.games()[0].date).toISOString() || Date.now().toString(),
      }));
    }
    this.getHighlightedDates();
    this.getLeagues();
  }

  startDateChange(event: CustomEvent): void {
    const now = new Date(Date.now());
    let newStartDate: string;
    switch (event.detail.value) {
      case TimeRange.TODAY:
        newStartDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        break;
      case TimeRange.WEEK:
        newStartDate = new Date(now.setDate(now.getDate() - 7)).toISOString();
        break;
      case TimeRange.MONTH:
        newStartDate = new Date(now.setMonth(now.getMonth() - 1)).toISOString();
        break;
      case TimeRange.QUARTER:
        newStartDate = new Date(now.setMonth(now.getMonth() - 3)).toISOString();
        break;
      case TimeRange.HALF:
        newStartDate = new Date(now.setMonth(now.getMonth() - 6)).toISOString();
        break;
      case TimeRange.YEAR:
        newStartDate = new Date(now.setFullYear(now.getFullYear() - 1)).toISOString();
        break;
      case TimeRange.ALL:
      default:
        newStartDate = this.defaultFilters.startDate!;
        break;
    }
    this.gameFilterService.filters.update((filters) => ({ ...filters, startDate: newStartDate, timeRange: event.detail.value }));
  }

  handleSelect(event: CustomEvent): void {
    if (event.detail.value.includes('all')) {
      this.gameFilterService.filters.update((filters) => ({ ...filters, leagues: ['all'] }));
    }
  }

  updateFilter<T extends keyof GameFilter>(key: T, value: unknown): void {
    this.gameFilterService.filters.update((filters) => ({ ...filters, [key]: value }));
  }

  private getLeagues(): void {
    const gamesByLeague = this.sortUtilsService.sortGamesByLeagues(this.storageService.games(), false);
    this.leagues = Object.keys(gamesByLeague);
  }

  private getHighlightedDates(): void {
    const textColor = '#000000';
    const rootStyles = getComputedStyle(document.documentElement);
    const backgroundColor = rootStyles.getPropertyValue('--ion-color-primary').trim();
    this.highlightedDates = this.storageService.games().map((game) => {
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