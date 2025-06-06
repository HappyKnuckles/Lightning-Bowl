import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardTitle,
  IonCardSubtitle,
  IonCardHeader,
  IonCardContent,
  IonChip,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonRefresher,
  IonSkeletonText,
  IonSearchbar,
  IonRefresherContent,
  IonText,
  IonModal,
  IonButtons,
  IonButton,
  IonIcon,
  ModalController,
} from '@ionic/angular/standalone';
import { Pattern } from 'src/app/core/models/pattern.model';
import { PatternService } from 'src/app/core/services/pattern/pattern.service';
import { LoadingService } from 'src/app/core/services/loader/loading.service';
import { ToastService } from 'src/app/core/services/toast/toast.service';
import { ToastMessages } from 'src/app/core/constants/toast-messages.constants';
import { InfiniteScrollCustomEvent, RefresherCustomEvent } from '@ionic/angular';
import { ImpactStyle } from '@capacitor/haptics';
import { HapticService } from 'src/app/core/services/haptic/haptic.service';
import { PatternInfoComponent } from 'src/app/shared/components/pattern-info/pattern-info.component';
import { addIcons } from 'ionicons';
import { chevronBack, add, addOutline, arrowUpOutline, arrowDownOutline } from 'ionicons/icons';
import { ChartGenerationService } from 'src/app/core/services/chart/chart-generation.service';
import { DomSanitizer } from '@angular/platform-browser';
import { PatternFormComponent } from '../../shared/components/pattern-form/pattern-form.component';
import { SearchBlurDirective } from 'src/app/core/directives/search-blur/search-blur.directive';

@Component({
  selector: 'app-pattern',
  templateUrl: './pattern.page.html',
  styleUrls: ['./pattern.page.scss'],
  standalone: true,
  imports: [
    IonIcon,
    IonButton,
    IonButtons,
    IonModal,
    IonText,
    IonRefresherContent,
    IonSearchbar,
    IonSkeletonText,
    IonRefresher,
    IonInfiniteScrollContent,
    IonInfiniteScroll,
    IonChip,
    IonCardContent,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonCard,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    PatternInfoComponent,
    SearchBlurDirective,
  ],
})
export class PatternPage implements OnInit {
  @ViewChild(IonContent, { static: false }) content!: IonContent;
  patterns: Pattern[] = [];
  currentPage = 1;
  hasMoreData = true;

  constructor(
    private patternService: PatternService,
    private hapticService: HapticService,
    public loadingService: LoadingService,
    private toastService: ToastService,
    private chartService: ChartGenerationService,
    private sanitizer: DomSanitizer,
    private modalCtrl: ModalController,
  ) {
    addIcons({ addOutline, arrowUpOutline, arrowDownOutline, chevronBack, add });
  }
  async ngOnInit() {
    await this.loadPatterns();
    this.generateChartImages();
    // this.renderCharts();
  }

  async handleRefresh(event: RefresherCustomEvent): Promise<void> {
    try {
      this.hapticService.vibrate(ImpactStyle.Medium);
      this.loadingService.setLoading(true);
      this.currentPage = 1;
      this.hasMoreData = true;
      this.patterns = [];
      await this.loadPatterns();
    } catch (error) {
      console.error(error);
      this.toastService.showToast(ToastMessages.ballLoadError, 'bug', true);
    } finally {
      event.target.complete();
      this.loadingService.setLoading(false);
    }
  }

  async loadPatterns(event?: InfiniteScrollCustomEvent): Promise<void> {
    try {
      if (!event) {
        this.loadingService.setLoading(true);
      }
      const response = await this.patternService.getPatterns(this.currentPage);
      const patterns = response.patterns;
      if (response.total > 0) {
        this.patterns = [...this.patterns, ...patterns];
        this.currentPage++;
      } else {
        this.hasMoreData = false;
      }
    } catch (error) {
      console.error('Error fetching patterns:', error);
      this.toastService.showToast(ToastMessages.patternLoadError, 'bug', true);
    } finally {
      if (!event) {
        this.loadingService.setLoading(false);
      }
      if (event) {
        event.target.complete();
      }
      this.generateChartImages();
    }
  }

  async searchPatterns(event: CustomEvent): Promise<void> {
    try {
      this.loadingService.setLoading(true);
      if (event.detail.value === '') {
        this.hasMoreData = true;
        const response = await this.patternService.getPatterns(this.currentPage);
        this.patterns = response.patterns;
        this.currentPage++;
      } else {
        const response = await this.patternService.searchPattern(event.detail.value);
        this.patterns = response.patterns;
        this.hasMoreData = false;
        this.currentPage = 1;
      }
      setTimeout(() => {
        this.content.scrollToTop(300);
      }, 300);
    } catch (error) {
      console.error('Error searching patterns:', error);
      this.toastService.showToast(ToastMessages.patternLoadError, 'bug', true);
    } finally {
      this.loadingService.setLoading(false);
      this.generateChartImages();
    }
  }

  async openAddPatternModal(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: PatternFormComponent,
    });
    return await modal.present();
  }

  getRatioValue(ratio: string): number {
    const numericPart = ratio.split(':')[0];
    return parseFloat(numericPart);
  }

  private generateChartImages(): void {
    this.patterns.forEach((pattern) => {
      if (!pattern.chartImageSrc) {
        try {
          const svgDataUri = this.chartService.generatePatternChartDataUri(pattern, 325, 1300, 1300, 400, 20, 1, 7, true);
          const svgDataUriHor = this.chartService.generatePatternChartDataUri(pattern, 375, 1500, 400, 1500, 20, 1, 7, false);
          pattern.chartImageSrcHorizontal = this.sanitizer.bypassSecurityTrustUrl(svgDataUriHor);
          pattern.chartImageSrc = this.sanitizer.bypassSecurityTrustUrl(svgDataUri);
        } catch (error) {
          console.error(`Error generating chart for pattern ${pattern.title}:`, error);
        }
      }
    });
  }
}
