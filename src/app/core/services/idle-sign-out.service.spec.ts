import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { AuthService } from './auth.service';
import { IDLE_LIMIT_MS, IDLE_WARNING_MS, IdleSignOutService } from './idle-sign-out.service';
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

  it('does nothing while nobody is signed in', () => {
    const s = create();
    loggedIn = false;
    clock += IDLE_LIMIT_MS * 2;
    s.check();
    expect(auth.logout).not.toHaveBeenCalled();
    expect(s.secondsLeft()).toBeNull();
  });
});
