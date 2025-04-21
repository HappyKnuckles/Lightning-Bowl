import { input, Output, ViewChild, signal, computed, Component, OnDestroy, EventEmitter, OnInit } from '@angular/core';
import { ModalController, InfiniteScrollCustomEvent } from '@ionic/angular';
import Fuse from 'fuse.js';
import { Coverstock } from 'src/app/core/models/ball.model';
import {
  IonToolbar,
  IonHeader,
  IonButton,
  IonSearchbar,
  IonCheckbox,
  IonLabel,
  IonInfiniteScroll,
  IonTitle,
  IonButtons,
  IonContent,
  IonList,
  IonItem,
  IonInfiniteScrollContent,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-ball-coverstock-typeahead',
  standalone: true,
  imports: [
    IonInfiniteScrollContent,
    IonItem,
    IonList,
    IonContent,
    IonButtons,
    IonTitle,
    IonInfiniteScroll,
    IonLabel,
    IonCheckbox,
    IonSearchbar,
    IonButton,
    IonHeader,
    IonToolbar,
  ],
  templateUrl: './ball-coverstock-typeahead.component.html',
  styleUrl: './ball-coverstock-typeahead.component.scss',
})
export class BallCoverstockTypeaheadComponent implements OnDestroy, OnInit {
  coverstocks = input<Coverstock[]>([]);
  prevSelectedCoverstocks = input<string[]>([]);
  @Output() selectedCoverstocksChange = new EventEmitter<string[]>();
  @ViewChild(IonContent, { static: false }) content!: IonContent;
  @ViewChild('infiniteScroll') infiniteScroll!: IonInfiniteScroll;
  filteredCoverstocks = signal<Coverstock[]>([]);
  selectedCoverstocks: Coverstock[] = [];
  displayedCoverstocks = computed(() => this.filteredCoverstocks().slice(0, this.loadedCount()));
  fuse!: Fuse<Coverstock>;
  private batchSize = 100;
  public loadedCount = signal(0);
  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {
    this.filteredCoverstocks.set([...this.coverstocks()]);
    this.loadedCount.set(Math.min(this.batchSize, this.coverstocks().length));

    const prevSelected = this.prevSelectedCoverstocks();
    if (prevSelected && prevSelected.length > 0) {
      this.selectedCoverstocks = this.coverstocks().filter((coverstock) => prevSelected.includes(coverstock.coverstock_name));
    }

    const options = {
      keys: [
        { name: 'coverstock_name', weight: 1 },
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
    this.fuse = new Fuse(this.coverstocks(), options);
  }

  loadData(event: InfiniteScrollCustomEvent): void {
    setTimeout(() => {
      if (this.loadedCount() < this.filteredCoverstocks().length) {
        this.loadedCount.update((count) => Math.min(count + this.batchSize, this.filteredCoverstocks().length));
      }
      event.target.complete();

      if (this.loadedCount() >= this.filteredCoverstocks().length) {
        event.target.disabled = true;
      }
    }, 50);
  }

  searchCoverstocks(event: CustomEvent) {
    const searchTerm = event.detail.value?.toLowerCase() ?? '';
    if (searchTerm && searchTerm.trim() !== '') {
      const result = this.fuse.search(searchTerm);
      this.filteredCoverstocks.set(result.map((res) => res.item));
    } else {
      this.filteredCoverstocks.set([...this.coverstocks()]);
    }

    this.loadedCount.set(Math.min(this.batchSize, this.filteredCoverstocks().length));

    if (this.infiniteScroll) {
      this.infiniteScroll.disabled = this.loadedCount() >= this.filteredCoverstocks().length;
    }

    this.content.scrollToTop(300);
  }

  resetCoverstockSelection() {
    this.selectedCoverstocks = [];
  }

  saveCoverstockSelection() {
    this.modalCtrl.dismiss();
  }

  checkboxChange(event: CustomEvent): void {
    const checked = event.detail.checked;
    const value: Coverstock = event.detail.value;

    if (checked) {
      if (!this.selectedCoverstocks.some((selected) => selected.coverstock_name === value.coverstock_name)) {
        this.selectedCoverstocks = [...this.selectedCoverstocks, value];
      }
    } else {
      this.selectedCoverstocks = this.selectedCoverstocks.filter((item) => item.coverstock_name !== value.coverstock_name);
    }
  }

  isChecked(coverstock: Coverstock): boolean {
    return this.selectedCoverstocks.some((selected) => selected.coverstock_name === coverstock.coverstock_name);
  }

  ngOnDestroy(): void {
    const coverstockNames = this.selectedCoverstocks.map((coverstock) => coverstock.coverstock_name);
    this.selectedCoverstocksChange.emit(coverstockNames);
  }
}
