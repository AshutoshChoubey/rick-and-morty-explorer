import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs/operators';
import { selectCanAccessDetails } from '../store/role/role.selectors';
import * as RoleActions from '../store/role/role.actions';

export const roleGuard: CanActivateFn = (route, state) => {
  const store = inject(Store);
  const router = inject(Router);

  return store.select(selectCanAccessDetails).pipe(
    take(1),
    map((canAccess) => {
      if (canAccess) {
        return true;
      }

      store.dispatch(RoleActions.notifyAccessDenied({ targetRoute: state.url }));

      return router.createUrlTree(['/access-denied'], {
        queryParams: { attempted: state.url }
      });
    })
  );
};
