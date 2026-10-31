import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { RickAndMortyService } from '../../services/rick-and-morty.service';
import * as DetailActions from './character-detail.actions';

@Injectable()
export class CharacterDetailEffects {
  private readonly actions$ = inject(Actions);
  private readonly apiService = inject(RickAndMortyService);

  loadCharacterDetail$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DetailActions.loadCharacterDetail),
      switchMap(({ id }) =>
        this.apiService.getCharacterById(id).pipe(
          map((character) => DetailActions.loadCharacterDetailSuccess({ character })),
          catchError(() =>
            of(
              DetailActions.loadCharacterDetailFailure({
                error: 'Character not found.'
              })
            )
          )
        )
      )
    )
  );

  loadEpisodesTrigger$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DetailActions.loadCharacterDetailSuccess),
      map(({ character }) => DetailActions.loadEpisodes({ character }))
    )
  );

  loadEpisodes$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DetailActions.loadEpisodes),
      switchMap(({ character }) =>
        this.apiService.getCharacterEpisodes(character).pipe(
          map((episodes) => DetailActions.loadEpisodesSuccess({ episodes })),
          catchError(() =>
            of(
              DetailActions.loadEpisodesFailure({
                error: 'Failed to load episodes.'
              })
            )
          )
        )
      )
    )
  );
}
