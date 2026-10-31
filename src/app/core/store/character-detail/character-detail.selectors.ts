import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CharacterDetailState } from './character-detail.reducer';

export const selectCharacterDetailState =
  createFeatureSelector<CharacterDetailState>('characterDetail');

export const selectCharacter = createSelector(
  selectCharacterDetailState,
  (state) => state.character
);

export const selectEpisodes = createSelector(
  selectCharacterDetailState,
  (state) => state.episodes
);

export const selectEpisodeFilter = createSelector(
  selectCharacterDetailState,
  (state) => state.episodeFilter
);

export const selectSortBy = createSelector(
  selectCharacterDetailState,
  (state) => state.sortBy
);

export const selectSortAsc = createSelector(
  selectCharacterDetailState,
  (state) => state.sortAsc
);

export const selectLoadingCharacter = createSelector(
  selectCharacterDetailState,
  (state) => state.loadingCharacter
);

export const selectLoadingEpisodes = createSelector(
  selectCharacterDetailState,
  (state) => state.loadingEpisodes
);

export const selectCharacterDetailError = createSelector(
  selectCharacterDetailState,
  (state) => state.error
);

export const selectFilteredEpisodes = createSelector(
  selectEpisodes,
  selectEpisodeFilter,
  selectSortBy,
  selectSortAsc,
  (episodes, filterTerm, sortBy, sortAsc) => {
    const term = (filterTerm || '').trim().toLowerCase();
    let result = episodes;

    if (term) {
      result = result.filter((ep) => ep.name.toLowerCase().includes(term));
    }

    const dir = sortAsc ? 1 : -1;
    return [...result].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') {
        cmp = a.name.localeCompare(b.name);
      } else if (sortBy === 'air_date') {
        cmp = new Date(a.air_date).getTime() - new Date(b.air_date).getTime();
      } else {
        cmp = a.episode.localeCompare(b.episode);
      }
      return cmp * dir;
    });
  }
);
