import { Component, effect, OnInit } from '@angular/core';
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
} from '@ionic/angular/standalone';
import { Ball } from 'src/app/models/ball.model';
import { addIcons } from 'ionicons';
import { globeOutline, camera, addOutline, filterOutline } from 'ionicons/icons';
import { ModalController } from '@ionic/angular';
import { BallFilterComponent } from 'src/app/components/ball-filter/ball-filter.component';
import { StorageService } from 'src/app/services/storage/storage.service';
import { ToastService } from 'src/app/services/toast/toast.service';
import { LoadingService } from 'src/app/services/loader/loading.service';
import Fuse from 'fuse.js';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-balls',
  templateUrl: './balls.page.html',
  styleUrls: ['./balls.page.scss'],
  standalone: true,
  providers: [ModalController],
  imports: [
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
  ],
})
export class BallsPage implements OnInit {
  balls: Ball[] = [];
  filteredBalls: Ball[] = [];
  searchTerm: string = '';
  currentPage = 1;
  hasMoreData = true;
  activeFilterCount = 0;
  url = 'https://bowwwl.com/';
  fuse!: Fuse<Ball>;
  searchSubject: Subject<string> = new Subject();

  constructor(
    private modalCtrl: ModalController,
    public loadingService: LoadingService,
    private storageService: StorageService,
    private toastService: ToastService
  ) {
    addIcons({ filterOutline, globeOutline, addOutline, camera });
    this.searchSubject.pipe().subscribe((query) => {
      this.performSearch(query);
    });
    effect(() => {
      const options = {
        keys: [
          { name: 'ball_name', weight: 1 },
          { name: 'brand_name', weight: 1 },
          { name: 'core_name', weight: 0.7 },
          { name: 'coverstock_name', weight: 0.7 },
          { name: 'factory_finish', weight: 0.5 },
        ],
        threshold: 0.3,
        ignoreLocation: false,
        minMatchCharLength: 3,
        includeMatches: true,
        includeScore: true,
        shouldSort: true,
        useExtendedSearch: false,
      };
      this.fuse = new Fuse(this.storageService.allBalls(), options);
    });
  }

  async ngOnInit() {
    this.loadingService.setLoading(true);
    try {
      await this.loadBalls();
      this.filteredBalls.sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime());
    } catch (error) {
      console.error('Error loading balls:', error);
    } finally {
      this.loadingService.setLoading(false);
      this.storageService.allBalls().sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime());
    }
  }

  searchBalls(event: any) {
    const query = event.target.value.toLowerCase();
    this.searchTerm = query;
    this.searchSubject.next(query);
  }

  performSearch(query: string) {
    if (query !== '') {
      this.hasMoreData = false;
      this.filteredBalls = this.fuse.search(query).map(result => result.item);
    } else {
      this.hasMoreData = true;
      this.filteredBalls = this.balls;
    }
  }

  async removeFromArsenal(ball: Ball) {
    await this.storageService.removeFromArsenal(ball);
    this.toastService.showToast('Ball removed from Arsenal.', 'remove-outline');
  }

  isInArsenal(ball: Ball): boolean {
    return this.storageService.arsenal().some((b) => b.ball_id === ball.ball_id);
  }

  async saveBallToArsenal(ball: Ball) {
    await this.storageService.saveToArsenal(ball);
    this.toastService.showToast('Ball added to Arsenal.', 'add');
  }

  async openFilterModal() {
    const modal = await this.modalCtrl.create({
      component: BallFilterComponent,
    });

    return await modal.present();
  }

  async loadBalls(event?: any) {
    try {
      const response = await fetch(`restapi/balls/v2?page=${this.currentPage}`);
      const data = await response.json();

      if (data.length > 0) {
        this.balls = [...this.balls, ...data];
        this.filteredBalls = this.balls;
        this.currentPage++;
      } else {
        this.hasMoreData = false;
      }

      if (event) {
        event.target.complete();
      }
    } catch (error) {
      console.error('Error fetching balls:', error);
      if (event) {
        event.target.complete();
      }
    }
  }
}
