import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef } from '@angular/core';
import { 
  IonToolbar, 
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
import { BallSortOption, PatternSortOption } from 'src/app/core/models/sort.model';

@Component({
  selector: 'app-sort-header',
  templateUrl: './sort-header.component.html',
  styleUrls: ['./sort-header.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonToolbar,
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
  @Input() sortOptions: any[] = [];
  @Input() selectedSort?: any;
  @Output() sortChanged = new EventEmitter<any>();

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
    this.isOpen = true;
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

  getSortKey(option: any): string {
    return `${option.field}_${option.direction}`;
  }

  hide() {
    this.elementRef.nativeElement.style.transform = 'translateY(-100%)';
  }

  show() {
    this.elementRef.nativeElement.style.transform = 'translateY(0)';
  }
}