import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./features/create-round/create-round.page').then((m) => m.CreateRoundPage),
  },
  {
    path: 'lobby/:code',
    loadComponent: () =>
      import('./features/lobby/lobby.page').then((m) => m.LobbyPage),
  },
  {
    path: 'play/:code',
    loadComponent: () =>
      import('./features/play/play.page').then((m) => m.PlayPage),
  },
  {
    path: 'admin/questions',
    loadComponent: () =>
      import('./features/admin-questions/admin-questions.page').then(
        (m) => m.AdminQuestionsPage,
      ),
  },
  { path: '**', redirectTo: '' },
];
