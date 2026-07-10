import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRouteSnapshot } from '@angular/router';
import { RoleGuard } from './role-guard';
import { AuthService } from '../services/auth.service';
import { vi } from 'vitest';

describe('RoleGuard', () => {
  let guard: RoleGuard;
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    const authSpy = {
      currentUserValue: null,
    };
    const routerSpy = {
      navigate: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        RoleGuard,
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    guard = TestBed.inject(RoleGuard);
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow activation when no roles are required', () => {
    const route = { data: {}, params: {} } as unknown as ActivatedRouteSnapshot;

    const result = guard.canActivate(route);

    expect(result).toBe(true);
  });

  it('should allow activation when requiredRoles array is empty', () => {
    const route = { data: { roles: [] }, params: {} } as unknown as ActivatedRouteSnapshot;

    const result = guard.canActivate(route);

    expect(result).toBe(true);
  });

  it('should redirect to /login when no user is logged in', () => {
    const route = { data: { roles: ['ADMIN'] }, params: {} } as unknown as ActivatedRouteSnapshot;

    const result = guard.canActivate(route);

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should allow activation when user has one of the required roles', () => {
    authService.currentUserValue = { id: '1', email: 'admin@test.com', role: 'ADMIN' };
    const route = { data: { roles: ['ADMIN'] }, params: {} } as unknown as ActivatedRouteSnapshot;

    const result = guard.canActivate(route);

    expect(result).toBe(true);
  });

  it('should allow activation when user has multiple matching roles', () => {
    authService.currentUserValue = { id: '1', email: 'user@test.com', role: 'SUPER_ADMIN' };
    const route = { data: { roles: ['ADMIN', 'SUPER_ADMIN'] }, params: {} } as unknown as ActivatedRouteSnapshot;

    const result = guard.canActivate(route);

    expect(result).toBe(true);
  });

  it('should block and redirect when user lacks required roles', () => {
    authService.currentUserValue = { id: '1', email: 'doctor@test.com', role: 'DOCTOR' };
    const route = {
      data: { roles: ['ADMIN'] },
      params: { hospitalCode: 'hosp1' },
    } as unknown as ActivatedRouteSnapshot;

    const result = guard.canActivate(route);

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/hosp1/dashboard']);
  });

  it('should use parent params hospitalCode when not on current route', () => {
    authService.currentUserValue = { id: '1', email: 'nurse@test.com', role: 'NURSE' };
    const route = {
      data: { roles: ['ADMIN'] },
      params: {},
      parent: { params: { hospitalCode: 'parent-hosp' } },
    } as unknown as ActivatedRouteSnapshot;

    const result = guard.canActivate(route);

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/parent-hosp/dashboard']);
  });
});
