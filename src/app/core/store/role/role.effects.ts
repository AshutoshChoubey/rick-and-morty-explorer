import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { tap } from 'rxjs/operators';
import * as RoleActions from './role.actions';

const STORAGE_KEY = 'rm_simulated_user_role';

@Injectable()
export class RoleEffects {
  private readonly actions$ = inject(Actions);

  syncRoleStorage$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(RoleActions.setRole),
        tap(({ role }) => {
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem(STORAGE_KEY, role);
          }
        })
      ),
    { dispatch: false }
  );
}

