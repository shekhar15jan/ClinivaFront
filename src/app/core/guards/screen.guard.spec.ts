import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { screenGuard } from './screen.guard';
import { AuthService } from '../services/auth.service';
import { EffectiveLicenseService } from '../services/effective-license.service';
import { ToastService } from '../../shared/components/toast/toast.service';

/** A top-level screen inside a clinic: /:hospitalCode/<section>. */
function screen(section: string): ActivatedRouteSnapshot {
  const clinic = { params: { hospitalCode: 'CITY' }, parent: null, routeConfig: { path: ':hospitalCode' } };
  const shell = { params: {}, parent: clinic, routeConfig: { path: '' } };
  return { params: {}, parent: shell, routeConfig: { path: section } } as unknown as ActivatedRouteSnapshot;
}

describe('screenGuard', () => {
  let role = 'ADMIN';
  let modules: string[] = [];
  const toast = { warning: vi.fn() };

  function run(section: string): boolean | UrlTree {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { currentUserValue: { id: 'u', role } } },
        { provide: EffectiveLicenseService, useValue: { activeModules: signal(modules) } },
        { provide: ToastService, useValue: toast },
      ],
    });
    return TestBed.runInInjectionContext(() =>
      screenGuard(screen(section), {} as RouterStateSnapshot),
    ) as boolean | UrlTree;
  }

  const url = (result: boolean | UrlTree) => (result instanceof UrlTree ? TestBed.inject(Router).serializeUrl(result) : result);

  beforeEach(() => {
    TestBed.resetTestingModule();
    toast.warning.mockReset();
    role = 'ADMIN';
    modules = ['PATIENT', 'BILLING', 'USER', 'SETTINGS'];
  });

  it('lets a role open what the menu offers it', () => {
    expect(run('patients')).toBe(true);
    expect(run('billing')).toBe(true);
  });

  it('sends a nurse who types the billing address back to the dashboard, saying why', () => {
    role = 'NURSE';
    expect(url(run('billing'))).toBe('/CITY/dashboard');
    expect(toast.warning).toHaveBeenCalledWith('Your role does not have access to this screen.');
  });

  it('keeps a Starter clinic out of screens its plan does not include', () => {
    expect(url(run('reviews'))).toBe('/CITY/dashboard');
    expect(toast.warning).toHaveBeenCalledWith('This module is not available in your current plan.');
  });

  it('keeps patients in their own portal and staff out of it', () => {
    role = 'PATIENT';
    expect(url(run('patients'))).toBe('/CITY/patient/dashboard');
    expect(run('patient')).toBe(true);
    role = 'RECEPTIONIST';
    expect(url(run('patient'))).toBe('/CITY/dashboard');
  });

  it('always allows the dashboard to staff', () => {
    modules = [];
    role = 'NURSE';
    expect(run('dashboard')).toBe(true);
  });
});
