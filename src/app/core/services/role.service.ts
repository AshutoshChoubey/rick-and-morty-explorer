import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { UserRole } from '../models/role.model';
import * as RoleActions from '../store/role/role.actions';
import {
  selectCurrentRole,
  selectIsAdmin,
  selectIsViewer,
  selectCanAccessDetails,
  selectAccessDeniedNotice
} from '../store/role/role.selectors';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private readonly store = inject(Store);

  readonly currentRole$ = this.store.select(selectCurrentRole);
  readonly isAdmin$ = this.store.select(selectIsAdmin);
  readonly isViewer$ = this.store.select(selectIsViewer);
  readonly canAccessDetails$ = this.store.select(selectCanAccessDetails);
  readonly accessDeniedNotice$ = this.store.select(selectAccessDeniedNotice);

  readonly currentRole = this.store.selectSignal(selectCurrentRole);
  readonly isAdmin = this.store.selectSignal(selectIsAdmin);
  readonly isViewer = this.store.selectSignal(selectIsViewer);
  readonly canAccessDetails = this.store.selectSignal(selectCanAccessDetails);
  readonly accessDeniedNotice = this.store.selectSignal(selectAccessDeniedNotice);

  setRole(role: UserRole): void {
    this.store.dispatch(RoleActions.setRole({ role }));
  }

  toggleRole(): void {
    this.store.dispatch(RoleActions.toggleRole());
  }

  notifyAccessDenied(targetRoute: string = '/character/:id'): void {
    this.store.dispatch(RoleActions.notifyAccessDenied({ targetRoute }));
  }

  clearAccessDenied(): void {
    this.store.dispatch(RoleActions.clearAccessDenied());
  }
}
