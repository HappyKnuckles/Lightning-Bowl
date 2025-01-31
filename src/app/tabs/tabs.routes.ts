import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'add',
        loadComponent: () => import('../pages/add-game/add-game.page').then((m) => m.AddGamePage),
      },
      {
        path: 'stats',
        loadComponent: () => import('../pages/stats/stats.page').then((m) => m.StatsPage),
      },
      {
        path: 'history',
        loadComponent: () => import('../pages/history/history.page').then((m) => m.HistoryPage),
      },
      {
        path: 'settings',
        loadComponent: () => import('../pages/settings/settings.page').then((m) => m.SettingsPage),
      },
      {
        path: 'league',
        loadComponent: () => import('../pages/league/league.page').then((m) => m.LeaguePage),
      },
      {
        path: 'balls',
        loadComponent: () => import('../pages/balls/balls.page').then((m) => m.BallsPage),
      },
      {
        path: '',
        redirectTo: '/tabs/add',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/add',
    pathMatch: 'full',
  },
];
