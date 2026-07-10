import { TestBed } from '@angular/core/testing';
import { ClinicSettingsPage } from './clinic-settings';

describe('ClinicSettingsPage', () => {
  it('should create with default settings', () => {
    TestBed.configureTestingModule({});
    const component = TestBed.runInInjectionContext(() => new ClinicSettingsPage());
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
