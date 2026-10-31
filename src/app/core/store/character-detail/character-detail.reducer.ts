import { createReducer, on } from '@ngrx/store';
import { Character } from '../../models/character.model';
import { Episode } from '../../models/episode.model';
import * as DetailActions from './character-detail.actions';

export interface CharacterDetailState {
  character: Character | null;
  episodes: Episode[];
  episodeFilter: string;
  sortBy: 'name' | 'air_date' | 'episode';
  sortAsc: boolean;
  loadingCharacter: boolean;
  loadingEpisodes: boolean;
  error: string | null;
}

export const initialCharacterDetailState: CharacterDetailState = {
  character: null,
  episodes: [],
  episodeFilter: '',
  sortBy: 'episode',
  sortAsc: true,
  loadingCharacter: false,
  loadingEpisodes: false,
  error: null
};

export const characterDetailReducer = createReducer(
  initialCharacterDetailState,

  on(DetailActions.loadCharacterDetail, (state) => ({
    ...state,
    loadingCharacter: true,
    loadingEpisodes: true,
    error: null
  })),

  on(DetailActions.loadCharacterDetailSuccess, (state, { character }) => ({
    ...state,
    character,
    loadingCharacter: false,
    error: null
  })),

  on(DetailActions.loadCharacterDetailFailure, (state, { error }) => ({
    ...state,
    character: null,
    loadingCharacter: false,
    loadingEpisodes: false,
    error
  })),

  on(DetailActions.loadEpisodes, (state) => ({
    ...state,
    loadingEpisodes: true
  })),

  on(DetailActions.loadEpisodesSuccess, (state, { episodes }) => ({
    ...state,
    episodes,
    loadingEpisodes: false,
    error: null
  })),

  on(DetailActions.loadEpisodesFailure, (state, { error }) => ({
    ...state,
    episodes: [],
    loadingEpisodes: false,
    error
  })),

  on(DetailActions.setEpisodeFilter, (state, { term }) => ({
    ...state,
    episodeFilter: term
  })),

  on(DetailActions.setEpisodeSort, (state, { field }) => ({
    ...state,
    sortBy: field,
    sortAsc: state.sortBy === field ? !state.sortAsc : true
  })),

  on(DetailActions.clearCharacterDetail, () => initialCharacterDetailState)
);

