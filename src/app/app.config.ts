import { ApplicationConfig, provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { routes } from './app.routes';
import { charactersReducer } from './core/store/characters/characters.reducer';
import { CharactersEffects } from './core/store/characters/characters.effects';
import { characterDetailReducer } from './core/store/character-detail/character-detail.reducer';
import { CharacterDetailEffects } from './core/store/character-detail/character-detail.effects';
import { roleReducer } from './core/store/role/role.reducer';
import { RoleEffects } from './core/store/role/role.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(withFetch()),
    provideAnimationsAsync(),
    provideStore({
      characters: charactersReducer,
      characterDetail: characterDetailReducer,
      role: roleReducer
    }),
    provideEffects([
      CharactersEffects,
      CharacterDetailEffects,
      RoleEffects
    ]),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: !isDevMode()
    })
  ]
};
