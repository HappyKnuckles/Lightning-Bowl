import { Component, ViewChild } from '@angular/core';
import { addIcons } from 'ionicons';
import { add, statsChartOutline, receipt, settings, medalOutline, bowlingBallOutline, ellipsisHorizontal } from 'ionicons/icons';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonContent, IonList, IonItem, IonModal } from '@ionic/angular/standalone';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  imports: [IonModal, IonItem, IonList, IonContent, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class TabsPage {
  @ViewChild(IonModal) modal!: IonModal;

  constructor(private router: Router) {
    addIcons({ add, statsChartOutline, receipt, medalOutline, ellipsisHorizontal, bowlingBallOutline, settings });
  }

  navigateTo(path: string) {
    this.modal.dismiss();
    this.router.navigateByUrl(path);
  }
}
