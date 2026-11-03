import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { AuthService } from './auth.service';
import { IDLE_LIMIT_MS, IDLE_TEST_KEY, IDLE_WARNING_MS, IdleSignOutService } from './idle-sign-out.service';
import { TenantContextService } from './tenant-context.service';

describe('IdleSignOutService', () => {
  let clock = 0;
  let loggedIn = true;
  const auth = { isLoggedIn: () => loggedIn, logout: vi.fn() };
  const router = { navigate: vi.fn() };

  function create(): IdleSignOutService {
    clock = 1_000_000;
    loggedIn = true;
    auth.logout.mockClear();
    router.navigate.mockClear();
    try { localStorage.removeItem('cliniva.lastActivity'); } catch { /* blocked storage */ }
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: AuthService, useValue: auth }, { provide: Router, useValue: router },
      { provide: TenantContextService, useValue: { tenantCode: () => 'CITY' } }] });
    const s = TestBed.inject(IdleSignOutService);
    s.start(() => clock);
    return s;
  }

  afterEach(() => TestBed.inject(IdleSignOutService).ngOnDestroy());

  it('warns a minute before and signs out after the idle limit', () => {
    const s = create();
    clock += IDLE_LIMIT_MS - IDLE_WARNING_MS - 1000;
    s.check();
    expect(s.secondsLeft()).toBeNull();
    clock += 2000;
    s.check();
    expect(s.secondsLeft()).toBe(59);
    clock += IDLE_WARNING_MS;
    s.check();
    expect(auth.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/CITY/login'], { queryParams: { reason: 'idle' } });
    expect(sessionStorage.getItem('cliniva.signedOutIdle')).toBe('1');
    sessionStorage.removeItem('cliniva.signedOutIdle');
  });

  it('a browser test may shorten the limit, but nobody can lengthen it', () => {
    const s = create();
    localStorage.setItem(IDLE_TEST_KEY, '10000');
    clock += 10_000;
    s.check();
    expect(auth.logout).toHaveBeenCalledTimes(1);
    localStorage.setItem(IDLE_TEST_KEY, String(IDLE_LIMIT_MS * 10));
    const t = create();
    clock += IDLE_LIMIT_MS;
    t.check();
    expect(auth.logout).toHaveBeenCalledTimes(1);
    localStorage.removeItem(IDLE_TEST_KEY);
  });

  it('starts the clock again on activity, including from another tab', () => {
    const s = create();
    clock += IDLE_LIMIT_MS - 30_000;
    s.check();
    expect(s.secondsLeft()).not.toBeNull();
    s.touch();
    expect(s.secondsLeft()).toBeNull();
    clock += IDLE_LIMIT_MS - 30_000;
    localStorage.setItem('cliniva.lastActivity', String(clock - 1000));
    s.check();
    expect(s.secondsLeft()).toBeNull();
    expect(auth.logout).not.toHaveBeenCalled();
  });

  it('goes to the generic login when the clinic code is unknown, and a real key press restarts the clock', () => {
    const s = create();
    s.ngOnDestroy();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: AuthService, useValue: auth }, { provide: Router, useValue: router },
      { provide: TenantContextService, useValue: { tenantCode: () => '' } }] });
    const s2 = TestBed.inject(IdleSignOutService);
    clock = 7_000_000;
    s2.start(() => clock);
    clock += IDLE_LIMIT_MS - 10_000;
    document.dispatchEvent(new Event('keydown'));
    clock += 20_000;
    s2.check();
    expect(auth.logout).not.toHaveBeenCalled();
    clock += IDLE_LIMIT_MS;
    s2.check();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { reason: 'idle' } });
  });

  it('does nothing while nobody is signed in', () => {
    const s = create();
    loggedIn = false;
    clock += IDLE_LIMIT_MS * 2;
    s.check();
    expect(auth.logout).not.toHaveBeenCalled();
    expect(s.secondsLeft()).toBeNull();
  });
});
