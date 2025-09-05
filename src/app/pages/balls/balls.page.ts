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
  IonPopover,
  IonRippleEffect,
  IonList,
  IonRefresherContent,
  IonRefresher,
  IonSkeletonText,
  IonItem,
  IonLabel,
  IonModal,
  AlertController
} from '@ionic/angular/standalone';
import { Ball } from 'src/app/core/models/ball.model';
import { addIcons } from 'ionicons';
import { globeOutline, camera, addOutline, filterOutline, openOutline, closeCircle, heart, heartOutline, documentTextOutline, addCircleOutline, removeCircleOutline } from 'ionicons/icons';
import { InfiniteScrollCustomEvent, ModalController, RefresherCustomEvent, SearchbarCustomEvent, AlertController as IonicAlertController } from '@ionic/angular';
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
import { GenericFilterActiveComponent } from 'src/app/shared/components/generic-filter-active/generic-filter-active.component';
import { BALL_FILTER_CONFIGS } from 'src/app/shared/components/filter-configs/filter-configs';
import { BallFilterComponent } from 'src/app/shared/components/ball-filter/ball-filter.component';
import { BallListComponent } from 'src/app/shared/components/ball-list/ball-list.component';
import { ActivatedRoute } from '@angular/router';
import { SearchBlurDirective } from 'src/app/core/directives/search-blur/search-blur.directive';
import { LongPressDirective } from 'src/app/core/directives/long-press/long-press.directive';
import { SortHeaderComponent } from 'src/app/shared/components/sort-header/sort-header.component';
import { SortService } from 'src/app/core/services/sort/sort.service';
import { BallSortOption, BallSortField, SortDirection } from 'src/app/core/models/sort.model';
import { NetworkService } from 'src/app/core/services/network/network.service';
import { FavoritesService } from 'src/app/core/services/favorites/favorites.service';

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
    IonPopover,
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
    GenericFilterActiveComponent,
    SearchBlurDirective,
    LongPressDirective,
    SortHeaderComponent,
    IonItem,
    IonLabel,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BallsPage implements OnInit {
  @ViewChild('core', { static: false }) coreModal!: IonModal;
  @ViewChild('coverstock', { static: false }) coverstockModal!: IonModal;
  @ViewChild('contextMenu', { static: false }) contextMenu!: IonPopover;
  @ViewChild(IonContent, { static: false }) content!: IonContent;

  ballFilterConfigs = BALL_FILTER_CONFIGS;
  selectedBall: Ball | null = null;
  selectedBallId = '';

  get currentFilters(): Record<string, unknown> {
    return this.ballFilterService.filters() as unknown as Record<string, unknown>;
  }

  get defaultFilters(): Record<string, unknown> {
    return this.ballFilterService.defaultFilters as unknown as Record<string, unknown>;
  }

  balls = signal<Ball[]>([]);
  coreBalls: Ball[] = [];
  coverstockBalls: Ball[] = [];
  searchSubject = new Subject<string>();
  searchTerm = signal('');
  favoritesFirst = signal(false);
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
  // • If a search term exists, we build a Fuse instance over the correct data source and return results sorted by relevance.
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

      // Return search results without additional sorting to preserve relevance ranking
      return result;
    } else {
      result = this.isFilterActive() ? this.ballFilterService.filteredBalls() : this.balls();
      if (this.isFilterActive()) {
        result = result.slice(0, this.filterDisplayCount);
      }
      this.hasMoreData = true;
    }

    // Apply sorting only when not searching
    return this.sortService.sortBalls(result, this.currentSortOption, this.favoritesFirst());
  }

  private lastLoadTime = 0;
  private debounceMs = 300;

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
    private networkService: NetworkService,
    public favoritesService: FavoritesService,
    private alertCtrl: AlertController,
  ) {
    addIcons({ filterOutline, closeCircle, globeOutline, openOutline, addOutline, camera, heart, heartOutline, documentTextOutline, addCircleOutline, removeCircleOutline });
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
    this.loadFavoritesFirstSetting();
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

  async removeFromArsenal(event: Event, ball: Ball): Promise<void> {
    event.stopPropagation();
    try {
      this.hapticService.vibrate(ImpactStyle.Light);
      await this.storageService.removeFromArsenal(ball);
      this.toastService.showToast(`${ball.ball_name} removed from Arsenal.`, 'checkmark-outline');
    } catch (error) {
      console.error(`Fehler beim Entfernen von ${ball.ball_name} aus dem Arsenal:`, error);
      this.toastService.showToast(ToastMessages.ballDeleteError, 'bug', true);
    }
  }

  async saveBallToArsenal(event: Event, ball: Ball): Promise<void> {
    event.stopPropagation();
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
    const now = Date.now();
    if (now - this.lastLoadTime < this.debounceMs) {
      if (event) event.target.complete();
      return;
    }
    this.lastLoadTime = now;

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
      } else if (this.networkService.isOffline) {
        this.toastService.showToast('You are offline and no cached data is available.', 'information-circle-outline', true);
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

  async getSameCoreBalls(event: Event, ball: Ball): Promise<void> {
    event.stopPropagation();
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

  async getSameCoverstockBalls(event: Event, ball: Ball): Promise<void> {
    event.stopPropagation();
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

  onSortChanged(sortOption: unknown): void {
    this.currentSortOption = sortOption as BallSortOption;
    if (this.content) {
      setTimeout(() => {
        this.content.scrollToTop(300);
      }, 100);
    }
  }

  toggleFavorite(event: Event, ball: Ball): void {
    event.stopPropagation();
    const isFavorited = this.favoritesService.toggleBallFavorite(ball.ball_id, ball.core_weight);

    if (isFavorited) {
      this.toastService.showToast(`Added ${ball.ball_name} to favorites`, 'heart');
    } else {
      this.toastService.showToast(`Removed ${ball.ball_name} from favorites`, 'heart-outline');
    }
  }

  onFavoritesFirstChange(checked: boolean): void {
    this.favoritesFirst.set(checked);
    this.saveFavoritesFirstSetting(checked);
    if (this.content) {
      setTimeout(() => {
        this.content.scrollToTop(300);
      }, 100);
    }
  }

  async showContextMenu(event: PointerEvent, ball: Ball): Promise<void> {
    try {
      this.hapticService.vibrate(ImpactStyle.Medium);
      this.selectedBall = ball;
      this.selectedBallId = `ball-card-${ball.ball_id}-${ball.core_weight}`;
      await this.contextMenu.present();
    } catch (error) {
      console.error('Error showing context menu:', error);
      this.toastService.showToast('Error showing context menu', 'bug', true);
    }
  }

  async addNoteToball(): Promise<void> {
    if (!this.selectedBall) return;

    const alert = await this.alertCtrl.create({
      header: 'Add Note',
      subHeader: this.selectedBall.ball_name,
      inputs: [
        {
          name: 'note',
          type: 'textarea',
          placeholder: 'Enter your personal note about this ball...',
          value: this.selectedBall.note || '',
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Save',
          handler: (data) => {
            this.updateBallNote(this.selectedBall!, data.note);
          },
        },
      ],
    });

    await alert.present();
  }

  async toggleArsenalFromContext(): Promise<void> {
    if (!this.selectedBall) return;

    if (this.isInArsenal(this.selectedBall)) {
      await this.removeFromArsenal(new Event('click'), this.selectedBall);
    } else {
      await this.saveBallToArsenal(new Event('click'), this.selectedBall);
    }
  }

  async toggleFavoriteFromContext(): Promise<void> {
    if (!this.selectedBall) return;
    this.toggleFavorite(new Event('click'), this.selectedBall);
  }

  isSelectedBallInArsenal(): boolean {
    return this.selectedBall ? this.isInArsenal(this.selectedBall) : false;
  }

  isSelectedBallFavorite(): boolean {
    return this.selectedBall ? this.favoritesService.isBallFavorite(this.selectedBall.ball_id, this.selectedBall.core_weight) : false;
  }

  async updateBallNote(ball: Ball, note?: string): Promise<void> {
    try {
      // Use provided note or existing ball note
      const updatedNote = note !== undefined ? note : ball.note;
      ball.note = updatedNote;
      
      // Find the ball in all balls and update it
      const allBalls = this.storageService.allBalls();
      const ballIndex = allBalls.findIndex(b => b.ball_id === ball.ball_id && b.core_weight === ball.core_weight);
      if (ballIndex !== -1) {
        allBalls[ballIndex].note = ball.note;
      }

      // Also update in arsenal if it exists there
      const arsenalBalls = this.storageService.arsenal();
      const arsenalIndex = arsenalBalls.findIndex(b => b.ball_id === ball.ball_id && b.core_weight === ball.core_weight);
      if (arsenalIndex !== -1) {
        arsenalBalls[arsenalIndex].note = ball.note;
        await this.storageService.saveBallToArsenal(ball);
      }

      this.toastService.showToast(`Note updated for ${ball.ball_name}`, 'checkmark-outline');
    } catch (error) {
      console.error(`Error updating note for ball ${ball.ball_name}:`, error);
      this.toastService.showToast(`Failed to update note for ${ball.ball_name}.`, 'bug', true);
    }
  }

  private loadFavoritesFirstSetting(): void {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('balls-favorites-first');
      if (saved !== null) {
        this.favoritesFirst.set(saved === 'true');
      }
    }
  }

  private saveFavoritesFirstSetting(value: boolean): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('balls-favorites-first', value.toString());
    }
  }
}
