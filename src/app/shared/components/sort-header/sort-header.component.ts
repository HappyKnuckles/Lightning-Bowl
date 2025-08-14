import { Component, Input, Output, EventEmitter, OnInit, model, ViewChild, ElementRef } from '@angular/core';
import { IonButton, IonIcon, IonPopover, IonList, IonItem, IonLabel, IonRadioGroup, IonRadio } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { swapVertical } from 'ionicons/icons';
import { SortOption, BallSortField, PatternSortField, GameSortField } from 'src/app/core/models/sort.model';

@Component({
  selector: 'app-sort-header',
  templateUrl: './sort-header.component.html',
  styleUrls: ['./sort-header.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonButton, IonIcon, IonPopover, IonList, IonItem, IonLabel, IonRadioGroup, IonRadio],
})
export class SortHeaderComponent implements OnInit {
  sortOptions = model.required<SortOption<BallSortField | PatternSortField | GameSortField>[]>();
  selectedSort = model.required<SortOption<BallSortField | PatternSortField | GameSortField>>();
  id = model.required<string>();
  @Input() storageKey = '';
  @Output() sortChanged = new EventEmitter<SortOption<BallSortField | PatternSortField | GameSortField>>();

  @ViewChild('sortPopover') sortPopover!: IonPopover;
  @ViewChild('sortList', { read: ElementRef }) sortListRef!: ElementRef<HTMLIonListElement>;

  selectedSortKey = '';

  constructor() {
    addIcons({ swapVertical });
  }

  ngOnInit() {
    this.loadSortFromStorage();
    this.updateSelectedSortKey();
  }

  private loadSortFromStorage() {
    if (this.storageKey && typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        try {
          const parsedSort = JSON.parse(saved);
          // Find matching option in available sortOptions
          const matchingOption = this.sortOptions().find((option) => option.field === parsedSort.field && option.direction === parsedSort.direction);
          if (matchingOption) {
            this.selectedSort.set(matchingOption);
            // Emit the loaded sort option to parent component
            setTimeout(() => {
              this.sortChanged.emit(matchingOption);
            });
          }
        } catch (error) {
          // If parsing fails, ignore and use default
          console.warn('Failed to parse saved sort option:', error);
        }
      }
    }
  }

  private saveSortToStorage(sortOption: SortOption<BallSortField | PatternSortField | GameSortField>) {
    if (this.storageKey && typeof localStorage !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(sortOption));
    }
  }

  private updateSelectedSortKey() {
    if (this.selectedSort()) {
      this.selectedSortKey = `${this.selectedSort().field}_${this.selectedSort().direction}`;
    }
  }

  selectOption(option: SortOption<BallSortField | PatternSortField | GameSortField>) {
    this.selectedSort.set(option);
    this.selectedSortKey = `${option.field}_${option.direction}`;
    this.saveSortToStorage(option);
    this.sortChanged.emit(option);
  }

  onSortChange(selectedKey: string) {
    const selectedOption = this.sortOptions().find((option) => `${option.field}_${option.direction}` === selectedKey);

    if (selectedOption) {
      this.selectedSort.set(selectedOption);
      this.selectedSortKey = selectedKey;
      this.saveSortToStorage(selectedOption);
      this.sortChanged.emit(selectedOption);
    }
  }

  getSortKey(option: SortOption<BallSortField | PatternSortField | GameSortField>): string {
    return `${option.field}_${option.direction}`;
  }

  onPopoverWillPresent() {
    // Use setTimeout to ensure the popover content is rendered
    setTimeout(() => {
      this.scrollToSelectedItem();
    }, 100);
  }

  private scrollToSelectedItem() {
    if (!this.sortListRef || !this.selectedSortKey) {
      return;
    }

    try {
      const listElement = this.sortListRef.nativeElement;
      const selectedItem = listElement.querySelector(`ion-item:has(ion-radio[value="${this.selectedSortKey}"])`);
      
      if (selectedItem) {
        selectedItem.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    } catch (error) {
      // Fallback approach if querySelector with :has() is not supported
      console.warn('Primary scroll method failed, using fallback:', error);
      this.scrollToSelectedItemFallback();
    }
  }

  private scrollToSelectedItemFallback() {
    if (!this.sortListRef || !this.selectedSortKey) {
      return;
    }

    const listElement = this.sortListRef.nativeElement;
    const radioElements = Array.from(listElement.querySelectorAll('ion-radio')) as HTMLIonRadioElement[];
    
    for (const radio of radioElements) {
      if (radio.getAttribute('value') === this.selectedSortKey) {
        const ionItem = radio.closest('ion-item') as HTMLElement;
        if (ionItem) {
          ionItem.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
          });
        }
        break;
      }
    }
  }
}
