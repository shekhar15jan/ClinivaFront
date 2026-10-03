import { TestBed } from '@angular/core/testing';
import { fakeAuth } from '../../testing/role-permissions';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { Header } from './header';
import { AuthService } from '../../core/services/auth.service';
import { EffectiveLicenseService } from '../../core/services/effective-license.service';
import { NotificationService } from '../../core/services/notification.service';

describe('Header', () => {
  const router = { url: '/sai-clinic/dashboard?x=1', navigate: vi.fn() };

  function create(role: string, modules: string[] = ['APPOINTMENT', 'PATIENT']): Header {
    router.navigate.mockClear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: fakeAuth(role) },
        { provide: EffectiveLicenseService, useValue: { activeModules: signal(modules) } },
        { provide: NotificationService, useValue: { getUnreadCount: vi.fn(() => of({ data: { count: 0 } })) } },
      ],
    });
    return TestBed.runInInjectionContext(() => new Header());
  }

  it('offers New Appointment to those who book, when the plan has appointments', () => {
    expect(create('RECEPTIONIST').canBook).toBe(true);
    expect(create('ADMIN').canBook).toBe(true);
    expect(create('NURSE').canBook).toBe(false);
    expect(create('DOCTOR').canBook).toBe(false);
    expect(create('ADMIN', ['PATIENT']).canBook).toBe(false);
  });

  it('opens booking in the current clinic', () => {
    create('RECEPTIONIST').newAppointment();
    expect(router.navigate).toHaveBeenCalledWith(['/', 'sai-clinic', 'appointments', 'book']);
  });

  it('opens the Patients screen with the search text (it did nothing before)', () => {
    const header = create('NURSE');
    header.searchPatients('  Rao ');
    expect(router.navigate).toHaveBeenCalledWith(['/', 'sai-clinic', 'patients'], { queryParams: { q: 'Rao' } });
    header.searchPatients('');
    expect(router.navigate).toHaveBeenLastCalledWith(['/', 'sai-clinic', 'patients'], { queryParams: {} });
  });
});
