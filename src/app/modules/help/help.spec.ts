import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '../../core/services/auth.service';
import { EffectiveLicenseService } from '../../core/services/effective-license.service';
import { ROLE_PERMISSIONS, userWithRole } from '../../testing/role-permissions';
import { HELP_ARTICLES, articlesFor, tourStepsFor } from './help-content';
import { HelpPageComponent } from './help-page';
import { TourComponent } from './tour.component';
import { TourService } from './tour.service';

const MODULES = ['DASHBOARD', 'PATIENT', 'DOCTOR', 'APPOINTMENT', 'CONSULTATION', 'PRESCRIPTION', 'BILLING', 'PAYMENT', 'MEDICINE', 'REPORTS',
  'USER', 'SETTINGS', 'IPD', 'NURSING', 'PHARMACY_STOCK', 'LAB', 'INSURANCE', 'ANALYTICS'];

describe('Help content', () => {
  it('gives every article a title, steps in plain words and a unique id', () => {
    const ids = HELP_ARTICLES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const a of HELP_ARTICLES) {
      expect(a.title.length).toBeGreaterThan(3);
      expect(a.steps.length).toBeGreaterThanOrEqual(2);
      expect(a.roles.length).toBeGreaterThan(0);
    }
  });

  it('shows each role its own articles first, plus the ones for everyone', () => {
    expect(articlesFor('DOCTOR')[0].id).toBe('run-consultation');
    expect(articlesFor('NURSE').map((a) => a.id)).toContain('ward-round');
    expect(articlesFor('NURSE').map((a) => a.id)).not.toContain('set-up-clinic');
    expect(articlesFor('PATIENT').map((a) => a.id)).toEqual(['patient-portal', 'sign-in-and-safety']);
    // A custom role still gets the general article rather than an empty page.
    expect(articlesFor('MY_CUSTOM_ROLE').map((a) => a.id)).toEqual(['sign-in-and-safety']);
    expect(articlesFor(undefined).length).toBe(1);
  });

  it('tours every built-in staff role in 3 to 5 steps that end with Help and only point at menu items the role can open', () => {
    for (const role of Object.keys(ROLE_PERMISSIONS).filter((r) => r !== 'PATIENT')) {
      const steps = tourStepsFor(role, ROLE_PERMISSIONS[role], MODULES);
      expect(steps.length, role).toBeGreaterThanOrEqual(3);
      expect(steps.length, role).toBeLessThanOrEqual(5);
      expect(steps[steps.length - 1].route).toBe('help');
    }
    const nurse = tourStepsFor('NURSE', ROLE_PERMISSIONS['NURSE'], MODULES).map((s) => s.route);
    expect(nurse[0]).toBe('nursing');
    expect(nurse).not.toContain('billing');
  });

  it('leaves out menu items the clinic plan does not include', () => {
    const routes = tourStepsFor('RECEPTIONIST', ROLE_PERMISSIONS['RECEPTIONIST'], ['PATIENT']).map((s) => s.route);
    // Billing and Appointments are not in this plan; the short tour is padded with the search tip (no route).
    expect(routes).toEqual([undefined, 'patients', 'help']);
  });

  it('pads a very short tour to three steps, and falls back to the menu for a custom role', () => {
    const lab = tourStepsFor('LAB_TECHNICIAN', ROLE_PERMISSIONS['LAB_TECHNICIAN'], ['PATIENT']);
    expect(lab.length).toBe(3);
    expect(lab[0].route).toBeUndefined();
    const custom = tourStepsFor('CLINIC_CUSTOM', ['PATIENT_VIEW'], MODULES).map((s) => s.route);
    expect(custom).toEqual(['dashboard', 'patients', 'help']);
  });

  it('tours a patient through the portal, never the staff menu', () => {
    const steps = tourStepsFor('PATIENT', [], MODULES);
    expect(steps.every((s) => s.route!.startsWith('patient/'))).toBe(true);
    expect(steps[steps.length - 1].route).toBe('patient/help');
  });
});

describe('TourService', () => {
  const router = { navigate: vi.fn(), url: '/sai/dashboard' };
  let user: ReturnType<typeof userWithRole> | null;

  function create(): TourService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: { get currentUserValue() { return user; } } },
        { provide: EffectiveLicenseService, useValue: { activeModules: signal(MODULES) } },
      ],
    });
    return TestBed.inject(TourService);
  }

  beforeEach(() => {
    localStorage.clear();
    router.navigate.mockClear();
    user = userWithRole('DOCTOR');
  });

  it('starts on the first run, walks the steps and remembers it when done', () => {
    const t = create();
    t.startIfFirstRun();
    expect(t.running()).toBe(true);
    expect(t.index()).toBe(0);
    const n = t.steps().length;
    for (let i = 0; i < n - 1; i++) t.next();
    expect(t.isLast()).toBe(true);
    t.next();
    expect(t.running()).toBe(false);
    expect(localStorage.getItem('cliniva.tour.done.u1')).toBe('1');
    t.startIfFirstRun();
    expect(t.running()).toBe(false);
  });

  it('remembers a dismissal per person, so another person on the same device still gets the tour', () => {
    const t = create();
    t.startIfFirstRun();
    t.finish();
    user = userWithRole('NURSE', { id: 'u2' });
    expect(t.hasSeen()).toBe(false);
    t.startIfFirstRun();
    expect(t.running()).toBe(true);
  });

  it('can be started again from Help even after it was seen', () => {
    const t = create();
    t.finish();
    expect(t.hasSeen()).toBe(true);
    t.start();
    expect(t.running()).toBe(true);
  });

  it('goes back but not before the first step', () => {
    const t = create();
    t.start();
    t.back();
    expect(t.index()).toBe(0);
    t.next();
    t.back();
    expect(t.index()).toBe(0);
  });

  it('does nothing when nobody is signed in', () => {
    user = null;
    const t = create();
    t.startIfFirstRun();
    t.start();
    expect(t.running()).toBe(false);
    t.finish();
  });

  it('survives blocked storage without nagging or throwing', () => {
    const t = create();
    const get = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    expect(t.hasSeen()).toBe(true);
    t.start();
    expect(() => t.finish()).not.toThrow();
    get.mockRestore();
    set.mockRestore();
  });

  it('Show me opens the step screen in the clinic and moves on', () => {
    const t = create();
    t.start();
    const first = t.current()!.route!;
    t.showMe('sai');
    expect(router.navigate).toHaveBeenCalledWith(['/', 'sai', ...first.split('/')]);
    expect(t.index()).toBe(1);
  });
});

describe('Help screens', () => {
  const router = { navigate: vi.fn(), url: '/sai/dashboard', events: new Subject<unknown>() };

  function setup(role: string) {
    localStorage.clear();
    TestBed.resetTestingModule();
    const u = userWithRole(role);
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: { currentUserValue: u, currentUser: signal(u) } },
        { provide: EffectiveLicenseService, useValue: { activeModules: signal(MODULES) } },
      ],
    });
  }

  it('lists the role articles, switches to everything and restarts the tour', () => {
    setup('NURSE');
    const f = TestBed.createComponent(HelpPageComponent);
    f.detectChanges();
    const el: HTMLElement = f.nativeElement;
    const mine = el.querySelectorAll('details').length;
    expect(el.querySelector('[data-article="ward-round"]')).toBeTruthy();
    expect(el.querySelector('[data-article="set-up-clinic"]')).toBeNull();
    (el.querySelector('#show-all') as HTMLButtonElement).click();
    f.detectChanges();
    expect(el.querySelectorAll('details').length).toBe(HELP_ARTICLES.length);
    expect(mine).toBeLessThan(HELP_ARTICLES.length);
    (el.querySelector('#start-tour') as HTMLButtonElement).click();
    expect(TestBed.inject(TourService).running()).toBe(true);
  });

  it('shows the tour card on the first run, with phone-sized buttons, and Skip remembers it', () => {
    setup('DOCTOR');
    const f = TestBed.createComponent(TourComponent);
    f.detectChanges();
    const el: HTMLElement = f.nativeElement;
    expect(el.querySelector('#tour-count')!.textContent).toContain('Step 1 of');
    expect(el.querySelector('#tour-next')!.className).toContain('min-h-touch');
    (el.querySelector('#tour-next') as HTMLButtonElement).click();
    f.detectChanges();
    expect(el.querySelector('#tour-count')!.textContent).toContain('Step 2 of');
    expect(el.querySelector('#tour-back')).toBeTruthy();
    (el.querySelector('#tour-skip') as HTMLButtonElement).click();
    f.detectChanges();
    expect(el.querySelector('#tour-card')).toBeNull();
    expect(localStorage.getItem('cliniva.tour.done.u1')).toBe('1');
  });

  it('stays away when an automated run has switched the tour off', () => {
    setup('DOCTOR');
    localStorage.setItem('cliniva.tour.off', '1');
    const f = TestBed.createComponent(TourComponent);
    f.detectChanges();
    expect(f.nativeElement.querySelector('#tour-card')).toBeNull();
    localStorage.removeItem('cliniva.tour.off');
  });

  it('does not show the card to someone who has already seen it', () => {
    setup('DOCTOR');
    localStorage.setItem('cliniva.tour.done.u1', '1');
    const f = TestBed.createComponent(TourComponent);
    f.detectChanges();
    expect(f.nativeElement.querySelector('#tour-card')).toBeNull();
  });
});
