import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'add',
        loadComponent: () => import('../Pages/add-game/add-game.page').then((m) => m.AddGamePage),
      },
      {
        path: 'stats',
        loadComponent: () => import('../Pages/stats/stats.page').then((m) => m.StatsPage),
      },
      {
        path: 'history',
        loadComponent: () => import('../Pages/history/history.page').then((m) => m.HistoryPage),
      },
      {
        path: 'settings',
        loadComponent: () => import('../Pages/settings/settings.page').then((m) => m.SettingsPage),
      },
      {
        path: 'league',
        loadComponent: () => import('../Pages/league/league.page').then((m) => m.LeaguePage),
      },
        {
        path: 'balls',
        loadComponent: () => import('../Pages/balls/balls.page').then((m) => m.BallsPage),
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
