import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { SettingService } from '../../../../core/services/setting.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { ClinicSettings } from '../../../../core/models/setting.model';
import { ClinicSettingsPage } from './clinic-settings';

const saved: ClinicSettings = {
  clinicName: 'Sai Clinic',
  address: '12 Lake Road, Pune',
  phone: '9876512345',
  email: 'desk@sai.test',
  patientIdPrefix: 'SAI',
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  defaultConsultationFeeInPaisa: 75000,
  enableOnlinePayment: true,
  enableOtpLogin: true,
};
const ok = (data: ClinicSettings) => ({ success: true, data, message: 'ok', timestamp: '', requestId: 'r' });

describe('ClinicSettingsPage', () => {
  let service: { get: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  function create() {
    service = { get: vi.fn().mockReturnValue(of(ok(saved))), update: vi.fn().mockImplementation((s: ClinicSettings) => of(ok(s))) };
    toast = { success: vi.fn(), error: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: {} },
        { provide: ActivatedRoute, useValue: {} },
        { provide: SettingService, useValue: service },
        { provide: ToastService, useValue: toast },
      ],
    });
    const component = TestBed.runInInjectionContext(() => new ClinicSettingsPage());
    component.ngOnInit();
    return component;
  }

  it('shows the clinic saved settings, not made-up ones', () => {
    const component = create();
    expect(component.settings.clinicName).toBe('Sai Clinic');
    expect(component.settings.patientIdPrefix).toBe('SAI');
    expect(component.defaultFee).toBe(750);
    expect(component.isLoading).toBe(false);
  });

  it('says why the settings could not be loaded and offers a retry', () => {
    const component = create();
    service.get.mockReturnValue(throwError(() => ({ error: { message: 'Module is not active: SETTINGS' } })));
    component.load();
    expect(component.error).toBe('Module is not active: SETTINGS');
    service.get.mockReturnValue(of(ok(saved)));
    component.load();
    expect(component.error).toBe('');
  });

  it('saves the edited settings, sending the fee in paise and the prefix in capitals', () => {
    const component = create();
    component.settings.clinicName = '  Live Care  ';
    component.settings.patientIdPrefix = 'lc';
    component.defaultFee = 649.5;
    component.save();
    expect(service.update).toHaveBeenCalledWith(
      expect.objectContaining({ clinicName: 'Live Care', patientIdPrefix: 'LC', defaultConsultationFeeInPaisa: 64950 }),
    );
    expect(toast.success).toHaveBeenCalledWith('Settings saved');
    expect(component.isSaving).toBe(false);
  });

  it('will not save without a clinic name or a prefix', () => {
    const component = create();
    component.settings.clinicName = '   ';
    component.save();
    component.settings.clinicName = 'Sai Clinic';
    component.settings.patientIdPrefix = '';
    component.save();
    expect(service.update).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledTimes(2);
  });

  it('will not save a negative fee', () => {
    const component = create();
    component.defaultFee = -1;
    component.save();
    expect(service.update).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('The default consultation fee cannot be negative.');
  });

  it('shows the server reason when saving fails, and stays editable', () => {
    const component = create();
    service.update.mockReturnValue(throwError(() => ({ error: { message: 'Prefix already in use' } })));
    component.save();
    expect(toast.error).toHaveBeenCalledWith('Prefix already in use');
    expect(component.isSaving).toBe(false);
  });

  it('discards unsaved edits by reading the saved settings again', () => {
    const component = create();
    component.settings.clinicName = 'Typed but not saved';
    component.load();
    expect(component.settings.clinicName).toBe('Sai Clinic');
  });

  it('ignores a second save while one is running', () => {
    const component = create();
    component.isSaving = true;
    component.save();
    expect(service.update).not.toHaveBeenCalled();
  });
});
