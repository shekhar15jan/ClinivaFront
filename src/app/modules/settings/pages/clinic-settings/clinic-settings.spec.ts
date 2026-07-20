import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { ClinicSettingsPage } from './clinic-settings';

describe('ClinicSettingsPage', () => {
  it('should create with default settings', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: {} },
        { provide: ActivatedRoute, useValue: {} },
      ],
    });
    const component = TestBed.runInInjectionContext(() => new ClinicSettingsPage(
      TestBed.inject(Router),
      TestBed.inject(ActivatedRoute),
    ));
    expect(component).toBeTruthy();
    expect(component.settings.clinicName).toBe('Cliniva Hospital');
    expect(component.settings.currency).toBe('INR');
    expect(component.settings.timezone).toBe('Asia/Kolkata');
    expect(component.settings.patientIdPrefix).toBe('CLI');
    expect(component.settings.enableOnlinePayment).toBe(true);
    expect(component.settings.enableOtpLogin).toBe(true);
    expect(component.defaultFee).toBe(500);
  });
});
