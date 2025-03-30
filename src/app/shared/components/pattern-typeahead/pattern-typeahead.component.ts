import { Component, effect, EventEmitter, input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
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

  filteredPatterns: Partial<Pattern>[] = [];
  displayedPatterns: Partial<Pattern>[] = [];
  selectedPattern = '';
  private batchSize = 100;
  public loadedCount = 0;

  constructor(private patternService: PatternService) {
    effect(() => {
      this.patterns();
      this.filteredPatterns = [...this.patterns()];
      this.displayedPatterns = this.filteredPatterns.slice(0, this.batchSize);
      this.loadedCount = this.displayedPatterns.length;
    });
  }

  ngOnInit() {
    this.filteredPatterns = [...this.patterns()];
    this.displayedPatterns = this.filteredPatterns.slice(0, this.batchSize);
    this.loadedCount = this.displayedPatterns.length;
  }

  async searchPatterns(event: CustomEvent) {
    if (event.detail.value === '') {
      this.filteredPatterns = [...this.patterns()];
      this.displayedPatterns = this.filteredPatterns.slice(0, this.batchSize);
      this.loadedCount = this.displayedPatterns.length;
      return;
    } else {
      const patterns = await this.patternService.searchPattern(event.detail.value);
      this.filteredPatterns = patterns;
      this.loadedCount = this.batchSize;
      this.displayedPatterns = this.filteredPatterns.slice(0, this.batchSize);
    }
    this.infiniteScroll.disabled = this.loadedCount >= this.filteredPatterns.length;
    this.content.scrollToTop(300);
  }

  loadData(event: InfiniteScrollCustomEvent): void {
    setTimeout(() => {
      if (this.loadedCount < this.filteredPatterns.length) {
        this.displayedPatterns = this.filteredPatterns.slice(0, this.loadedCount + this.batchSize);
        this.loadedCount += this.batchSize;
      }
      event.target.complete();

      if (this.loadedCount >= this.filteredPatterns.length) {
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
