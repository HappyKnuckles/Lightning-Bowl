import { Component, computed, EventEmitter, input, Output, signal, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { InfiniteScrollCustomEvent, ModalController } from '@ionic/angular';
import Fuse from 'fuse.js';
import {
  IonToolbar,
  IonTitle,
  IonHeader,
  IonInfiniteScrollContent,
  IonInfiniteScroll,
  IonContent,
  IonItem,
  IonCheckbox,
  IonLabel,
  IonSearchbar,
  IonList,
  IonButtons,
  IonButton,
  IonAvatar,
  IonImg,
  IonText,
} from '@ionic/angular/standalone';
import { NgClass, NgIf } from '@angular/common';
import { SearchBlurDirective } from 'src/app/core/directives/search-blur/search-blur.directive';
import { TypeaheadConfig } from './typeahead-config.interface';
import { LoadingService } from 'src/app/core/services/loader/loading.service';

@Component({
  selector: 'app-generic-typeahead',
  standalone: true,
  imports: [
    IonButton,
    IonButtons,
    IonList,
    IonSearchbar,
    IonLabel,
    IonCheckbox,
    IonItem,
    IonContent,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonAvatar,
    IonImg,
    IonText,
    SearchBlurDirective,
    NgClass,
    NgIf,
  ],
  templateUrl: './generic-typeahead.component.html',
  styleUrl: './generic-typeahead.component.scss',
})
export class GenericTypeaheadComponent<T> implements OnInit, OnDestroy {
  items = input<T[]>([]);
  config = input.required<TypeaheadConfig<T>>();
  prevSelectedItems = input<any[]>([]);
  @Output() selectedItemsChange = new EventEmitter<any[]>();
  @ViewChild(IonContent, { static: false }) content!: IonContent;
  @ViewChild('infiniteScroll') infiniteScroll!: IonInfiniteScroll;
  
  filteredItems = signal<T[]>([]);
  selectedItems: T[] = [];
  displayedItems = computed(() => this.filteredItems().slice(0, this.loadedCount()));
  fuse!: Fuse<T>;
  private batchSize = 100;
  public loadedCount = signal(0);

  constructor(
    private modalCtrl: ModalController,
    private loadingService: LoadingService
  ) {}

  ngOnInit() {
    this.filteredItems.set([...this.items()]);
    this.loadedCount.set(Math.min(this.batchSize, this.items().length));

    const prevSelected = this.prevSelectedItems();
    if (prevSelected && prevSelected.length > 0) {
      this.selectedItems = this.items().filter((item) => 
        prevSelected.includes(this.getItemIdentifier(item))
      );
    }

    if (this.config().searchMode === 'local') {
      const options = {
        keys: this.config().searchKeys,
        threshold: 0.3,
        ignoreLocation: true,
        minMatchCharLength: 3,
        includeMatches: true,
        includeScore: true,
        shouldSort: true,
        useExtendedSearch: false,
      };
      this.fuse = new Fuse(this.items(), options);
    }

    // Reorder items if there are selected items
    if (this.selectedItems.length > 0) {
      this.reorderItemsForSelected();
    }
  }

  loadData(event: InfiniteScrollCustomEvent): void {
    setTimeout(() => {
      if (this.loadedCount() < this.filteredItems().length) {
        this.loadedCount.update((count) => Math.min(count + this.batchSize, this.filteredItems().length));
      }
      event.target.complete();

      if (this.loadedCount() >= this.filteredItems().length) {
        event.target.disabled = true;
      }
    }, 50);
  }

  async searchItems(event: CustomEvent) {
    const searchTerm = event.detail.value?.toLowerCase() ?? '';
    
    if (this.config().searchMode === 'api' && this.config().apiSearchFn) {
      try {
        this.loadingService.setLoading(true);
        if (searchTerm === '') {
          this.filteredItems.set([...this.items()]);
        } else {
          const response = await this.config().apiSearchFn(searchTerm);
          this.filteredItems.set(response.items);
        }
      } catch (error) {
        console.error('Error searching items:', error);
      } finally {
        this.loadingService.setLoading(false);
      }
    } else {
      // Local search with Fuse.js
      if (searchTerm && searchTerm.trim() !== '') {
        const result = this.fuse.search(searchTerm);
        this.filteredItems.set(result.map((res) => res.item));
      } else {
        this.filteredItems.set([...this.items()]);
      }
    }

    // Reorder items if there are selected items
    if (this.selectedItems.length > 0) {
      this.reorderItemsForSelected();
    }

    this.loadedCount.set(Math.min(this.batchSize, this.filteredItems().length));

    if (this.infiniteScroll) {
      this.infiniteScroll.disabled = this.loadedCount() >= this.filteredItems().length;
    }

    setTimeout(() => {
      this.content.scrollToTop(300);
    }, 300);
  }

  resetSelection() {
    this.selectedItems = [];
  }

  saveSelection() {
    this.modalCtrl.dismiss();
  }

  checkboxChange(event: CustomEvent, item: T): void {
    const checked = event.detail.checked;

    if (checked) {
      const maxSelections = this.config().maxSelections;
      if (!maxSelections || this.selectedItems.length < maxSelections) {
        if (!this.isItemSelected(item)) {
          this.selectedItems = [...this.selectedItems, item];
        }
      }
    } else {
      this.selectedItems = this.selectedItems.filter((selected) => 
        this.getItemIdentifier(selected) !== this.getItemIdentifier(item)
      );
    }

    this.reorderItemsForSelected();
  }

  isItemSelected(item: T): boolean {
    return this.selectedItems.some((selected) => 
      this.getItemIdentifier(selected) === this.getItemIdentifier(item)
    );
  }

  canSelectMoreItems(): boolean {
    const maxSelections = this.config().maxSelections;
    return !maxSelections || this.selectedItems.length < maxSelections;
  }

  getItemDisplayValue(item: T, field: string): string {
    return (item as any)[field] || '';
  }

  getItemIdentifier(item: T): any {
    return (item as any)[this.config().identifierKey];
  }

  getImageUrl(item: T): string {
    return this.config().imageUrlGenerator?.(item) || '';
  }

  getCustomDisplayLogic(item: T): { cssClass?: string; disabled?: boolean } {
    return this.config().customDisplayLogic?.(item) || {};
  }

  private reorderItemsForSelected(): void {
    if (this.selectedItems.length === 0) return;

    const selectedIdentifiers = this.selectedItems.map(item => this.getItemIdentifier(item));
    const selectedItemObjects = this.filteredItems().filter((item) => 
      selectedIdentifiers.includes(this.getItemIdentifier(item))
    );
    const unselectedItems = this.filteredItems().filter((item) => 
      !selectedIdentifiers.includes(this.getItemIdentifier(item))
    );

    this.filteredItems.set([...selectedItemObjects, ...unselectedItems]);
  }

  ngOnDestroy(): void {
    const selectedIdentifiers = this.selectedItems.map(item => this.getItemIdentifier(item));
    this.selectedItemsChange.emit(selectedIdentifiers);
  }
}