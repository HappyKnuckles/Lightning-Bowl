import { Component, EventEmitter, Input, OnInit, Output, ViewChild, OnDestroy } from '@angular/core';
import Fuse from 'fuse.js';
import { Ball } from 'src/app/models/ball.model';
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
} from '@ionic/angular/standalone';
import { InfiniteScrollCustomEvent } from '@ionic/angular';
import { StorageService } from 'src/app/services/storage/storage.service';

@Component({
  selector: 'app-ball-combo-box',
  templateUrl: './ball-combo-box.component.html',
  styleUrls: ['./ball-combo-box.component.scss'],
  standalone: true,
  imports: [
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
})
export class BallComboBoxComponent implements OnInit, OnDestroy {
  @Input() balls: Ball[] = [];
  @Output() selectedBallsChange = new EventEmitter<Ball[]>(); 
  @ViewChild('infiniteScroll') infiniteScroll!: IonInfiniteScroll;
  @ViewChild(IonContent, { static: false }) content!: IonContent;
  filteredBalls: Ball[] = [];
  displayedBalls: Ball[] = [];
  fuse!: Fuse<Ball>;
  selectedBalls: Ball[] = [];
  private batchSize = 100;
  private loadedCount = 0;

  constructor(public storageService: StorageService) {}

  ngOnInit(): void {
    this.filteredBalls = [...this.balls];
    this.displayedBalls = this.filteredBalls.slice(0, this.batchSize);
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
    this.fuse = new Fuse(this.balls, options);
  }

  isChecked(ball: Ball): boolean {
    return this.selectedBalls.includes(ball);
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

  searchBalls(event: any): void {
    const searchTerm = event.target.value.toLowerCase();
    if (searchTerm && searchTerm.trim() !== '') {
      const result = this.fuse.search(searchTerm);
      this.filteredBalls = result.map((res) => res.item);
    } else {
      this.filteredBalls = [...this.balls];
      this.infiniteScroll.disabled = false;
    }

    this.loadedCount = this.batchSize;
    this.displayedBalls = this.filteredBalls.slice(0, this.batchSize);

    // Scroll to top after search
    this.content.scrollToTop(300);
  }

  loadData(event: InfiniteScrollCustomEvent): void {
    setTimeout(() => {
      if (this.loadedCount < this.filteredBalls.length) {
        this.displayedBalls = this.filteredBalls.slice(0, this.loadedCount + this.batchSize);
        this.loadedCount += this.batchSize;
      }
      event.target.complete();
    }, 50);
  }

  ngOnDestroy(): void {
    if (this.selectedBalls.length > 0) {
      this.selectedBallsChange.emit(this.selectedBalls);
    }
  }
}
