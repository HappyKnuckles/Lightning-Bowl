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

    const allArsenals = this.storageService.arsenals();
    if (allArsenals.length === 1) {
      // Only one arsenal, check if any balls already exist there
      const existingBalls: string[] = [];
      const validBalls: Ball[] = [];
      
      for (const ball of this.selectedBalls) {
        const ballExists = await this.storageService.ballExistsInArsenal(ball, allArsenals[0]);
        if (ballExists) {
          existingBalls.push(`${ball.ball_name} (${ball.core_weight}lbs)`);
        } else {
          validBalls.push(ball);
        }
      }
      
      if (existingBalls.length > 0) {
        const message = existingBalls.length === 1
          ? `${existingBalls[0]} already exists in ${allArsenals[0]}.`
          : `The following balls already exist in ${allArsenals[0]}:\n${existingBalls.join('\n')}`;
        
        if (validBalls.length > 0) {
          const alert = await this.alertController.create({
            header: 'Some Balls Already Exist',
            message: message + `\n\nWould you like to add the remaining ${validBalls.length} ball(s)?`,
            buttons: [
              {
                text: 'Cancel',
                role: 'cancel'
              },
              {
                text: 'Add Others',
                handler: () => {
                  this.selectedBallsChange.emit(validBalls);
                  this.modalCtrl.dismiss();
                }
              }
            ]
          });
          await alert.present();
        } else {
          this.toastService.showToast('All selected balls already exist in the arsenal', 'information-circle-outline');
          this.modalCtrl.dismiss();
        }
        return;
      }
      
      this.selectedBallsChange.emit(this.selectedBalls);
      this.modalCtrl.dismiss();
      return;
    }

    // Multiple arsenals, ask user to select (but filter out arsenals that already contain balls)
    const availableArsenalsByBall: Record<string, string[]> = {};
    
    // For each ball, determine which arsenals it can be added to
    for (const ball of this.selectedBalls) {
      const ballKey = `${ball.ball_id}_${ball.core_weight}`;
      availableArsenalsByBall[ballKey] = [];
      
      for (const arsenal of allArsenals) {
        const ballExists = await this.storageService.ballExistsInArsenal(ball, arsenal);
        if (!ballExists) {
          availableArsenalsByBall[ballKey].push(arsenal);
        }
      }
    }
    
    // Find arsenals that can accept at least one ball
    const viableArsenals = new Set<string>();
    Object.values(availableArsenalsByBall).forEach(arsenals => {
      arsenals.forEach(arsenal => viableArsenals.add(arsenal));
    });
    
    if (viableArsenals.size === 0) {
      this.toastService.showToast('All selected balls already exist in all arsenals', 'information-circle-outline');
      this.modalCtrl.dismiss();
      return;
    }

    const inputs = Array.from(viableArsenals).map(arsenal => ({
      name: 'arsenals',
      type: 'checkbox' as const,
      label: arsenal,
      value: arsenal,
      checked: arsenal === this.storageService.currentArsenal()
    }));

    const alert = await this.alertController.create({
      header: 'Select Arsenals',
      message: 'Which arsenal(s) would you like to add these balls to? Only arsenals that don\'t already contain these balls are shown.',
      inputs,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Add',
          handler: async (selectedArsenals: string[]) => {
            if (selectedArsenals && selectedArsenals.length > 0) {
              let totalSuccessCount = 0;
              let totalErrorCount = 0;
              let duplicateCount = 0;
              const addedToArsenals: string[] = [];
              
              // Save balls to each selected arsenal
              for (const arsenalName of selectedArsenals) {
                let arsenalSuccessCount = 0;
                
                for (const ball of this.selectedBalls) {
                  const ballKey = `${ball.ball_id}_${ball.core_weight}`;
                  
                  // Check if this ball can be added to this arsenal
                  if (availableArsenalsByBall[ballKey].includes(arsenalName)) {
                    try {
                      await this.storageService.saveBallToArsenal(ball, arsenalName);
                      arsenalSuccessCount++;
                      totalSuccessCount++;
                    } catch (error) {
                      console.error(`Error saving ball ${ball.ball_name} to ${arsenalName}:`, error);
                      totalErrorCount++;
                    }
                  } else {
                    duplicateCount++;
                  }
                }
                
                if (arsenalSuccessCount > 0) {
                  addedToArsenals.push(arsenalName);
                }
              }
              
              // Show success message
              if (totalSuccessCount > 0) {
                const arsenalList = addedToArsenals.join(', ');
                const message = selectedArsenals.length === 1 
                  ? `${totalSuccessCount} ball(s) added to ${arsenalList}`
                  : `${totalSuccessCount} ball(s) added to ${addedToArsenals.length} arsenal(s): ${arsenalList}`;
                this.toastService.showToast(message, 'checkmark-outline');
              }
              
              // Show error message if any
              if (totalErrorCount > 0) {
                this.toastService.showToast(`Failed to add ${totalErrorCount} ball(s)`, 'bug', true);
              }
              
              // Show duplicate message if any
              if (duplicateCount > 0) {
                this.toastService.showToast(`${duplicateCount} ball(s) were skipped (already exist)`, 'information-circle-outline');
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
    // Cleanup is handled automatically by Angular lifecycle
  }
}
