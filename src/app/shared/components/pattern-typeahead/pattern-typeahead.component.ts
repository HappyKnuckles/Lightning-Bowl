import { Component, computed, EventEmitter, input, OnDestroy, OnInit, Output, ViewChild, signal } from '@angular/core';
import { Pattern } from 'src/app/core/models/pattern.model';
import { PatternService } from 'src/app/core/services/pattern/pattern.service';
import {
  IonHeader,
  IonTitle,
  IonSearchbar,
  IonToolbar,
  IonContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonItem,
  IonRadio,
  IonRadioGroup,
} from '@ionic/angular/standalone';
import { InfiniteScrollCustomEvent } from '@ionic/angular';

@Component({
  selector: 'app-pattern-typeahead',
  standalone: true,
  imports: [IonRadioGroup, IonRadio, IonItem, IonInfiniteScrollContent, IonInfiniteScroll, IonContent, IonToolbar, IonSearchbar, IonTitle, IonHeader],
  templateUrl: './pattern-typeahead.component.html',
  styleUrl: './pattern-typeahead.component.css',
})
export class PatternTypeaheadComponent implements OnInit, OnDestroy {
  patterns = input<Partial<Pattern>[]>([]);
  prevSelectedPattern = input<string>('');
  @Output() selectedPatternsChange = new EventEmitter<string>();
  @ViewChild(IonContent, { static: false }) content!: IonContent;
  @ViewChild('infiniteScroll') infiniteScroll!: IonInfiniteScroll;
  filteredPatterns = signal<Partial<Pattern>[]>([]);
  selectedPattern = '';
  displayedPatterns = computed(() => this.filteredPatterns().slice(0, this.loadedCount()));
  private batchSize = 100;
  public loadedCount = signal(0);

  constructor(private patternService: PatternService) {}

  ngOnInit() {
    this.filteredPatterns.set([...this.patterns()]);
    this.loadedCount.set(Math.min(this.batchSize, this.filteredPatterns().length));
  }

  async searchPatterns(event: CustomEvent) {
    if (event.detail.value === '') {
      this.filteredPatterns.set([...this.patterns()]);
    } else {
      const patterns = await this.patternService.searchPattern(event.detail.value);
      this.filteredPatterns.set(patterns);
    }
    this.loadedCount.set(Math.min(this.batchSize, this.filteredPatterns().length));

    if (this.infiniteScroll) {
      this.infiniteScroll.disabled = this.loadedCount() >= this.filteredPatterns().length;
    }
    this.content.scrollToTop(300);
  }

  loadData(event: InfiniteScrollCustomEvent): void {
    setTimeout(() => {
      if (this.loadedCount() < this.filteredPatterns().length) {
        this.loadedCount.update((count) => Math.min(count + this.batchSize, this.filteredPatterns().length));
      }
      event.target.complete();

      if (this.loadedCount() >= this.filteredPatterns().length) {
        event.target.disabled = true;
      }
    }, 50);
  }

  radioGroupChange(event: CustomEvent): void {
    this.selectedPattern = event.detail.value;
  }

  ngOnDestroy(): void {
    this.selectedPatternsChange.emit(this.selectedPattern);
  }
}
