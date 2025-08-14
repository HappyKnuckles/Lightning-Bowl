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
    // Use setTimeout to ensure the popover content is fully rendered and measured
    setTimeout(() => {
      this.scrollToSelectedItem();
    }, 200);
  }

  private scrollToSelectedItem() {
    if (!this.sortListRef || !this.selectedSortKey) {
      return;
    }

    const listElement = this.sortListRef.nativeElement;
    let selectedItem: HTMLElement | null = null;

    try {
      // Try using modern :has() selector first
      selectedItem = listElement.querySelector(`ion-item:has(ion-radio[value="${this.selectedSortKey}"])`);
    } catch (error) {
      // :has() not supported, use fallback
      console.debug('Using fallback element selection method');
    }

    // Fallback method if :has() failed or not supported
    if (!selectedItem) {
      const radioElements = Array.from(listElement.querySelectorAll('ion-radio')) as HTMLIonRadioElement[];
      for (const radio of radioElements) {
        if (radio.getAttribute('value') === this.selectedSortKey) {
          selectedItem = radio.closest('ion-item') as HTMLElement;
          break;
        }
      }
    }

    if (selectedItem) {
      // Find the scroll container (typically the popover content)
      const scrollContainer = this.findScrollContainer(selectedItem);
      
      if (scrollContainer) {
        this.scrollContainerToShowItem(scrollContainer, selectedItem);
      } else {
        // Fallback to scrollIntoView if we can't find the proper container
        selectedItem.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }
    }
  }

  private findScrollContainer(element: HTMLElement): HTMLElement | null {
    let current = element.parentElement;
    
    while (current) {
      const style = getComputedStyle(current);
      const overflow = style.overflow || style.overflowY;
      
      // Look for scrollable containers or ion-content
      if (overflow === 'auto' || overflow === 'scroll' || current.tagName.toLowerCase() === 'ion-content') {
        return current;
      }
      
      // Stop at popover boundary
      if (current.tagName.toLowerCase() === 'ion-popover') {
        break;
      }
      
      current = current.parentElement;
    }
    
    return null;
  }

  private scrollContainerToShowItem(container: HTMLElement, item: HTMLElement) {
    const containerRect = container.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    
    const itemTop = itemRect.top - containerRect.top + container.scrollTop;
    const itemBottom = itemTop + itemRect.height;
    const containerTop = container.scrollTop;
    const containerBottom = containerTop + containerRect.height;
    
    let scrollTo: number | undefined;
    
    if (itemTop < containerTop) {
      // Item is above visible area
      scrollTo = itemTop - 10; // Add small margin
    } else if (itemBottom > containerBottom) {
      // Item is below visible area  
      scrollTo = itemBottom - containerRect.height + 10; // Add small margin
    }
    
    if (scrollTo !== undefined) {
      container.scrollTo({
        top: Math.max(0, scrollTo),
        behavior: 'smooth'
      });
    }
  }
}
