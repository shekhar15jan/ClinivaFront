import { TestBed } from '@angular/core/testing';
import { GenericLogin } from './generic-login';
import { AuthService } from '../../../core/services/auth.service';
import { TenantService } from '../../../core/services/tenant.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { TenantResolution } from '../../../core/models/tenant.model';
import { of, Subject } from 'rxjs';
import { vi } from 'vitest';
import { User } from '../../../core/models/auth.model';

const mockResolution: TenantResolution = {
  tenant: {
    id: 't1',
    tenantId: 'test-hospital',
    name: 'Test Hospital',
    contactEmail: 'admin@test.com',
    status: 'ACTIVE',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    patientIdPrefix: 'PAT',
  },
  modules: [],
  subscription: {
    id: 's1',
    tenantId: 't1',
    productId: 'p1',
    planId: 'plan1',
    planName: 'Basic',
    status: 'ACTIVE',
    startDate: '2025-01-01',
    endDate: '2026-01-01',
    maxDoctors: 5,
    maxPatients: 100,
  },
};

function createGenericLogin() {
  const authStateSubject = new Subject<{ isAuthenticated: boolean; user: User | null }>();
  
  const resolveByEmail = vi.fn();
  const setTenantResolution = vi.fn();
  const authSpy = { 
    setTenantResolution, 
    pendingEmail: null,
    authState$: authStateSubject.asObservable()
  };
  const tenantSpy = { resolveByEmail };
  const routerSpy = { navigate: vi.fn() };
  const routeSpy = { snapshot: { queryParams: {} } };
  const cdrSpy = { markForCheck: vi.fn(), detectChanges: vi.fn() };

  TestBed.configureTestingModule({
    providers: [
      { provide: AuthService, useValue: authSpy },
      { provide: TenantService, useValue: tenantSpy },
      { provide: Router, useValue: routerSpy },
      { provide: ActivatedRoute, useValue: routeSpy },
      { provide: ChangeDetectorRef, useValue: cdrSpy },
    ],
  });

  const component = TestBed.runInInjectionContext(() => new GenericLogin());
  
  // Trigger ngOnInit manually since TestBed.runInInjectionContext doesn't call lifecycle hooks
  component.ngOnInit();
  
  return { component, authSpy, tenantSpy, routerSpy, authStateSubject, routeSpy };
}

describe('GenericLogin', () => {
  it('should create', () => {
    const { component } = createGenericLogin();
    expect(component).toBeTruthy();
  });

  it('should have initial state', () => {
    const { component } = createGenericLogin();
    expect(component.email).toBe('');
    expect(component.isLoading).toBe(false);
    expect(component.errorMessage).toBe('');
    expect(component.resolutions).toEqual([]);
    expect(component.showSelection).toBe(false);
  });

  describe('resolveTenant', () => {
    it('should set error for empty email', () => {
      const { component } = createGenericLogin();
      component.email = '';
      component.resolveTenant();
      expect(component.errorMessage).toBe('Please enter a valid email address.');
    });

    it('should set error for email without @', () => {
      const { component } = createGenericLogin();
      component.email = 'notanemail';
      component.resolveTenant();
      expect(component.errorMessage).toBe('Please enter a valid email address.');
    });

    it('should set loading state and call resolveByEmail', () => {
      const { component, tenantSpy } = createGenericLogin();
      const subject = new Subject<{ success: boolean; data: TenantResolution[] }>();
      tenantSpy.resolveByEmail.mockReturnValue(subject);
      component.email = 'admin@test.com';
      component.resolveTenant();
      expect(component.isLoading).toBe(true);
      expect(tenantSpy.resolveByEmail).toHaveBeenCalledWith('admin@test.com');
      subject.next({ success: true, data: [] });
      expect(component.isLoading).toBe(false);
    });

    it('should navigate to tenant login when single resolution returned', () => {
      const { component, authSpy, routerSpy, tenantSpy } = createGenericLogin();
      tenantSpy.resolveByEmail.mockReturnValue(of({ success: true, data: [mockResolution] }));
      component.email = 'admin@test.com';
      component.resolveTenant();
      expect(authSpy.setTenantResolution).toHaveBeenCalledWith(mockResolution);
      expect(authSpy.pendingEmail).toBe('admin@test.com');
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/test-hospital/login']);
      expect(component.isLoading).toBe(false);
    });

    it('should show selection when multiple resolutions returned', () => {
      const { component, tenantSpy } = createGenericLogin();
      const resolution2: TenantResolution = {
        ...mockResolution,
        tenant: { ...mockResolution.tenant, tenantId: 'hospital-2', name: 'Hospital 2' },
      };
      tenantSpy.resolveByEmail.mockReturnValue(of({ success: true, data: [mockResolution, resolution2] }));
      component.email = 'admin@test.com';
      component.resolveTenant();
      expect(component.showSelection).toBe(true);
      expect(component.resolutions.length).toBe(2);
      expect(component.isLoading).toBe(false);
    });

    it('should set error when no resolutions returned', () => {
      const { component, tenantSpy } = createGenericLogin();
      tenantSpy.resolveByEmail.mockReturnValue(of({ success: true, data: [] }));
      component.email = 'admin@test.com';
      component.resolveTenant();
      expect(component.errorMessage).toBe('No account found with this email address.');
      expect(component.isLoading).toBe(false);
    });

    it('should handle API errors', () => {
      const { component, tenantSpy } = createGenericLogin();
      const errorResponse = { error: { message: 'Server error' } };
      tenantSpy.resolveByEmail.mockReturnValue(new Subject<never>());
      component.email = 'admin@test.com';
      component.resolveTenant();
      const subject = tenantSpy.resolveByEmail.mock.results[0].value;
      subject.error(errorResponse);
      expect(component.errorMessage).toBe('Server error');
      expect(component.isLoading).toBe(false);
    });

    it('should handle API errors with fallback message', () => {
      const { component, tenantSpy } = createGenericLogin();
      tenantSpy.resolveByEmail.mockReturnValue(of({}));
      component.email = 'admin@test.com';
      component.resolveTenant();
      expect(component.isLoading).toBe(false);
    });
  });

  describe('selectTenant', () => {
    it('should set resolution and navigate', () => {
      const { component, authSpy, routerSpy } = createGenericLogin();
      component.email = 'admin@test.com';
      component.selectTenant(mockResolution);
      expect(authSpy.setTenantResolution).toHaveBeenCalledWith(mockResolution);
      expect(authSpy.pendingEmail).toBe('admin@test.com');
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/test-hospital/login']);
    });
  });

  describe('goToHospitalCode', () => {
    it('should navigate to /login', () => {
      const { component, routerSpy } = createGenericLogin();
      component.goToHospitalCode();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });
  });
});
