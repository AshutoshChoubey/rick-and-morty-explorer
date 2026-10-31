import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CharactersState } from './characters.reducer';

export const selectCharactersState = createFeatureSelector<CharactersState>('characters');

export const selectAllCharacters = createSelector(
  selectCharactersState,
  (state) => state.characters
);

export const selectTotalCharacters = createSelector(
  selectCharactersState,
  (state) => state.totalCharacters
);

export const selectTotalPages = createSelector(
  selectCharactersState,
  (state) => state.totalPages
);

export const selectCurrentPage = createSelector(
  selectCharactersState,
  (state) => state.currentPage
);

export const selectSearchQuery = createSelector(
  selectCharactersState,
  (state) => state.searchQuery
);

export const selectViewMode = createSelector(
  selectCharactersState,
  (state) => state.viewMode
);

export const selectSelectedCharacterId = createSelector(
  selectCharactersState,
  (state) => state.selectedCharacterId
);

export const selectCharactersLoading = createSelector(
  selectCharactersState,
  (state) => state.loading
);

export const selectCharactersError = createSelector(
  selectCharactersState,
  (state) => state.error
);

