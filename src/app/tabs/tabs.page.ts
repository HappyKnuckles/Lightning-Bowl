import { Component } from '@angular/core';
import { addIcons } from 'ionicons';
import {
  add,
  statsChartOutline,
  receipt,
  medalOutline,
  bowlingBallOutline,
  ellipsisHorizontal,
  bagAddOutline,
  settingsOutline,
} from 'ionicons/icons';
import { BehaviorSubject } from 'rxjs';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonContent, IonList, IonItem, IonModal } from '@ionic/angular/standalone';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  imports: [IonModal, RouterModule, AsyncPipe, IonItem, IonList, IonContent, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class TabsPage {
  activeMoreTab$ = new BehaviorSubject<boolean>(false);
  readonly moreTabs = ['/tabs/balls', '/tabs/settings', '/tabs/arsenal'];

  constructor(private router: Router) {
    addIcons({ add, statsChartOutline, receipt, medalOutline, ellipsisHorizontal, bowlingBallOutline, bagAddOutline, settingsOutline });

    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.activeMoreTab$.next(this.moreTabs.includes(this.router.url));
    });
  }

  isActive(path: string): boolean {
    return this.router.url === path;
  }
}
