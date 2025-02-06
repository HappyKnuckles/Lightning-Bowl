import { Component, computed, OnInit, ViewChild } from '@angular/core';
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
  IonText, IonModal, IonRippleEffect, IonList, IonRefresherContent, IonRefresher
} from '@ionic/angular/standalone';
import { Ball } from 'src/app/models/ball.model';
import { addIcons } from 'ionicons';
import { globeOutline, camera, addOutline, filterOutline } from 'ionicons/icons';
import { InfiniteScrollCustomEvent, ModalController } from '@ionic/angular';
import { BallFilterComponent } from 'src/app/components/ball-filter/ball-filter.component';
import { StorageService } from 'src/app/services/storage/storage.service';
import { ToastService } from 'src/app/services/toast/toast.service';
import { LoadingService } from 'src/app/services/loader/loading.service';
import Fuse from 'fuse.js';
import { firstValueFrom, Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { BallListComponent } from 'src/app/components/ball-list/ball-list.component';
import { HapticService } from 'src/app/services/haptic/haptic.service';
import { ImpactStyle } from '@capacitor/haptics';

@Component({
  selector: 'app-balls',
  templateUrl: './balls.page.html',
  styleUrls: ['./balls.page.scss'],
  standalone: true,
  providers: [ModalController],
  imports: [IonRefresher, IonRefresherContent, IonList, IonRippleEffect, IonModal,
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
    BallListComponent],
})
export class BallsPage implements OnInit {
  @ViewChild('core', { static: false }) coreModal!: IonModal;
  @ViewChild('coverstock', { static: false }) coverstockModal!: IonModal;
  @ViewChild(IonContent, { static: false }) content!: IonContent;
  coverstockBalls: Ball[] = [];
  coreBalls: Ball[] = [];
  balls: Ball[] = [];
  filteredBalls: Ball[] = [];
  searchTerm: string = '';
  currentPage = 0;
  hasMoreData = true;
  activeFilterCount = 0;
  fuse = computed(() => {
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
    return new Fuse(this.storageService.allBalls(), options);
  });
  searchSubject: Subject<string> = new Subject();
  constructor(
    private modalCtrl: ModalController,
    public loadingService: LoadingService,
    public storageService: StorageService,
    private toastService: ToastService,
    private http: HttpClient,
    private hapticService: HapticService
  ) {
    addIcons({ filterOutline, globeOutline, addOutline, camera });
    this.searchSubject.pipe().subscribe((query) => {
      this.performSearch(query);
    });
  }

  async ngOnInit(): Promise<void> {
    this.loadingService.setLoading(true);
    try {
      await this.loadBalls();
      this.filteredBalls.sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime());
    } catch (error) {
      console.error('Error loading balls:', error);
    } finally {
      this.loadingService.setLoading(false);
      // console.log(this.storageService.allBalls());
      // this.storageService.allBalls().sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime());
    }
  }

  async handleRefresh(event: any): Promise<void> {
    try {
      this.hapticService.vibrate(ImpactStyle.Medium, 200);
      this.loadingService.setLoading(true);
      this.currentPage = 0;
      this.hasMoreData = true;
      await this.loadBalls();
      await this.storageService.loadAllBalls();
      await this.storageService.loadArsenal();
    } catch (error) {
      console.error(error);
    } finally {
      event.target.complete();
      this.loadingService.setLoading(false);
    }
  }

  searchBalls(event: any): void {
    const query = event.target.value.toLowerCase();
    this.searchTerm = query;
    this.searchSubject.next(query);
  }

  async removeFromArsenal(ball: Ball): Promise<void> {
    await this.storageService.removeFromArsenal(ball);
    this.toastService.showToast(`${ball.ball_name} removed from Arsenal.`, 'checkmark-outline');
  }

  isInArsenal(ball: Ball): boolean {
    return this.storageService.arsenal().some((b) => b.ball_id === ball.ball_id);
  }

  async saveBallToArsenal(ball: Ball): Promise<void> {
    await this.storageService.saveBallToArsenal(ball);
    this.toastService.showToast(`${ball.ball_name} added to Arsenal.`, 'add');
  }

  async openFilterModal(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: BallFilterComponent,
    });

    return await modal.present();
  }

  async loadBalls(event?: InfiniteScrollCustomEvent): Promise<void> {
    try {
      const data = await firstValueFrom(this.http.get<Ball[]>(`restapi/balls/v2?page=${this.currentPage}`));

      if (data.length > 0) {
        this.balls = [...this.balls, ...data];
        this.filteredBalls = this.balls;
        this.currentPage++;
      } else {
        this.hasMoreData = false;
      }
    } catch (error) {
      console.error('Error fetching balls:', error);
      this.toastService.showToast(`Error fetching balls: ${error}`, 'bug', true);
    } finally {
      if (event) {
        event.target.complete();
      }
    }
  }

  async getSameCoreBalls(ball: Ball): Promise<void> {
    try {
      const response = await firstValueFrom(this.http.get<Ball[]>(`restapi/balls/v2?core=${ball.core_name}`));
      this.coreBalls = response.filter(coreBall => coreBall.ball_id !== ball.ball_id);

      if (this.coreBalls.length > 0) {
        this.loadingService.setLoading(true);
        this.coreModal.present();
      }
    } catch (error) {
      console.error('Error fetching core balls:', error);
      this.toastService.showToast(`Error fetching balls for core ${ball.core_name}: ${error}`, 'bug', true);
    } finally {
      this.loadingService.setLoading(false);
    }
  }

  async getSameCoverstockBalls(ball: Ball): Promise<void> {
    try {
      const response = await firstValueFrom(this.http.get<Ball[]>(`restapi/balls/v2?coverstock=${ball.coverstock_name}`));
      this.coverstockBalls = response.filter(coverstockBall => coverstockBall.ball_id !== ball.ball_id);

      if (this.coverstockBalls.length > 0) {
        this.loadingService.setLoading(true);
        await this.coverstockModal.present();
      }
    } catch (error) {
      console.error('Error fetching coverstock balls:', error);
      this.toastService.showToast(`Error fetching balls for coverstock ${ball.coverstock_name}: ${error}`, 'bug', true);
    } finally {
      this.loadingService.setLoading(false);
    }
  }

  private performSearch(query: string): void {
    if (query !== '') {
      this.hasMoreData = false;
      this.filteredBalls = this.fuse()
        .search(query)
        .map((result) => result.item);
    } else {
      this.hasMoreData = true;
      this.filteredBalls = this.balls;
    }
    this.content.scrollToTop(300);
  }
}
