import { Component, OnInit } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonContent,
  IonInput,
  IonIcon,
  IonTitle,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonLabel,
  IonButton,
  IonTextarea,
  IonModal,
  IonButtons,
  IonList,
} from '@ionic/angular/standalone';
import { FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import {
  colorPaletteOutline,
  logoGithub,
  personCircleOutline,
  sendOutline,
  addOutline,
  mailOutline,
  chevronBack,
  refreshCircleOutline,
  chevronBackOutline,
} from 'ionicons/icons';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { ToastService } from 'src/app/core/services/toast/toast.service';
import { UserService } from 'src/app/core/services/user/user.service';
import { ThemeChangerService } from 'src/app/core/services/theme-changer/theme-changer.service';
import { environment } from 'src/environments/environment';
import emailjs from '@emailjs/browser';
import { LoadingService } from 'src/app/core/services/loader/loading.service';
import { ToastMessages } from 'src/app/core/constants/toast-messages.constants';
import { LeagueSelectorComponent } from 'src/app/shared/components/league-selector/league-selector.component';
import { SpareNamesComponent } from 'src/app/shared/components/spare-names/spare-names.component';
import { GameStatsService } from 'src/app/core/services/game-stats/game-stats.service';
import { AlertController, InputCustomEvent } from '@ionic/angular';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [
    IonList,
    IonButtons,
    IonModal,
    IonTextarea,
    IonButton,
    IonLabel,
    IonCardContent,
    IonCardTitle,
    IonCardHeader,
    IonCard,
    IonItem,
    IonTitle,
    IonIcon,
    IonInput,
    IonContent,
    IonToolbar,
    IonHeader,
    IonSelect,
    IonSelectOption,
    NgClass,
    NgFor,
    FormsModule,
    ReactiveFormsModule,
    LeagueSelectorComponent,
    SpareNamesComponent,
    NgIf
  ],
})
export class SettingsPage implements OnInit {
  username: string | null = '';
  currentColor: string | null = '';
  optionsWithClasses: { name: string; class: string }[] = [
    { name: 'Blue', class: 'blue-option' },
    { name: 'Lila', class: 'lila-option' },
    { name: 'Green', class: 'green-option' },
    { name: 'Red', class: 'red-option' },
    { name: 'Gray', class: 'gray-option' },
  ];
  userEmail = '';
  feedbackMessage = '';
  updateAvailable = false;
  constructor(
    private userService: UserService,
    private toastService: ToastService,
    private loadingService: LoadingService,
    private themeService: ThemeChangerService,
    private statsService: GameStatsService,
    private alertCtrl: AlertController,
  ) {
    addIcons({
      personCircleOutline,
      colorPaletteOutline,
      logoGithub,
      mailOutline,
      refreshCircleOutline,
      chevronBackOutline,
      addOutline,
      chevronBack,
      sendOutline,
    });
  }

  ngOnInit(): void {
    this.currentColor = this.themeService.getCurrentTheme();

    this.userService.getUsername().subscribe((username: string) => {
      this.username = username;
    });
    this.updateAvailable = localStorage.getItem('update') !== null ? true : false;
  }

  changeName(): void {
    this.userService.setUsername(this.username!);
  }

  async getGameCountForAverage(event: InputCustomEvent): Promise<void> {
    const targetAvgString = event.detail.value;
    if (!targetAvgString) {
      return;
    }
    const targetAvg = parseInt(targetAvgString, 10);
    if (isNaN(targetAvg)) {
      console.error('Invalid target average input');
      return;
    }

    const results = this.statsService.calculateGamesForTargetAverage(targetAvg, 10);

    let message = '';

    if (results.every((res) => res.gamesNeeded === 0)) {
      message = `Your current average is already ${results[0].score} or higher. No additional games needed to reach ${targetAvg}.`;
    } else {
      message = results
        .map((result) => {
          const gamesNeededText = result.gamesNeeded === Infinity ? 'Very high' : result.gamesNeeded.toString();
          return `${gamesNeededText} games needed with ${result.score} total`;
        })
        .join('<br>');
    }

    const alert = await this.alertCtrl.create({
      header: `Games Needed for ${targetAvg} Average`,
      message: message,
      buttons: ['OK'],
    });

    await alert.present();
  }

  changeColor(): void {
    this.themeService.saveColorTheme(this.currentColor!);
    this.toastService.showToast(`Changed theme to ${this.currentColor}.`, 'checkmark-outline');
  }

  updateApp(): void {
    localStorage.removeItem('update');
    window.location.reload();
  }

  async submitFeedback(form: NgForm): Promise<void> {
    if (form.valid) {
      const templateParams = {
        from_name: this.userEmail,
        message: this.feedbackMessage,
        to_name: 'Lightning Bowl',
      };
      this.loadingService.setLoading(true);
      try {
        await emailjs.send(environment.emailServiceID, environment.emailTemplateID, templateParams, environment.emailUserID);
        this.userEmail = '';
        this.feedbackMessage = '';
        this.toastService.showToast(ToastMessages.feedbackUploadSuccess, 'checkmark-outline');
        form.resetForm();
      } catch (error) {
        console.error('ERROR...', error);
        this.toastService.showToast(ToastMessages.feedbackUploadError, 'bug-outline', true);
      } finally {
        this.loadingService.setLoading(false);
      }
    } else {
      alert('Please fill out all fields correctly.');
    }
  }
}
