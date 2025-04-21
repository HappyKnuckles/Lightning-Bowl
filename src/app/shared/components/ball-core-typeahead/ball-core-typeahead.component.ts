import { Component, computed, EventEmitter, input, Output, signal, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { InfiniteScrollCustomEvent, ModalController } from '@ionic/angular';
import Fuse from 'fuse.js';
import { Core } from 'src/app/core/models/ball.model';
import {
  IonToolbar,
  IonTitle,
  IonHeader,
  IonInfiniteScrollContent,
  IonInfiniteScroll,
  IonContent,
  IonItem,
  IonAvatar,
  IonImg,
  IonCheckbox,
  IonLabel,
  IonSearchbar,
  IonList,
  IonButtons,
  IonButton,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-ball-core-typeahead',
  standalone: true,
  imports: [
    IonButton,
    IonButtons,
    IonList,
    IonSearchbar,
    IonLabel,
    IonCheckbox,
    IonImg,
    IonAvatar,
    IonItem,
    IonContent,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonHeader,
    IonTitle,
    IonToolbar,
  ],
  templateUrl: './ball-core-typeahead.component.html',
  styleUrl: './ball-core-typeahead.component.scss',
})
export class BallCoreTypeaheadComponent implements OnInit, OnDestroy {
  cores = input<Core[]>([]);
  prevSelectedCores = input<string[]>([]);
  @Output() selectedCoresChange = new EventEmitter<string[]>();
  @ViewChild(IonContent, { static: false }) content!: IonContent;
  @ViewChild('infiniteScroll') infiniteScroll!: IonInfiniteScroll;
  filteredCores = signal<Core[]>([]);
  selectedCores: Core[] = [];
  displayedCores = computed(() => this.filteredCores().slice(0, this.loadedCount()));
  fuse!: Fuse<Core>;
  private batchSize = 100;
  public loadedCount = signal(0);
  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {
    this.filteredCores.set([...this.cores()]);
    this.loadedCount.set(Math.min(this.batchSize, this.cores().length));

    const prevSelected = this.prevSelectedCores();
    if (prevSelected && prevSelected.length > 0) {
      this.selectedCores = this.cores().filter((core) => prevSelected.includes(core.core_name));
    }

    const options = {
      keys: [
        { name: 'core_name', weight: 1 },
        { name: 'brand', weight: 0.7 },
      ],
      threshold: 0.3,
      ignoreLocation: true,
      minMatchCharLength: 3,
      includeMatches: true,
      includeScore: true,
      shouldSort: true,
      useExtendedSearch: false,
    };
    this.fuse = new Fuse(this.cores(), options);
  }

  loadData(event: InfiniteScrollCustomEvent): void {
    setTimeout(() => {
      if (this.loadedCount() < this.filteredCores().length) {
        this.loadedCount.update((count) => Math.min(count + this.batchSize, this.filteredCores().length));
      }
      event.target.complete();

      if (this.loadedCount() >= this.filteredCores().length) {
        event.target.disabled = true;
      }
    }, 50);
  }

  searchCores(event: CustomEvent) {
    const searchTerm = event.detail.value?.toLowerCase() ?? '';
    if (searchTerm && searchTerm.trim() !== '') {
      const result = this.fuse.search(searchTerm);
      this.filteredCores.set(result.map((res) => res.item));
    } else {
      this.filteredCores.set([...this.cores()]);
    }

    this.loadedCount.set(Math.min(this.batchSize, this.filteredCores().length));

    if (this.infiniteScroll) {
      this.infiniteScroll.disabled = this.loadedCount() >= this.filteredCores().length;
    }

    this.content.scrollToTop(300);
  }

  resetCoreSelection() {
    this.selectedCores = [];
  }

  saveCoreSelection() {
    this.modalCtrl.dismiss();
  }

  checkboxChange(event: CustomEvent): void {
    const checked = event.detail.checked;
    const value: Core = event.detail.value;

    if (checked) {
      if (!this.selectedCores.some((selected) => selected.core_name === value.core_name)) {
        this.selectedCores = [...this.selectedCores, value];
      }
    } else {
      this.selectedCores = this.selectedCores.filter((item) => item.core_name !== value.core_name);
    }
  }

  isChecked(core: Core): boolean {
    return this.selectedCores.some((selected) => selected.core_name === core.core_name);
  }

  ngOnDestroy(): void {
    const coreNames = this.selectedCores.map((core) => core.core_name);
    this.selectedCoresChange.emit(coreNames);
  }
}
