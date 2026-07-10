import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRouteSnapshot } from '@angular/router';
import { ModuleGuard } from './module.guard';
import { EffectiveLicenseService } from '../services/effective-license.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { vi } from 'vitest';

describe('ModuleGuard', () => {
  let guard: ModuleGuard;
  let licenseService: EffectiveLicenseService;
  let router: Router;
  let toastService: ToastService;

  beforeEach(() => {
    const licenseSpy = {
      isModuleAccessible: vi.fn(),
    };
    const routerSpy = {
      navigate: vi.fn(),
    };
    const toastSpy = {
      warning: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        ModuleGuard,
        { provide: EffectiveLicenseService, useValue: licenseSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ToastService, useValue: toastSpy },
      ],
    });

    guard = TestBed.inject(ModuleGuard);
    licenseService = TestBed.inject(EffectiveLicenseService);
    router = TestBed.inject(Router);
    toastService = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow activation when no moduleCode is specified', () => {
    const route = { data: {}, params: {} } as unknown as ActivatedRouteSnapshot;

    const result = guard.canActivate(route);

    expect(result).toBe(true);
    expect(licenseService.isModuleAccessible).not.toHaveBeenCalled();
  });

  it('should allow activation when module is accessible', () => {
    (licenseService.isModuleAccessible as ReturnType<typeof vi.fn>).mockReturnValue(true);
    const route = { data: { moduleCode: 'PATIENT_MGMT' }, params: { hospitalCode: 'hosp1' } } as unknown as ActivatedRouteSnapshot;

    const result = guard.canActivate(route);

    expect(result).toBe(true);
    expect(licenseService.isModuleAccessible).toHaveBeenCalledWith('PATIENT_MGMT');
  });

  it('should block and redirect when module is NOT accessible', () => {
    (licenseService.isModuleAccessible as ReturnType<typeof vi.fn>).mockReturnValue(false);
    const route = { data: { moduleCode: 'BILLING' }, params: { hospitalCode: 'hosp1' } } as unknown as ActivatedRouteSnapshot;

    const result = guard.canActivate(route);

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/hosp1/dashboard']);
    expect(toastService.warning).toHaveBeenCalledWith('This module is not available in your current plan.');
  });

  it('should use parent params hospitalCode if not on current route', () => {
    (licenseService.isModuleAccessible as ReturnType<typeof vi.fn>).mockReturnValue(false);
    const route = {
      data: { moduleCode: 'BILLING' },
      params: {},
      parent: { params: { hospitalCode: 'parent-hosp' } },
    } as unknown as ActivatedRouteSnapshot;

    const result = guard.canActivate(route);

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/parent-hosp/dashboard']);
  });
});
