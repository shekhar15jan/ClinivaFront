import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { TenantResolverGuard } from './tenant-resolver.guard';
import { TenantService } from '../services/tenant.service';
import { TenantContextService } from '../services/tenant-context.service';
import { AuthService } from '../services/auth.service';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

describe('TenantResolverGuard', () => {
  let guard: TenantResolverGuard;
  let tenantService: TenantService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tenantContext: any;
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    const tenantServiceSpy = {
      resolveByCode: vi.fn(),
    };
    const tenantContextSpy = {
      tenantCode: vi.fn(),
      tenant: vi.fn(),
    };
    const authServiceSpy = {
      setTenantResolution: vi.fn(),
    };
    const routerSpy = {
      navigate: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        TenantResolverGuard,
        { provide: TenantService, useValue: tenantServiceSpy },
        { provide: TenantContextService, useValue: tenantContextSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    guard = TestBed.inject(TenantResolverGuard);
    tenantService = TestBed.inject(TenantService);
    tenantContext = TestBed.inject(TenantContextService);
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should redirect to /login when no hospitalCode is present', async () => {
    const route = { params: {} } as unknown as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;

    const result = await guard.canActivate(route, state);

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should resolve true when tenant context already matches hospitalCode', async () => {
    (tenantContext.tenantCode as ReturnType<typeof vi.fn>).mockReturnValue('hosp1');
    (tenantContext.tenant as ReturnType<typeof vi.fn>).mockReturnValue({ id: 't1', name: 'Test Hospital' });
    const route = { params: { hospitalCode: 'hosp1' } } as unknown as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;

    const result = await guard.canActivate(route, state);

    expect(result).toBe(true);
    expect(tenantService.resolveByCode).not.toHaveBeenCalled();
  });

  it('should resolve via API and return true on success', async () => {
    (tenantContext.tenantCode as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (tenantContext.tenant as ReturnType<typeof vi.fn>).mockReturnValue(null);
    const resolution = {
      tenant: { id: 't1', tenantId: 'hosp1', name: 'Hosp' } as unknown as Record<'id' | 'tenantId' | 'name', string>,
      modules: [],
      subscription: { planName: 'Basic', status: 'ACTIVE', startDate: '', endDate: '' },
    };
    (tenantService.resolveByCode as ReturnType<typeof vi.fn>).mockReturnValue(
      of({ success: true, data: resolution, message: '' }),
    );

    const route = { params: { hospitalCode: 'hosp1' } } as unknown as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;

    const result = await guard.canActivate(route, state);

    expect(result).toBe(true);
    expect(tenantService.resolveByCode).toHaveBeenCalledWith('hosp1');
    expect(authService.setTenantResolution).toHaveBeenCalledWith(resolution);
  });

  it('should redirect to /login when API response has no data', async () => {
    (tenantContext.tenantCode as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (tenantContext.tenant as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (tenantService.resolveByCode as ReturnType<typeof vi.fn>).mockReturnValue(
      of({ success: true, data: null, message: 'Not found' }),
    );

    const route = { params: { hospitalCode: 'unknown-hosp' } } as unknown as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;

    const result = await guard.canActivate(route, state);

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should redirect to /login when API call errors', async () => {
    (tenantContext.tenantCode as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (tenantContext.tenant as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (tenantService.resolveByCode as ReturnType<typeof vi.fn>).mockReturnValue(
      throwError(() => new Error('Network error')),
    );

    const route = { params: { hospitalCode: 'hosp1' } } as unknown as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;

    const result = await guard.canActivate(route, state);

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
