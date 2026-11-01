import { TestBed } from '@angular/core/testing';
import { Router, NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { signal } from '@angular/core';
import { TourComponent } from './tour.component';
import { TourService } from './tour.service';

/** The tour card must never sit on top of a form or a booking step: it shows on the home screen only. */
describe('TourComponent', () => {
  let events: Subject<unknown>;
  let router: { url: string; events: Subject<unknown> };

  function create(stepRoute: string | undefined) {
    const tour = {
      current: signal({ title: 'Dashboard', text: 't', icon: 'dashboard', route: stepRoute }),
      index: signal(0),
      steps: signal([{}, {}, {}]),
      isLast: () => false,
      startIfFirstRun: vi.fn(),
      finish: vi.fn(), next: vi.fn(), back: vi.fn(), showMe: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: TourService, useValue: tour }, { provide: Router, useValue: router }],
    });
    const f = TestBed.createComponent(TourComponent);
    f.detectChanges();
    return { f, el: f.nativeElement as HTMLElement };
  }

  function go(f: ReturnType<typeof create>['f'], url: string) {
    router.url = url;
    events.next(Object.assign(Object.create(NavigationEnd.prototype), { url }));
    f.detectChanges();
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
    events = new Subject();
    router = { url: '/CITY/dashboard', events };
  });

  it('shows on the home screen', () => {
    const { el } = create('patients');
    expect(el.querySelector('#tour-card')).not.toBeNull();
  });

  it('hides while the person is on a form or booking screen, and returns on the home screen', () => {
    const { f, el } = create('patients');
    go(f, '/CITY/appointments/book');
    expect(el.querySelector('#tour-card')).toBeNull();
    go(f, '/CITY/dashboard');
    expect(el.querySelector('#tour-card')).not.toBeNull();
  });

  it('shows on the screen a step just opened with "Show me"', () => {
    const { f, el } = create('patients');
    go(f, '/CITY/patients');
    expect(el.querySelector('#tour-card')).not.toBeNull();
  });

  it('shows on the patient home screen too', () => {
    router.url = '/CITY/patient/dashboard';
    const { el } = create('patient/appointments');
    expect(el.querySelector('#tour-card')).not.toBeNull();
  });
});
