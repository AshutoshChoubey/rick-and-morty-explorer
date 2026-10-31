import { createAction, props } from '@ngrx/store';
import { Character, CharacterApiResponse, ViewMode } from '../../models/character.model';

export const loadCharacters = createAction(
  '[Character List] Load Characters',
  props<{ page: number; name?: string }>()
);

export const loadCharactersSuccess = createAction(
  '[Character List] Load Characters Success',
  props<{ response: CharacterApiResponse }>()
);

export const loadCharactersFailure = createAction(
  '[Character List] Load Characters Failure',
  props<{ error: string }>()
);

export const setSearchQuery = createAction(
  '[Character List] Set Search Query',
  props<{ query: string }>()
);

export const setPage = createAction(
  '[Character List] Set Page',
  props<{ page: number }>()
);

export const setViewMode = createAction(
  '[Character List] Set View Mode',
  props<{ viewMode: ViewMode }>()
);

export const setSelectedCharacterId = createAction(
  '[Character List] Set Selected Character ID',
  props<{ id: number | null }>()
);

