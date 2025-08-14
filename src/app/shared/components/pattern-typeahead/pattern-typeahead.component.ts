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
  IonCheckbox,
  IonText,
  IonLabel,
  IonButtons,
  IonButton,
  IonAvatar,
} from '@ionic/angular/standalone';
import { InfiniteScrollCustomEvent, ModalController } from '@ionic/angular';
import { LoadingService } from 'src/app/core/services/loader/loading.service';
import { NgClass, NgIf } from '@angular/common';
import { ChartGenerationService } from 'src/app/core/services/chart/chart-generation.service';
import { DomSanitizer } from '@angular/platform-browser';
import { SearchBlurDirective } from 'src/app/core/directives/search-blur/search-blur.directive';

@Component({
  selector: 'app-pattern-typeahead',
  standalone: true,
  imports: [
    IonButton,
    IonButtons,
    IonLabel,
    NgIf,
    IonText,
    IonCheckbox,
    IonItem,
    IonInfiniteScrollContent,
    IonInfiniteScroll,
    IonContent,
    IonToolbar,
    IonSearchbar,
    IonTitle,
    IonHeader,
    NgClass,
    SearchBlurDirective,
    IonAvatar,
  ],
  templateUrl: './pattern-typeahead.component.html',
  styleUrl: './pattern-typeahead.component.scss',
})
export class PatternTypeaheadComponent implements OnInit, OnDestroy {
  patterns = input<Partial<Pattern>[]>([]);
  prevSelectedPatterns = input<string[]>([]);
  @Output() selectedPatternsChange = new EventEmitter<string[]>();
  @ViewChild(IonContent, { static: false }) content!: IonContent;
  @ViewChild('infiniteScroll') infiniteScroll!: IonInfiniteScroll;
  filteredPatterns = signal<Partial<Pattern>[]>([]);
  selectedPatterns: string[] = [];
  displayedPatterns = computed(() => this.filteredPatterns().slice(0, this.loadedCount()));
  private batchSize = 100;
  public loadedCount = signal(0);

  constructor(
    private patternService: PatternService,
    public loadingService: LoadingService,
    private chartService: ChartGenerationService,
    private sanitizer: DomSanitizer,
    private modalCtrl: ModalController,
  ) {}

  ngOnInit() {
    this.filteredPatterns.set([...this.patterns()]);
    this.selectedPatterns = [...(this.prevSelectedPatterns() || [])];

    // If there are previously selected patterns, put them at the top
    if (this.selectedPatterns.length > 0) {
      this.reorderPatternsForSelected();
    }

    this.loadedCount.set(Math.min(this.batchSize, this.filteredPatterns().length));
    this.generateChartImages(); // Enable chart image generation
  }

  resetPatternSelection() {
    this.selectedPatterns = [];
  }

  savePatternSelection() {
    this.modalCtrl.dismiss();
  }

  ngOnDestroy(): void {
    this.selectedPatternsChange.emit(this.selectedPatterns);
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

      if (this.selectedPatterns.length > 0) {
        this.reorderPatternsForSelected();
      }

      this.loadedCount.set(Math.min(this.batchSize, this.filteredPatterns().length));
      
      // Generate chart images for any new patterns loaded
      this.generateChartImages();

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
        
        // Generate chart images for newly loaded patterns
        this.generateChartImages();
      }
      event.target.complete();

      if (this.loadedCount() >= this.filteredPatterns().length) {
        event.target.disabled = true;
      }
    }, 50);
  }

  checkboxChange(event: CustomEvent, patternTitle: string): void {
    if (event.detail.checked) {
      if (!this.selectedPatterns.includes(patternTitle) && this.selectedPatterns.length < 2) {
        this.selectedPatterns.push(patternTitle);
      }
    } else {
      this.selectedPatterns = this.selectedPatterns.filter((p) => p !== patternTitle);
    }
    this.reorderPatternsForSelected();
  }

  isPatternSelected(patternTitle: string): boolean {
    return this.selectedPatterns.includes(patternTitle);
  }

  canSelectMorePatterns(): boolean {
    return this.selectedPatterns.length < 2;
  }

  getRatioValue(ratio: string): number {
    const numericPart = ratio.split(':')[0];
    return parseFloat(numericPart);
  }

  private reorderPatternsForSelected(): void {
    if (this.selectedPatterns.length === 0) return;

    const selectedPatternObjects = this.filteredPatterns().filter((p) => this.selectedPatterns.includes(p.title || ''));
    const unselectedPatterns = this.filteredPatterns().filter((p) => !this.selectedPatterns.includes(p.title || ''));

    this.filteredPatterns.set([...selectedPatternObjects, ...unselectedPatterns]);
  }

  private reorderPatterns(selectedPatternTitle: string): void {
    if (!selectedPatternTitle) return;

    const selectedPattern = this.filteredPatterns().find((p) => p.title === selectedPatternTitle);
    if (selectedPattern) {
      const otherPatterns = this.filteredPatterns().filter((p) => p.title !== selectedPatternTitle);
      this.filteredPatterns.set([selectedPattern, ...otherPatterns]);
    }
  }

  private generateChartImages(): void {
    this.patterns().forEach((pattern) => {
      if (!pattern.chartImageSrc) {
        try {
          // Generate a small preview image optimized for the typeahead list
          const previewDataUri = this.chartService.generatePatternPreviewDataUri(pattern, 60, true, false);
          pattern.chartImageSrc = this.sanitizer.bypassSecurityTrustUrl(previewDataUri);
          
          // Optionally generate horizontal version if needed elsewhere
          const svgDataUriHor = this.chartService.generatePatternChartDataUri(pattern, 20, 100, 400, 1500, 2, 0.05, 0.2, false);
          pattern.chartImageSrcHorizontal = this.sanitizer.bypassSecurityTrustUrl(svgDataUriHor);
        } catch (error) {
          console.error(`Error generating chart for pattern ${pattern.title}:`, error);
        }
      }
    });
  }
}
