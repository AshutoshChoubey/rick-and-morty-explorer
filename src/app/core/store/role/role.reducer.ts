import { createReducer, on } from '@ngrx/store';
import { UserRole } from '../../models/role.model';
import * as RoleActions from './role.actions';

const STORAGE_KEY = 'rm_simulated_user_role';

function getInitialRole(): UserRole {
  if (typeof window !== 'undefined' && window.localStorage) {
    const stored = localStorage.getItem(STORAGE_KEY) as UserRole;
    if (stored === 'ADMIN' || stored === 'VIEWER') {
      return stored;
    }
  }
  return 'ADMIN';
}

export interface AccessDeniedNotice {
  title: string;
  message: string;
  targetRoute?: string;
}

export interface RoleState {
  currentRole: UserRole;
  accessDeniedNotice: AccessDeniedNotice | null;
}

export const initialRoleState: RoleState = {
  currentRole: getInitialRole(),
  accessDeniedNotice: null
};

export const roleReducer = createReducer(
  initialRoleState,

  on(RoleActions.setRole, (state, { role }) => ({
    ...state,
    currentRole: role
  })),

  on(RoleActions.toggleRole, (state) => ({
    ...state,
    currentRole: (state.currentRole === 'ADMIN' ? 'VIEWER' : 'ADMIN') as UserRole
  })),

  on(RoleActions.notifyAccessDenied, (state, { targetRoute }) => ({
    ...state,
    accessDeniedNotice: {
      title: 'Access Restricted (403 Forbidden)',
      message: `Your current role is 'Viewer'. Route '${targetRoute}' requires 'Admin' authorization. Switch your role to Admin in the top navigation bar to access character details and episodes.`,
      targetRoute
    }
  })),

  on(RoleActions.clearAccessDenied, (state) => ({
    ...state,
    accessDeniedNotice: null
  }))
);
