import { createAction, props } from '@ngrx/store';
import { UserRole } from '../../models/role.model';

export const setRole = createAction(
  '[Role] Set Role',
  props<{ role: UserRole }>()
);

export const toggleRole = createAction('[Role] Toggle Role');

export const notifyAccessDenied = createAction(
  '[Role] Notify Access Denied',
  props<{ targetRoute: string }>()
);

export const clearAccessDenied = createAction('[Role] Clear Access Denied');

