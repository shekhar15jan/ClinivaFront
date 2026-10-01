import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { MobileDrawer } from './mobile-drawer';
import { AuthService } from '../../core/services/auth.service';
import { EffectiveLicenseService } from '../../core/services/effective-license.service';

describe('MobileDrawer (phone menu)', () => {
  it('Logout really signs out: the session is ended, not just the page changed', () => {
    const auth = { currentUserValue: { role: 'RECEPTIONIST' }, currentUser: signal(null), logout: vi.fn() };
    const router = { navigate: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
        { provide: EffectiveLicenseService, useValue: { activeModules: signal(['PATIENT']) } },
      ],
    });
    const drawer = TestBed.runInInjectionContext(() => new MobileDrawer());
    const closed = vi.fn();
    drawer.closed.subscribe(closed);

    drawer.logout();

    expect(auth.logout).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    expect(closed).toHaveBeenCalled();
  });
});
