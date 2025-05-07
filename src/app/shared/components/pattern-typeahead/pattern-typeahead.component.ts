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
  IonText,
  IonSkeletonText, IonLabel, IonImg, IonAvatar
} from '@ionic/angular/standalone';
import { InfiniteScrollCustomEvent } from '@ionic/angular';
import { LoadingService } from 'src/app/core/services/loader/loading.service';
import { NgClass, NgIf } from '@angular/common';
import { ChartGenerationService } from 'src/app/core/services/chart/chart-generation.service';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-pattern-typeahead',
  standalone: true,
  imports: [IonAvatar, IonImg, IonLabel,
    NgIf,
    IonSkeletonText,
    IonText,
    IonRadioGroup,
    IonRadio,
    IonItem,
    IonInfiniteScrollContent,
    IonInfiniteScroll,
    IonContent,
    IonToolbar,
    IonSearchbar,
    IonTitle,
    IonHeader,
    NgClass,
  ],
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

  constructor(
    private patternService: PatternService,
    public loadingService: LoadingService,
    private chartService: ChartGenerationService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit() {
    this.filteredPatterns.set([...this.patterns()]);
    this.selectedPattern = this.prevSelectedPattern() || '';

    // If there's a previously selected pattern, put it at the top
    if (this.selectedPattern) {
      this.reorderPatterns(this.selectedPattern);
    }

    this.loadedCount.set(Math.min(this.batchSize, this.filteredPatterns().length));
    // this.generateChartImages();

  }
  private generateChartImages(): void {
    this.patterns().forEach((pattern) => {
      if (!pattern.chartImageSrc) {
        try {
          const svgDataUri = this.chartService.generatePatternChartDataUri(pattern, true);
          const svgDataUriHor = this.chartService.generatePatternChartDataUri(pattern, false);
          pattern.chartImageSrcVertical = this.sanitizer.bypassSecurityTrustUrl(svgDataUriHor);
          pattern.chartImageSrc = this.sanitizer.bypassSecurityTrustUrl(svgDataUri);
        } catch (error) {
          console.error(`Error generating chart for pattern ${pattern.title}:`, error);
        }
      }
    });
  }
  async searchPatterns(event: CustomEvent) {
    const searchTerm = event.detail.value;

    try {
      this.loadingService.setLoading(true);
      if (searchTerm === '') {
        this.filteredPatterns.set([...this.patterns()]);
      } else {
        const response = await this.patternService.searchPattern(searchTerm);
        const patterns = response.patterns;
        this.filteredPatterns.set(patterns);
      }

      if (this.selectedPattern && this.filteredPatterns().some((p) => p.title === this.selectedPattern)) {
        this.reorderPatterns(this.selectedPattern);
      }

      this.loadedCount.set(Math.min(this.batchSize, this.filteredPatterns().length));

      if (this.infiniteScroll) {
        this.infiniteScroll.disabled = this.loadedCount() >= this.filteredPatterns().length;
      }
      setTimeout(() => {
        this.content.scrollToTop(300);
      }, 300);
    } catch (error) {
      console.error('Error searching patterns:', error);
    } finally {
      this.loadingService.setLoading(false);
    }
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

  getRatioValue(ratio: string): number {
    const numericPart = ratio.split(':')[0];
    return parseFloat(numericPart);
  }

  private reorderPatterns(selectedPatternTitle: string): void {
    if (!selectedPatternTitle) return;

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
