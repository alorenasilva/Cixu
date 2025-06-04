import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'lobby',
    component: GameLobbyComponent
  },
  {
    path: 'game',
    component: GamePlayComponent
  },
  {
    path: 'free-round',
    component: FreeRoundComponent
  },
  {
    path: 'results',
    component: ResultsComponent
  },
  {
    path: '**',
    component: NotFoundComponent
  }
];