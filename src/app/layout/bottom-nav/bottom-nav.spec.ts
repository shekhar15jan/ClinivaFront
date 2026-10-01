import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { BottomNav } from './bottom-nav';
import { AuthService } from '../../core/services/auth.service';
import { EffectiveLicenseService } from '../../core/services/effective-license.service';

describe('BottomNav (phone bar)', () => {
  const ALL = ['PATIENT', 'DOCTOR', 'APPOINTMENT', 'SETTINGS', 'BILLING', 'PRESCRIPTION'];

  function labels(role: string, modules: string[] = ALL): string[] {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { currentUserValue: { role } } },
        { provide: EffectiveLicenseService, useValue: { activeModules: signal(modules) } },
      ],
    });
    return TestBed.runInInjectionContext(() => new BottomNav()).navItems().map((i) => i.label);
  }

  it('gives an administrator the whole bar', () => {
    expect(labels('ADMIN')).toEqual(['Home', 'Schedule', 'Patients', 'Settings']);
  });

  it('does not offer Settings to staff who may not open it', () => {
    expect(labels('RECEPTIONIST')).toEqual(['Home', 'Schedule', 'Patients']);
    expect(labels('NURSE')).toEqual(['Home', 'Schedule', 'Patients']);
    expect(labels('DOCTOR')).not.toContain('Settings');
  });

  it('follows the plan: no Schedule when the clinic has no appointments module', () => {
    expect(labels('ADMIN', ['PATIENT', 'SETTINGS'])).toEqual(['Home', 'Patients', 'Settings']);
  });

  it('gives a patient their bills, so Pay now is reachable on a phone', () => {
    expect(labels('PATIENT')).toEqual(['Home', 'Appointments', 'Rx', 'Bills', 'Profile']);
  });
});
