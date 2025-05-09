import { Component, OnInit, ViewChild, OnDestroy, input, ChangeDetectionStrategy, signal, output } from '@angular/core';
import Fuse from 'fuse.js';
import { Ball } from 'src/app/core/models/ball.model';
import {
  IonContent,
  IonSearchbar,
  IonList,
  IonItem,
  IonAvatar,
  IonImg,
  IonLabel,
  IonHeader,
  IonToolbar,
  IonCheckbox,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonTitle,
  IonButtons,
  IonIcon,
  IonButton,
} from '@ionic/angular/standalone';
import { InfiniteScrollCustomEvent, ModalController, SearchbarCustomEvent } from '@ionic/angular';
import { StorageService } from 'src/app/core/services/storage/storage.service';

@Component({
  selector: 'app-ball-typeahead',
  templateUrl: './ball-typeahead.component.html',
  styleUrls: ['./ball-typeahead.component.scss'],
  standalone: true,
  imports: [
    IonButton,
    IonIcon,
    IonButtons,
    IonTitle,
    IonInfiniteScrollContent,
    IonInfiniteScroll,
    IonCheckbox,
    IonToolbar,
    IonHeader,
    IonLabel,
    IonImg,
    IonAvatar,
    IonItem,
    IonList,
    IonSearchbar,
    IonContent,
    IonContent,
    IonSearchbar,
    IonLabel,
    IonImg,
    IonAvatar,
    IonItem,
    IonList,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BallTypeaheadComponent implements OnInit, OnDestroy {
  @ViewChild('infiniteScroll') infiniteScroll!: IonInfiniteScroll;
  @ViewChild(IonContent, { static: false }) content!: IonContent;
  balls = input<Ball[]>([]);
  selectedBallsChange = output<Ball[]>();
  displayedBalls = signal<Ball[]>([]);
  selectedBalls: Ball[] = [];
  private filteredBalls: Ball[] = [];
  private fuse!: Fuse<Ball>;
  private batchSize = 100;
  public loadedCount = 0;

  constructor(
    public storageService: StorageService,
    private modalCtrl: ModalController,
  ) {}

  ngOnInit(): void {
    this.filteredBalls = [...this.balls()];
    this.displayedBalls.set(this.filteredBalls.slice(0, this.batchSize));
    this.loadedCount = this.batchSize;

    const options = {
      keys: [
        { name: 'ball_name', weight: 1 },
        { name: 'brand_name', weight: 0.9 },
        { name: 'core_name', weight: 0.7 },
        { name: 'coverstock_name', weight: 0.7 },
        { name: 'factory_finish', weight: 0.5 },
      ],
      threshold: 0.3,
      ignoreLocation: true,
      minMatchCharLength: 3,
      includeMatches: true,
      includeScore: true,
      shouldSort: true,
      useExtendedSearch: false,
    };
    this.fuse = new Fuse(this.balls(), options);
  }

  ngOnDestroy(): void {
    if (this.selectedBalls.length > 0) {
      this.selectedBallsChange.emit(this.selectedBalls);
    }
  }

  loadData(event: InfiniteScrollCustomEvent): void {
    setTimeout(() => {
      if (this.loadedCount < this.filteredBalls.length) {
        this.displayedBalls.set(this.filteredBalls.slice(0, this.loadedCount + this.batchSize));
        this.loadedCount += this.batchSize;
      }
      event.target.complete();

      if (this.loadedCount >= this.filteredBalls.length) {
        event.target.disabled = true;
      }
    }, 50);
  }

  searchBalls(event: SearchbarCustomEvent): void {
    const searchTerm = event.detail.value!.toLowerCase();
    if (searchTerm && searchTerm.trim() !== '') {
      const result = this.fuse.search(searchTerm);
      this.filteredBalls = result.map((res) => res.item);
    } else {
      this.filteredBalls = [...this.balls()];
    }

    this.loadedCount = this.batchSize;
    this.displayedBalls.set(this.filteredBalls.slice(0, this.batchSize));

    this.infiniteScroll.disabled = this.loadedCount >= this.filteredBalls.length;

    setTimeout(() => {
      this.content.scrollToTop(300);
    }, 300);
  }

  resetBallSelection() {
    this.selectedBalls = [];
  }

  saveBallSelection() {
    this.modalCtrl.dismiss();
  }

  checkboxChange(event: CustomEvent): void {
    const checked = event.detail.checked;
    const value = event.detail.value;

    if (checked) {
      this.selectedBalls = [...this.selectedBalls, value];
    } else {
      this.selectedBalls = this.selectedBalls.filter((item) => item !== value);
    }
  }

  isChecked(ball: Ball): boolean {
    return this.selectedBalls.includes(ball);
  }
}
