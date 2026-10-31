import { createFeatureSelector, createSelector } from '@ngrx/store';
import { RoleState } from './role.reducer';

export const selectRoleState = createFeatureSelector<RoleState>('role');

export const selectCurrentRole = createSelector(
  selectRoleState,
  (state) => state.currentRole
);

export const selectIsAdmin = createSelector(
  selectCurrentRole,
  (role) => role === 'ADMIN'
);

export const selectIsViewer = createSelector(
  selectCurrentRole,
  (role) => role === 'VIEWER'
);

export const selectCanAccessDetails = createSelector(
  selectCurrentRole,
  (role) => role === 'ADMIN'
);

export const selectAccessDeniedNotice = createSelector(
  selectRoleState,
  (state) => state.accessDeniedNotice
);

