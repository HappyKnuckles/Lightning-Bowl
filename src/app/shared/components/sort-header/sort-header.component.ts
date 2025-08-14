import { Component, Input, Output, EventEmitter, OnInit, ElementRef } from '@angular/core';
import { 
  IonButton, 
  IonIcon, 
  IonPopover, 
  IonList, 
  IonItem, 
  IonLabel,
  IonRadioGroup,
  IonRadio,
  PopoverController
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { swapVertical } from 'ionicons/icons';
import { SortOption, BallSortField, PatternSortField } from 'src/app/core/models/sort.model';

@Component({
  selector: 'app-sort-header',
  templateUrl: './sort-header.component.html',
  styleUrls: ['./sort-header.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonButton,
    IonIcon,
    IonPopover,
    IonList,
    IonItem,
    IonLabel,
    IonRadioGroup,
    IonRadio,
  ],
})
export class SortHeaderComponent implements OnInit {
  @Input() sortOptions: SortOption<BallSortField | PatternSortField>[] = [];
  @Input() selectedSort?: SortOption<BallSortField | PatternSortField>;
  @Output() sortChanged = new EventEmitter<SortOption<BallSortField | PatternSortField>>();

  isOpen = false;
  selectedSortKey = '';

  constructor(
    private popoverController: PopoverController,
    private elementRef: ElementRef
  ) {
    addIcons({ swapVertical });
  }

  ngOnInit() {
    this.updateSelectedSortKey();
  }

  private updateSelectedSortKey() {
    if (this.selectedSort) {
      this.selectedSortKey = `${this.selectedSort.field}_${this.selectedSort.direction}`;
    }
  }

  async openSortPopover(event: Event) {
    // Prevent event bubbling and set isOpen to trigger popover
    event.stopPropagation();
    event.preventDefault();
    this.isOpen = true;
  }

  selectOption(option: SortOption<BallSortField | PatternSortField>) {
    // Direct option selection method that ensures responsiveness
    this.selectedSort = option;
    this.selectedSortKey = `${option.field}_${option.direction}`;
    this.sortChanged.emit(option);
    this.isOpen = false;
  }

  onSortChange(selectedKey: string) {
    const selectedOption = this.sortOptions.find(option => 
      `${option.field}_${option.direction}` === selectedKey
    );
    
    if (selectedOption) {
      this.selectedSort = selectedOption;
      this.selectedSortKey = selectedKey;
      this.sortChanged.emit(selectedOption);
      this.isOpen = false;
    }
  }

  onPopoverDismiss() {
    this.isOpen = false;
  }

  getSortKey(option: SortOption<BallSortField | PatternSortField>): string {
    return `${option.field}_${option.direction}`;
  }

  hide() {
    this.elementRef.nativeElement.style.opacity = '0.5';
    this.elementRef.nativeElement.style.pointerEvents = 'none';
  }

  show() {
    this.elementRef.nativeElement.style.opacity = '1';
    this.elementRef.nativeElement.style.pointerEvents = 'auto';
  }
}