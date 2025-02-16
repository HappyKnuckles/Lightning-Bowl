import { Component, OnDestroy, OnInit } from '@angular/core';
import { AlertController, IonApp, IonBackdrop, IonSpinner, IonRouterOutlet } from '@ionic/angular/standalone';
import { ToastService } from './services/toast/toast.service';
import { LoadingService } from './services/loader/loading.service';
import { UserService } from './services/user/user.service';
import { Subscription } from 'rxjs';
import { NgIf } from '@angular/common';
import { ToastComponent } from './components/toast/toast.component';
import { SwUpdate } from '@angular/service-worker';
import { register } from 'swiper/element/bundle';
import { ThemeChangerService } from './services/theme-changer/theme-changer.service';
import { HttpClient } from '@angular/common/http';
import { GameStatsService } from './services/game-stats/game-stats.service';
import { StorageService } from './services/storage/storage.service';
register();

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonApp, NgIf, IonBackdrop, IonSpinner, IonRouterOutlet, ToastComponent],
})
export class AppComponent implements OnInit, OnDestroy {
  private userNameSubscription: Subscription;
  commitMessage = '';
  username = '';

  constructor(
    private alertController: AlertController,
    private toastService: ToastService,
    public loadingService: LoadingService,
    private userService: UserService,
    private swUpdate: SwUpdate,
    private themeService: ThemeChangerService,
    private http: HttpClient,
    private gameStatsService: GameStatsService,
    private storageService: StorageService
  ) // private gameFilterService: GameFilterService
  {
    this.initializeApp();
    const currentTheme = this.themeService.getCurrentTheme();
    this.themeService.applyTheme(currentTheme);
    this.userNameSubscription = this.userService.getUsername().subscribe((username: string) => {
      this.username = username;
    });
  }

  async ngOnInit(): Promise<void> {
    // Load stats here initially so prevstats are loaded before the first game
    const gameHistory = await this.storageService.loadGameHistory();
    // this.gameFilterService.setDefaultFilters();
    // this.gameFilterService.filterGames();
    this.gameStatsService.calculateStats(gameHistory);
    this.greetUser();
  }

  ngOnDestroy(): void {
    this.userNameSubscription.unsubscribe();
  }

  //TODO maybe implement custom alert to have title etc instead of confirm
  private initializeApp(): void {
    // Listen for version updates and prompt the user
    this.swUpdate.versionUpdates.subscribe((event) => {
      if (event.type === 'VERSION_READY') {
        const lastCommitDate = localStorage.getItem('lastCommitDate');
        const sinceParam = lastCommitDate ? `&since=${lastCommitDate}` : '';
        const apiUrl = `https://api.github.com/repos/HappyKnuckles/bowling-stats/commits?sha=master${sinceParam}`;

        // Fetch the latest commits from the master branch on GitHub
        this.http.get(apiUrl).subscribe({
          next: (data: any) => {
            const newCommits = [];

            for (const commit of data) {
              const commitDate = new Date(commit.commit.committer.date).toISOString();
              if (commitDate !== lastCommitDate) {
                newCommits.push(commit.commit.message);
              }
            }

            if (newCommits.length > 0) {
              const commitMessages = newCommits.join('\n');
              if (confirm(`**New Version Available**\n\nChanges:\n${commitMessages}\n\nLoad it?`)) {
                localStorage.setItem('lastCommitDate', new Date(data[0].commit.committer.date).toISOString());
                window.location.reload();
              }
            }
          },
          error: (error) => {
            console.error('Failed to fetch the latest commits:', error);
            if (confirm('A new version is available. Load it?')) {
              window.location.reload();
            }
          },
        });
      }
    });
  }

  private async greetUser(): Promise<void> {
    if (!this.username) {
      await this.showEnterNameAlert();
    } else {
      this.presentGreetingAlert(this.username);
    }
  }

  private async showEnterNameAlert() {
    const alert = await this.alertController.create({
      header: 'Welcome!',
      message: 'Please enter your name:',
      inputs: [
        {
          name: 'username',
          type: 'text',
          placeholder: 'Your Name',
          cssClass: 'alert-input',
        },
      ],
      buttons: [
        {
          text: 'Confirm',
          handler: (data) => {
            const newName = data.username.trim();
            if (newName !== '') {
              this.userService.setUsername(newName);
              this.toastService.showToast(`Name updated to ${this.username}`, 'reload-outline');
            }
          },
        },
      ],
      cssClass: 'alert-header-white alert-message-white',
    });

    await alert.present();
  }

  private async presentGreetingAlert(name: string): Promise<void> {
    const alert = await this.alertController.create({
      header: `Hello ${name}!`,
      buttons: [
        {
          text: 'Hi',
        },
        {
          text: 'Change Name',
          handler: () => {
            this.showEnterNameAlert();
          },
        },
      ],
      cssClass: 'alert-header-white alert-message-white',
    });

    await alert.present();
  }
}
