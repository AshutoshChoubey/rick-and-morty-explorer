import { createAction, props } from '@ngrx/store';
import { Character } from '../../models/character.model';
import { Episode } from '../../models/episode.model';

export const loadCharacterDetail = createAction(
  '[Character Detail] Load Character Detail',
  props<{ id: string | number }>()
);

export const loadCharacterDetailSuccess = createAction(
  '[Character Detail] Load Character Detail Success',
  props<{ character: Character }>()
);

export const loadCharacterDetailFailure = createAction(
  '[Character Detail] Load Character Detail Failure',
  props<{ error: string }>()
);

export const loadEpisodes = createAction(
  '[Character Detail] Load Episodes',
  props<{ character: Character }>()
);

export const loadEpisodesSuccess = createAction(
  '[Character Detail] Load Episodes Success',
  props<{ episodes: Episode[] }>()
);

export const loadEpisodesFailure = createAction(
  '[Character Detail] Load Episodes Failure',
  props<{ error: string }>()
);

export const setEpisodeFilter = createAction(
  '[Character Detail] Set Episode Filter',
  props<{ term: string }>()
);

export const setEpisodeSort = createAction(
  '[Character Detail] Set Episode Sort',
  props<{ field: 'name' | 'air_date' | 'episode' }>()
);

export const clearCharacterDetail = createAction(
  '[Character Detail] Clear Character Detail'
);

