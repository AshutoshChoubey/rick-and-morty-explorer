import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/character-list/character-list.component').then(
        (m) => m.CharacterListComponent
      ),
    title: 'Characters — Rick & Morty Explorer'
  },
  {
    path: 'character/:id',
    loadComponent: () =>
      import('./features/character-detail/character-detail.component').then(
        (m) => m.CharacterDetailComponent
      ),
    canActivate: [roleGuard],
    title: 'Character Details & Episodes — Rick & Morty Explorer'
  },
  {
    path: 'access-denied',
    loadComponent: () =>
      import('./features/access-denied/access-denied.component').then(
        (m) => m.AccessDeniedComponent
      ),
    title: 'Access Denied — Rick & Morty Explorer'
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];
