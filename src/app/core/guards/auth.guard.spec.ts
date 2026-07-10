import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { vi } from 'vitest';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    const authSpy = {
      isLoggedIn: vi.fn(),
    };
    const routerSpy = {
      navigate: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    guard = TestBed.inject(AuthGuard);
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow activation when user is logged in', () => {
    (authService.isLoggedIn as ReturnType<typeof vi.fn>).mockReturnValue(true);
    const route = { params: {} } as ActivatedRouteSnapshot;
    const state = { url: '/dashboard' } as RouterStateSnapshot;

    const result = guard.canActivate(route, state);

    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should redirect to /login when user is NOT logged in (no hospitalCode)', () => {
    (authService.isLoggedIn as ReturnType<typeof vi.fn>).mockReturnValue(false);
    const route = { params: {} } as ActivatedRouteSnapshot;
    const state = { url: '/patients' } as RouterStateSnapshot;

    const result = guard.canActivate(route, state);

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/patients' },
    });
  });

  it('should redirect with hospitalCode when present', () => {
    (authService.isLoggedIn as ReturnType<typeof vi.fn>).mockReturnValue(false);
    const route = { params: { hospitalCode: 'test-hospital' } } as unknown as ActivatedRouteSnapshot;
    const state = { url: '/billing/b-001' } as RouterStateSnapshot;

    const result = guard.canActivate(route, state);

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/test-hospital'], {
      queryParams: { returnUrl: '/billing/b-001' },
    });
  });
});
