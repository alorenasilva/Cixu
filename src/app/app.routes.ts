import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'lobby',
    loadComponent: () => import('./pages/game-lobby/game-lobby.component').then(m => m.GameLobbyComponent)
  },
  {
    path: 'game',
    loadComponent: () => import('./pages/game-play/game-play.component').then(m => m.GamePlayComponent)
  },
  {
    path: 'free-round',
    loadComponent: () => import('./pages/free-round/free-round.component').then(m => m.FreeRoundComponent)
  },
  {
    path: 'results',
    loadComponent: () => import('./pages/results/results.component').then(m => m.ResultsComponent)
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];