import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { BallFilterService } from 'src/app/services/ball-filter/ball-filter.service';
import {
  IonHeader,
  IonInput,
  IonList,
  IonContent,
  IonToolbar,
  IonButton,
  IonTitle,
  IonButtons,
  IonItem,
  IonToggle,
  IonFooter,
} from '@ionic/angular/standalone';
import { NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ball-filter',
  templateUrl: './ball-filter.component.html',
  styleUrls: ['./ball-filter.component.scss'],
  standalone: true,
  imports: [IonFooter, NgFor, FormsModule, IonToggle, IonItem, IonButtons, IonTitle, IonButton, IonToolbar, IonContent, IonList, IonInput, IonHeader],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class BallFilterComponent {
  constructor(private ballFilterService: BallFilterService, private modalCtrl: ModalController) {}

  // ngOnInit() { }

  cancel(): Promise<boolean> {
    // this.ballFilterService.filters.update(() =>
    //   localStorage.getItem('filter') ? JSON.parse(localStorage.getItem('filter')!) : this.ballFilterService.filters
    // );
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  reset(): void {
    // this.ballFilterService.resetFilters();
  }

  confirm(): Promise<boolean> {
    // this.ballFilterService.filterGames(this.games);
    return this.modalCtrl.dismiss('confirm');
  }
}
