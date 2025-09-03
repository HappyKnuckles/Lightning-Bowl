import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonList,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import { BaseFilterService } from 'src/app/core/services/base-filter/base-filter.service';

@Component({
  selector: 'app-generic-filter',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonTitle,
    IonContent,
    IonList,
    IonFooter,
  ],
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button color="medium" (click)="cancel()">Cancel</ion-button>
        </ion-buttons>
        <ion-title>Filter</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="reset()" [strong]="true">Reset</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-list style="padding-top: 10px" lines="full">
        <ng-content></ng-content>
      </ion-list>
    </ion-content>

    <ion-footer style="display: flex" class="ion-justify-content-center">
      <ion-button class="confirm-btn" (click)="confirm()">
        Confirm ({{ getFilteredCount() }} {{ itemType }})
      </ion-button>
    </ion-footer>
  `,
})
export class GenericFilterComponent<T extends object, U> implements OnInit {
  @Input() filterService!: BaseFilterService<T, U>;
  @Input() itemType: string = 'Items';

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {
    this.onInit();
  }

  protected onInit(): void {
    // Override this method in derived classes for custom initialization
  }

  cancel(): Promise<boolean> {
    const storageKey = this.filterService.getStorageKey();
    this.filterService.filters.update(() =>
      localStorage.getItem(storageKey) 
        ? JSON.parse(localStorage.getItem(storageKey)!) 
        : this.filterService.filters()
    );
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  reset(): void {
    this.filterService.resetFilters();
  }

  confirm(): Promise<boolean> {
    this.filterService.filters.update((filters) => ({ ...filters }));
    this.filterService.saveFilters();
    return this.modalCtrl.dismiss('confirm');
  }

  updateFilter<K extends keyof T>(key: K, value: unknown): void {
    this.filterService.filters.update((filters) => ({
      ...filters,
      [key]: value,
    }));
  }

  protected getFilteredCount(): number {
    // Override this method in derived classes to provide specific count logic
    if (this.filterService && typeof this.filterService.filteredItems === 'function') {
      return this.filterService.filteredItems().length;
    }
    return 0;
  }
}