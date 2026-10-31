import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import {
  switchMap,
  map,
  catchError,
  debounceTime,
  distinctUntilChanged,
  withLatestFrom
} from 'rxjs/operators';
import { RickAndMortyService } from '../../services/rick-and-morty.service';
import * as CharacterActions from './characters.actions';
import { selectSearchQuery } from './characters.selectors';

@Injectable()
export class CharactersEffects {
  private readonly actions$ = inject(Actions);
  private readonly apiService = inject(RickAndMortyService);
  private readonly store = inject(Store);

  loadCharacters$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CharacterActions.loadCharacters),
      switchMap(({ page, name }) =>
        this.apiService.getCharacters(page, name).pipe(
          map((response) => CharacterActions.loadCharactersSuccess({ response })),
          catchError(() =>
            of(
              CharacterActions.loadCharactersFailure({
                error: 'Failed to load characters. Please check your network connection.'
              })
            )
          )
        )
      )
    )
  );

  searchCharacters$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CharacterActions.setSearchQuery),
      debounceTime(350),
      distinctUntilChanged((prev, curr) => prev.query === curr.query),
      map(({ query }) => CharacterActions.loadCharacters({ page: 1, name: query }))
    )
  );

  changePage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CharacterActions.setPage),
      withLatestFrom(this.store.select(selectSearchQuery)),
      map(([{ page }, query]) => CharacterActions.loadCharacters({ page, name: query }))
    )
  );
}
