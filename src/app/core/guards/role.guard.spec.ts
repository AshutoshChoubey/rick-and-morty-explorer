import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { firstValueFrom, Observable } from 'rxjs';
import { roleGuard } from './role.guard';
import { RoleService } from '../services/role.service';
import { roleReducer } from '../store/role/role.reducer';

describe('roleGuard', () => {
  let roleService: RoleService;
  let router: Router;

  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = { url: '/character/1' } as RouterStateSnapshot;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideStore({ role: roleReducer })
      ]
    });
    roleService = TestBed.inject(RoleService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should allow access when role is ADMIN', async () => {
    roleService.setRole('ADMIN');
    const result$ = TestBed.runInInjectionContext(() =>
      roleGuard(mockRoute, mockState)
    ) as Observable<boolean | UrlTree>;

    const result = await firstValueFrom(result$);
    expect(result).toBeTrue();
  });

  it('should deny access and redirect to /access-denied when role is VIEWER', async () => {
    roleService.setRole('VIEWER');
    const result$ = TestBed.runInInjectionContext(() =>
      roleGuard(mockRoute, mockState)
    ) as Observable<boolean | UrlTree>;

    const result = await firstValueFrom(result$);
    expect(result instanceof UrlTree).toBeTrue();
    const tree = result as UrlTree;
    expect(tree.toString()).toContain('/access-denied?attempted=%2Fcharacter%2F1');
  });
});
