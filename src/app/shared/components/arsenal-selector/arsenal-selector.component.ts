import { Component, EventEmitter, Input, Output, computed } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonIcon,
  IonItem,
  IonSelect,
  IonSelectOption,
  SelectChangeEventDetail,
} from '@ionic/angular/standalone';
import { IonSelectCustomEvent } from '@ionic/core';
import { StorageService } from 'src/app/core/services/storage/storage.service';
import { addIcons } from 'ionicons';
import { list } from 'ionicons/icons';

@Component({
  selector: 'app-arsenal-selector',
  templateUrl: './arsenal-selector.component.html',
  styleUrls: ['./arsenal-selector.component.scss'],
  imports: [
    IonIcon,
    IonItem,
    IonSelect,
    NgIf,
    NgFor,
    FormsModule,
    IonSelectOption,
  ],
  standalone: true,
})
export class ArsenalSelectorComponent {
  @Input() isSelectionMode = false;
  @Output() arsenalChanged = new EventEmitter<string>();
  selectedArsenal = '';
  
  arsenals = computed(() => {
    return this.storageService.arsenals();
  });

  constructor(
    public storageService: StorageService,
  ) {
    addIcons({ list });
    // Set initial selected arsenal to current arsenal
    this.selectedArsenal = this.storageService.currentArsenal();
  }

  async onArsenalChange(event: IonSelectCustomEvent<SelectChangeEventDetail>): Promise<void> {
    if (typeof event.detail.value === 'string') {
      // Arsenal selection
      this.selectedArsenal = event.detail.value;
      this.arsenalChanged.emit(event.detail.value);
    }
  }
}