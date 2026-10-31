import { TestBed } from '@angular/core/testing';
import { provideStore } from '@ngrx/store';
import { RoleService } from './role.service';
import { roleReducer } from '../store/role/role.reducer';

describe('RoleService', () => {
  let service: RoleService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideStore({ role: roleReducer })
      ]
    });
    service = TestBed.inject(RoleService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created with default role ADMIN', () => {
    expect(service).toBeTruthy();
    expect(service.currentRole()).toBe('ADMIN');
    expect(service.isAdmin()).toBeTrue();
    expect(service.canAccessDetails()).toBeTrue();
  });

  it('should switch role to VIEWER and restrict access', () => {
    service.setRole('VIEWER');
    expect(service.currentRole()).toBe('VIEWER');
    expect(service.isAdmin()).toBeFalse();
    expect(service.isViewer()).toBeTrue();
    expect(service.canAccessDetails()).toBeFalse();
  });

  it('should toggle role between ADMIN and VIEWER', () => {
    service.setRole('ADMIN');
    service.toggleRole();
    expect(service.currentRole()).toBe('VIEWER');
    service.toggleRole();
    expect(service.currentRole()).toBe('ADMIN');
  });

  it('should set and clear access denied notifications', () => {
    service.notifyAccessDenied('/character/42');
    const notice = service.accessDeniedNotice();
    expect(notice).toBeTruthy();
    expect(notice?.targetRoute).toBe('/character/42');

    service.clearAccessDenied();
    expect(service.accessDeniedNotice()).toBeNull();
  });
});

