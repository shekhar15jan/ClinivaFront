import { TestBed } from '@angular/core/testing';
import { Sidebar } from './sidebar';
import { EffectiveLicenseService } from '../../core/services/effective-license.service';
import { AuthService } from '../../core/services/auth.service';
import { vi } from 'vitest';

describe('Sidebar', () => {
  function setup(activeModules: string[] = []) {
    const mockAuthService = {};
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

  it('should expose 12 nav items', () => {
    const { component } = setup();
    expect(component.navItems.length).toBe(12);
  });

  it('should return activeModules from license service', () => {
    const { component } = setup(['DASHBOARD', 'PATIENT']);
    expect(component.activeModules()).toEqual(['DASHBOARD', 'PATIENT']);
  });

  it('should return empty array when no active modules', () => {
    const { component } = setup([]);
    expect(component.activeModules()).toEqual([]);
  });

  it('should have correct nav item structure', () => {
    const { component } = setup();
    const item = component.navItems[0];
    expect(item).toHaveProperty('code');
    expect(item).toHaveProperty('label');
    expect(item).toHaveProperty('icon');
    expect(item).toHaveProperty('route');
  });
});
