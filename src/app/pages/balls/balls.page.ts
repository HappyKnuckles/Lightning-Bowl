import { ChangeDetectionStrategy, Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonSearchbar,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCardTitle,
  IonImg,
  IonCardContent,
  IonCard,
  IonCardHeader,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonCardSubtitle,
  IonIcon,
  IonButtons,
  IonButton,
  IonText,
  IonModal,
  IonRippleEffect,
  IonList,
  IonRefresherContent,
  IonRefresher,
  IonSkeletonText,
} from '@ionic/angular/standalone';
import { Ball } from 'src/app/core/models/ball.model';
import { addIcons } from 'ionicons';
import { globeOutline, camera, addOutline, filterOutline, openOutline, closeCircle } from 'ionicons/icons';
import { InfiniteScrollCustomEvent, ModalController, RefresherCustomEvent, SearchbarCustomEvent } from '@ionic/angular';
import { StorageService } from 'src/app/core/services/storage/storage.service';
import { ToastService } from 'src/app/core/services/toast/toast.service';
import { LoadingService } from 'src/app/core/services/loader/loading.service';
import Fuse from 'fuse.js';
import { Subject } from 'rxjs';
import { HapticService } from 'src/app/core/services/haptic/haptic.service';
import { ImpactStyle } from '@capacitor/haptics';
import { BallService } from 'src/app/core/services/ball/ball.service';
import { BallFilterService } from 'src/app/core/services/ball-filter/ball-filter.service';
import { ToastMessages } from 'src/app/core/constants/toast-messages.constants';
import { BallFilterActiveComponent } from 'src/app/shared/components/ball-filter-active/ball-filter-active.component';
import { BallFilterComponent } from 'src/app/shared/components/ball-filter/ball-filter.component';
import { BallListComponent } from 'src/app/shared/components/ball-list/ball-list.component';
import { ActivatedRoute } from '@angular/router';
import { SearchBlurDirective } from 'src/app/core/directives/search-blur/search-blur.directive';
import { SortHeaderComponent } from 'src/app/shared/components/sort-header/sort-header.component';
import { SortService } from 'src/app/core/services/sort/sort.service';
import { BallSortOption, BallSortField, SortDirection } from 'src/app/core/models/sort.model';

@Component({
  selector: 'app-balls',
  templateUrl: './balls.page.html',
  styleUrls: ['./balls.page.scss'],
  standalone: true,
  providers: [ModalController],
  imports: [
    IonSkeletonText,
    IonRefresher,
    IonRefresherContent,
    IonList,
    IonRippleEffect,
    IonModal,
    IonText,
    IonButton,
    IonButtons,
    IonIcon,
    IonCardSubtitle,
    IonSearchbar,
    IonInfiniteScrollContent,
    IonInfiniteScroll,
    IonCardHeader,
    IonCard,
    IonCardContent,
    IonImg,
    IonCardTitle,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    BallListComponent,
    BallFilterActiveComponent,
    SearchBlurDirective,
    SortHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BallsPage implements OnInit {
  @ViewChild('core', { static: false }) coreModal!: IonModal;
  @ViewChild('coverstock', { static: false }) coverstockModal!: IonModal;
  @ViewChild(IonContent, { static: false }) content!: IonContent;
  @ViewChild('sortHeader', { static: false }) sortHeader!: SortHeaderComponent;
  balls = signal<Ball[]>([]);
  coreBalls: Ball[] = [];
  coverstockBalls: Ball[] = [];
  searchSubject = new Subject<string>();
  searchTerm = signal('');
  currentPage = 0;
  isPageLoading = signal(false);
  hasMoreData = true;
  filterDisplayCount = 100;
  currentSortOption: BallSortOption = {
    field: BallSortField.RELEASE_DATE,
    direction: SortDirection.DESC,
    label: 'Newest First',
  };

  // Computed getter for displayed balls.
  // • If a search term exists, we build a Fuse instance over the correct data source.
  // • If filters are active and no search term exists, we display only a slice (up to filterDisplayCount) of the filtered list.
  // • Otherwise, we display the paged API-loaded balls.
  get displayedBalls(): Ball[] {
    let result: Ball[];
    if (this.searchTerm().trim() !== '') {
      this.hasMoreData = false;
      const options = {
        keys: [
          { name: 'ball_name', weight: 1 },
          { name: 'brand_name', weight: 0.9 },
          { name: 'core_name', weight: 0.7 },
          { name: 'coverstock_name', weight: 0.7 },
          { name: 'factory_finish', weight: 0.5 },
        ],
        threshold: 0.2,
        ignoreLocation: true,
        minMatchCharLength: 3,
        includeMatches: false,
        includeScore: false,
        shouldSort: true,
        useExtendedSearch: false,
      };

      const baseArray = this.isFilterActive() ? this.ballFilterService.filteredBalls() : this.storageService.allBalls();

      const fuseInstance = new Fuse(baseArray, options);

      // Split the search term by commas and trim each term
      const searchTerms = this.searchTerm()
        .split(',')
        .map((term) => term.trim());

      // Collect results for each search term
      result = searchTerms.flatMap((term) => fuseInstance.search(term).map((result) => result.item));
    } else {
      result = this.isFilterActive() ? this.ballFilterService.filteredBalls() : this.balls();
      if (this.isFilterActive()) {
        result = result.slice(0, this.filterDisplayCount);
      }
      this.hasMoreData = true;
    }

    // Apply sorting to the result
    return this.sortService.sortBalls(result, this.currentSortOption);
  }

  constructor(
    private modalCtrl: ModalController,
    public loadingService: LoadingService,
    public storageService: StorageService,
    private toastService: ToastService,
    private hapticService: HapticService,
    private ballService: BallService,
    public ballFilterService: BallFilterService,
    private route: ActivatedRoute,
    public sortService: SortService,
  ) {
    addIcons({ filterOutline, closeCircle, globeOutline, openOutline, addOutline, camera });
    this.searchSubject.subscribe((query) => {
      this.searchTerm.set(query);
      if (this.content) {
        setTimeout(() => {
          this.content.scrollToTop(300);
        }, 300);
      }
    });
    this.route.queryParams.subscribe((params) => {
      if (params['search']) {
        this.searchTerm.set(params['search']);
      }
    });
  }

  async ngOnInit(): Promise<void> {
    this.isPageLoading.set(true);
    try {
      await this.loadBalls();
    } catch (error) {
      console.error('Error loading balls:', error);
    } finally {
      this.isPageLoading.set(false);
    }
  }

  async handleRefresh(event: RefresherCustomEvent): Promise<void> {
    try {
      this.hapticService.vibrate(ImpactStyle.Medium);
      this.isPageLoading.set(true);
      this.currentPage = 0;
      this.hasMoreData = true;
      this.balls.set([]);
      if (this.isFilterActive()) {
        this.filterDisplayCount = 100;
      }
      await this.loadBalls();
      await this.storageService.loadAllBalls();
      await this.storageService.loadArsenal();
    } catch (error) {
      console.error(error);
      this.toastService.showToast(ToastMessages.ballLoadError, 'bug', true);
    } finally {
      event.target.complete();
      this.isPageLoading.set(false);
    }
  }

  searchBalls(event: SearchbarCustomEvent): void {
    const query = event.detail.value!.toLowerCase();
    this.searchSubject.next(query);
  }

  async removeFromArsenal(ball: Ball): Promise<void> {
    try {
      this.hapticService.vibrate(ImpactStyle.Light);
      await this.storageService.removeFromArsenal(ball);
      this.toastService.showToast(`${ball.ball_name} removed from Arsenal.`, 'checkmark-outline');
    } catch (error) {
      console.error(`Fehler beim Entfernen von ${ball.ball_name} aus dem Arsenal:`, error);
      this.toastService.showToast(ToastMessages.ballDeleteError, 'bug', true);
    }
  }

  async saveBallToArsenal(ball: Ball): Promise<void> {
    try {
      this.hapticService.vibrate(ImpactStyle.Light);
      await this.storageService.saveBallToArsenal(ball);
      this.toastService.showToast(`${ball.ball_name} added to Arsenal.`, 'add');
    } catch (error) {
      console.error(`Fehler beim Speichern von ${ball.ball_name} im Arsenal:`, error);
      this.toastService.showToast(ToastMessages.ballSaveError, 'bug', true);
    }
  }

  async openFilterModal(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: BallFilterComponent,
    });
    modal.onDidDismiss().then(() => {
      this.currentPage = 0;
      this.hasMoreData = true;
      this.filterDisplayCount = 100;
      if (this.content) {
        setTimeout(() => {
          this.content.scrollToTop(300);
        }, 300);
      }
    });
    return await modal.present();
  }

  async loadBalls(event?: InfiniteScrollCustomEvent): Promise<void> {
    try {
      if (!event) {
        // this.loadingService.setLoading(true);
      }
      // If filters are active and an infinite scroll event is triggered, increase the display count.
      if (this.isFilterActive() && event) {
        this.filterDisplayCount += 100;
        const totalFiltered = this.ballFilterService.filteredBalls().length;
        if (this.filterDisplayCount >= totalFiltered) {
          this.hasMoreData = false;
        }
        event.target.complete();
        return;
      }
      // Otherwise, load the next page from the API.
      const response = await this.ballService.loadBalls(this.currentPage);
      if (response.length > 0) {
        this.balls.set([...this.balls(), ...response]);
        this.currentPage++;
      } else {
        this.hasMoreData = false;
      }
    } catch (error) {
      console.error('Error fetching balls:', error);
      this.toastService.showToast(ToastMessages.ballLoadError, 'bug', true);
    } finally {
      if (!event) {
        this.loadingService.setLoading(false);
      }
      if (event && !this.isFilterActive()) {
        event.target.complete();
      }
    }
  }

  getLengthPotential(ball: Ball): string {
    const rg = parseFloat(ball.core_rg);
    if (isNaN(rg)) {
      return '';
    }

    if (rg < 2.52) {
      return 'Early Roll';
    } else if (rg < 2.58) {
      return 'Medium Roll';
    } else {
      return 'Late Roll';
    }
  }

  getFlarePotential(ball: Ball): string {
    const diff = parseFloat(ball.core_diff);
    if (isNaN(diff)) {
      return '';
    }

    if (diff < 0.035) {
      return 'Low Flare';
    } else if (diff < 0.05) {
      return 'Medium Flare';
    } else {
      return 'High Flare';
    }
  }

  async getSameCoreBalls(ball: Ball): Promise<void> {
    try {
      this.hapticService.vibrate(ImpactStyle.Light);
      this.loadingService.setLoading(true);
      this.coreBalls = await this.ballService.getBallsByCore(ball);
      if (this.coreBalls.length > 0) {
        this.coreModal.present();
      } else {
        this.toastService.showToast(`No similar balls found for core: ${ball.core_name}.`, 'information-circle-outline');
      }
    } catch (error) {
      console.error('Error fetching core balls:', error);
      this.toastService.showToast(`Error fetching balls for core ${ball.core_name}`, 'bug', true);
    } finally {
      this.loadingService.setLoading(false);
    }
  }

  async getSameCoverstockBalls(ball: Ball): Promise<void> {
    try {
      this.hapticService.vibrate(ImpactStyle.Light);
      this.loadingService.setLoading(true);
      this.coverstockBalls = await this.ballService.getBallsByCoverstock(ball);
      if (this.coverstockBalls.length > 0) {
        await this.coverstockModal.present();
      } else {
        this.toastService.showToast(`No similar balls found for coverstock: ${ball.coverstock_name}.`, 'information-circle-outline');
      }
    } catch (error) {
      console.error('Error fetching coverstock balls:', error);
      this.toastService.showToast(`Error fetching balls for coverstock ${ball.coverstock_name}`, 'bug', true);
    } finally {
      this.loadingService.setLoading(false);
    }
  }

  isInArsenal(ball: Ball): boolean {
    return this.storageService.arsenal().some((b: Ball) => b.ball_id === ball.ball_id && b.core_weight === ball.core_weight);
  }

  isFilterActive(): boolean {
    return this.ballFilterService.activeFilterCount() > 0;
  }

  onSortChanged(sortOption: any): void {
    this.currentSortOption = sortOption as BallSortOption;
    if (this.content) {
      setTimeout(() => {
        this.content.scrollToTop(300);
      }, 100);
    }
  }

  onScroll(event: any): void {
    const scrollTop = event.detail.scrollTop;
    const threshold = 100;
    
    if (this.sortHeader) {
      if (scrollTop > threshold) {
        this.sortHeader.hide();
      } else {
        this.sortHeader.show();
      }
    }
  }
}
