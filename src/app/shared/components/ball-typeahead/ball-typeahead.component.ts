import { Component, EventEmitter, Input, OnInit, Output, ViewChild, OnDestroy } from '@angular/core';
import Fuse from 'fuse.js';
import { Ball } from 'src/app/core/models/ball.model';
import {
  IonContent,
  IonSearchbar,
  IonList,
  IonItem,
  IonAvatar,
  IonImg,
  IonLabel,
  IonHeader,
  IonToolbar,
  IonCheckbox,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonTitle,
  IonButtons,
  IonButton,
} from '@ionic/angular/standalone';
import { InfiniteScrollCustomEvent, ModalController, SearchbarCustomEvent, AlertController } from '@ionic/angular';
import { StorageService } from 'src/app/core/services/storage/storage.service';
import { ToastService } from 'src/app/core/services/toast/toast.service';
import { Keyboard } from '@capacitor/keyboard';
import { SearchBlurDirective } from 'src/app/core/directives/search-blur/search-blur.directive';

@Component({
  selector: 'app-ball-typeahead',
  templateUrl: './ball-typeahead.component.html',
  styleUrls: ['./ball-typeahead.component.scss'],
  standalone: true,
  imports: [
    IonButton,
    IonButtons,
    IonTitle,
    IonInfiniteScrollContent,
    IonInfiniteScroll,
    IonCheckbox,
    IonToolbar,
    IonHeader,
    IonLabel,
    IonImg,
    IonAvatar,
    IonItem,
    IonList,
    IonSearchbar,
    IonContent,
    IonContent,
    IonSearchbar,
    IonLabel,
    IonImg,
    IonAvatar,
    IonItem,
    IonList,
    SearchBlurDirective,
  ],
})
export class BallTypeaheadComponent implements OnInit, OnDestroy {
  @Input() balls: Ball[] = [];
  @Output() selectedBallsChange = new EventEmitter<Ball[]>();
  @ViewChild('infiniteScroll') infiniteScroll!: IonInfiniteScroll;
  @ViewChild(IonContent, { static: false }) content!: IonContent;
  filteredBalls: Ball[] = [];
  displayedBalls: Ball[] = [];
  fuse!: Fuse<Ball>;
  selectedBalls: Ball[] = [];
  private batchSize = 100;
  public loadedCount = 0;

  constructor(
    public storageService: StorageService,
    private modalCtrl: ModalController,
    private alertController: AlertController,
    private toastService: ToastService,
  ) {}

  blur(search: IonSearchbar): void {
    search.getInputElement().then((input) => {
      input.blur();
      Keyboard.hide();
    });
  }
  ngOnInit(): void {
    this.filteredBalls = [...this.balls];
    this.displayedBalls = this.filteredBalls.slice(0, this.batchSize);
    this.loadedCount = this.batchSize;

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
    this.fuse = new Fuse(this.balls, options);
  }

  loadData(event: InfiniteScrollCustomEvent): void {
    setTimeout(() => {
      if (this.loadedCount < this.filteredBalls.length) {
        this.displayedBalls = this.filteredBalls.slice(0, this.loadedCount + this.batchSize);
        this.loadedCount += this.batchSize;
      }
      event.target.complete();

      if (this.loadedCount >= this.filteredBalls.length) {
        event.target.disabled = true;
      }
    }, 50);
  }

  searchBalls(event: SearchbarCustomEvent): void {
    const searchTerm = event.detail.value!.toLowerCase();
    if (searchTerm && searchTerm.trim() !== '') {
      const result = this.fuse.search(searchTerm);
      this.filteredBalls = result.map((res) => res.item);
    } else {
      this.filteredBalls = [...this.balls];
    }

    this.loadedCount = this.batchSize;
    this.displayedBalls = this.filteredBalls.slice(0, this.batchSize);

    this.infiniteScroll.disabled = this.loadedCount >= this.filteredBalls.length;

    setTimeout(() => {
      this.content.scrollToTop(300);
    }, 300);
  }

  resetBallSelection() {
    this.selectedBalls = [];
  }

  async saveBallSelection() {
    if (this.selectedBalls.length === 0) {
      this.modalCtrl.dismiss();
      return;
    }

    const arsenals = this.storageService.arsenals();
    if (arsenals.length === 1) {
      // Only one arsenal, save directly
      this.selectedBallsChange.emit(this.selectedBalls);
      this.modalCtrl.dismiss();
      return;
    }

    // Multiple arsenals, ask user to select
    const inputs = arsenals.map(arsenal => ({
      name: 'arsenal',
      type: 'radio' as const,
      label: arsenal,
      value: arsenal,
      checked: arsenal === this.storageService.currentArsenal()
    }));

    const alert = await this.alertController.create({
      header: 'Select Arsenal',
      message: 'Which arsenal would you like to add these balls to?',
      inputs,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Add',
          handler: async (selectedArsenal) => {
            if (selectedArsenal) {
              // Save balls to selected arsenal
              let successCount = 0;
              let errorCount = 0;
              
              for (const ball of this.selectedBalls) {
                try {
                  await this.storageService.saveBallToArsenal(ball, selectedArsenal);
                  successCount++;
                } catch (error) {
                  console.error(`Error saving ball ${ball.ball_name}:`, error);
                  errorCount++;
                }
              }
              
              if (successCount > 0) {
                const ballNames = this.selectedBalls.slice(0, Math.min(successCount, this.selectedBalls.length)).map(b => b.ball_name).join(', ');
                this.toastService.showToast(`${successCount} ball(s) added to ${selectedArsenal}`, 'checkmark-outline');
              }
              
              if (errorCount > 0) {
                this.toastService.showToast(`Failed to add ${errorCount} ball(s)`, 'bug', true);
              }
              
              this.modalCtrl.dismiss();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  checkboxChange(event: CustomEvent): void {
    const checked = event.detail.checked;
    const value = event.detail.value;

    if (checked) {
      this.selectedBalls = [...this.selectedBalls, value];
    } else {
      this.selectedBalls = this.selectedBalls.filter((item) => item !== value);
    }
  }

  isChecked(ball: Ball): boolean {
    return this.selectedBalls.includes(ball);
  }
  ngOnDestroy(): void {
    // Balls are now saved manually through the save button
    // This method intentionally left empty as cleanup is not needed
  }
}
