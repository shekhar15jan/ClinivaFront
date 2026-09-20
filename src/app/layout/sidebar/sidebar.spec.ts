import { TestBed } from '@angular/core/testing';
import { Sidebar } from './sidebar';
import { EffectiveLicenseService } from '../../core/services/effective-license.service';
import { AuthService } from '../../core/services/auth.service';
import { signal } from '@angular/core';
import { vi } from 'vitest';

describe('Sidebar', () => {
  function setup(activeModules: string[] = [], role = 'ADMIN') {
    const mockUser = { id: 'u1', email: 'admin@test.com', role, name: 'Admin' };
    const mockAuthService = {
      currentUser: signal(mockUser),
      currentUserValue: mockUser,
      currentUser$: { subscribe: vi.fn() },
    };
    const mockEffectiveLicense = {
      activeModules: vi.fn().mockReturnValue(activeModules),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: EffectiveLicenseService, useValue: mockEffectiveLicense },
        { provide: AuthService, useValue: mockAuthService },
      ],
    });
    const component = TestBed.runInInjectionContext(() => new Sidebar());
    return { component, mockEffectiveLicense, mockAuthService };
  }

  it('should create', () => {
    const { component } = setup();
    expect(component).toBeTruthy();
  });

  it('should have 17 staff nav items', () => {
    const { component } = setup();
    expect(component.staffNavItems.length).toBe(17);
  });

  it('should have 5 patient nav items', () => {
    const { component } = setup();
    expect(component.patientNavItems.length).toBe(5);
  });

  it('should return activeModules from license service', () => {
    const { component } = setup(['DASHBOARD', 'PATIENT']);
    expect(component.activeModules()).toEqual(['DASHBOARD', 'PATIENT']);
  });

  it('should return empty array when no active modules', () => {
    const { component } = setup([]);
    expect(component.activeModules()).toEqual([]);
  });

  it('should have correct staff nav item structure', () => {
    const { component } = setup();
    const item = component.staffNavItems[0];
    expect(item).toHaveProperty('code');
    expect(item).toHaveProperty('label');
    expect(item).toHaveProperty('icon');
    expect(item).toHaveProperty('route');
  });

  it('should return staff items for ADMIN role', () => {
    const { component } = setup([], 'ADMIN');
    const items = component.navItems();
    expect(items).toBe(component.staffNavItems);
  });

  it('should return patient items for PATIENT role', () => {
    const { component } = setup([], 'PATIENT');
    const items = component.navItems();
    expect(items).toBe(component.patientNavItems);
  });
});
