import { createReducer, on } from '@ngrx/store';
import { Character, ViewMode } from '../../models/character.model';
import * as CharacterActions from './characters.actions';

export interface CharactersState {
  characters: Character[];
  totalCharacters: number;
  totalPages: number;
  currentPage: number;
  searchQuery: string;
  viewMode: ViewMode;
  selectedCharacterId: number | null;
  loading: boolean;
  error: string | null;
}

export const initialCharactersState: CharactersState = {
  characters: [],
  totalCharacters: 0,
  totalPages: 0,
  currentPage: 1,
  searchQuery: '',
  viewMode: 'grid',
  selectedCharacterId: null,
  loading: false,
  error: null
};

export const charactersReducer = createReducer(
  initialCharactersState,

  on(CharacterActions.loadCharacters, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(CharacterActions.loadCharactersSuccess, (state, { response }) => ({
    ...state,
    characters: response.results || [],
    totalCharacters: response.info?.count || 0,
    totalPages: response.info?.pages || 0,
    loading: false,
    error: null
  })),

  on(CharacterActions.loadCharactersFailure, (state, { error }) => ({
    ...state,
    characters: [],
    loading: false,
    error
  })),

  on(CharacterActions.setSearchQuery, (state, { query }) => ({
    ...state,
    searchQuery: query,
    currentPage: 1
  })),

  on(CharacterActions.setPage, (state, { page }) => ({
    ...state,
    currentPage: page
  })),

  on(CharacterActions.setViewMode, (state, { viewMode }) => ({
    ...state,
    viewMode
  })),

  on(CharacterActions.setSelectedCharacterId, (state, { id }) => ({
    ...state,
    selectedCharacterId: id
  }))
);

