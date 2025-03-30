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
  styleUrl: './pattern-typeahead.component.scss',
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
    this.selectedPattern = this.prevSelectedPattern() || '';

    // If there's a previously selected pattern, put it at the top
    if (this.selectedPattern) {
      this.reorderPatterns(this.selectedPattern);
    }

    this.loadedCount.set(Math.min(this.batchSize, this.filteredPatterns().length));
  }

  async searchPatterns(event: CustomEvent) {
    const searchTerm = event.detail.value;

    if (searchTerm === '') {
      this.filteredPatterns.set([...this.patterns()]);
    } else {
      const patterns = await this.patternService.searchPattern(searchTerm);
      this.filteredPatterns.set(patterns);
    }

    // If there's a selected pattern and it's in the filtered results, move it to the top
    if (this.selectedPattern && this.filteredPatterns().some((p) => p.title === this.selectedPattern)) {
      this.reorderPatterns(this.selectedPattern);
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
    this.reorderPatterns(this.selectedPattern);
  }

  private reorderPatterns(selectedPatternTitle: string): void {
    if (!selectedPatternTitle) return;

    // Create a new array with the selected pattern first, followed by all other patterns
    const selectedPattern = this.filteredPatterns().find((p) => p.title === selectedPatternTitle);
    if (selectedPattern) {
      const otherPatterns = this.filteredPatterns().filter((p) => p.title !== selectedPatternTitle);
      this.filteredPatterns.set([selectedPattern, ...otherPatterns]);
    }
  }

  ngOnDestroy(): void {
    this.selectedPatternsChange.emit(this.selectedPattern);
  }
}
