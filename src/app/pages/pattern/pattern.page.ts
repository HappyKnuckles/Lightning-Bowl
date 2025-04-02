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
  IonBackButton,
  IonButtons,
  IonButton,
  IonIcon,
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
import { chevronBack } from 'ionicons/icons';

@Component({
  selector: 'app-pattern',
  templateUrl: './pattern.page.html',
  styleUrls: ['./pattern.page.scss'],
  standalone: true,
  imports: [
    IonIcon,
    IonButton,
    IonButtons,
    IonBackButton,
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
  ) {
    addIcons({ chevronBack });
  }
  async ngOnInit() {
    await this.loadPatterns();
  }

  async handleRefresh(event: RefresherCustomEvent): Promise<void> {
    try {
      this.hapticService.vibrate(ImpactStyle.Medium, 200);
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
      console.error('Error fetching balls:', error);
      this.toastService.showToast(ToastMessages.patternLoadError, 'bug', true);
    } finally {
      if (!event) {
        this.loadingService.setLoading(false);
      }
      if (event) {
        event.target.complete();
      }
    }
  }

  async searchPatterns(event: CustomEvent): Promise<void> {
    try {
      this.loadingService.setLoading(true);
      if (event.detail.value === '') {
        this.hasMoreData = true;
        await this.loadPatterns();
      } else {
        const response = await this.patternService.searchPattern(event.detail.value);
        this.patterns = response.results;
        this.hasMoreData = false;
        this.currentPage = 1;
      }
      this.content.scrollToTop(300);
    } catch (error) {
      console.error('Error searching patterns:', error);
      this.toastService.showToast(ToastMessages.patternLoadError, 'bug', true);
    } finally {
      this.loadingService.setLoading(false);
    }
  }

  formatDistance(distance: string | number): string {
    if (!distance) return '0';

    const distStr = String(distance);
    if (distStr.endsWith("'")) {
      return distStr.slice(0, -1) + 'ft';
    }

    return distStr;
  }

  getRatioValue(ratio: string): number {
    const numericPart = ratio.split(':')[0];
    return parseFloat(numericPart);
  }
}
