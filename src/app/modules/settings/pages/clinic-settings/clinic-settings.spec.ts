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
  let service: Record<string, ReturnType<typeof vi.fn>>;
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  function create() {
    service = {
      get: vi.fn().mockReturnValue(of(ok(saved))),
      update: vi.fn().mockImplementation((s: ClinicSettings) => of(ok(s))),
      uploadLogo: vi.fn().mockReturnValue(of(ok({ ...saved, logoUrl: '/api/v1/public/media/abc' }))),
      removeLogo: vi.fn().mockReturnValue(of(ok({ ...saved, logoUrl: null }))),
    };
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

  describe('billing, payments and branding', () => {
    it('saves the GST rate, UPI ID and sender name with the rest', () => {
      const component = create();
      component.settings.taxRatePercent = 18;
      component.settings.upiPayeeId = ' sai@okhdfcbank ';
      component.settings.emailSenderName = ' Sai Clinic Pune ';
      component.save();
      expect(service['update'].mock.calls[0][0]).toMatchObject({
        taxRatePercent: 18,
        upiPayeeId: 'sai@okhdfcbank',
        emailSenderName: 'Sai Clinic Pune',
      });
    });

    it('refuses a GST rate outside 0-100 and a malformed UPI ID', () => {
      const component = create();
      component.settings.taxRatePercent = 180;
      component.save();
      expect(toast.error).toHaveBeenCalledWith('GST must be between 0 and 100%.');
      component.settings.taxRatePercent = 5;
      component.settings.upiPayeeId = 'not a upi';
      component.save();
      expect(toast.error).toHaveBeenCalledWith('Enter a UPI ID such as clinic@okhdfcbank.');
      expect(service['update']).not.toHaveBeenCalled();
    });

    it("saves the clinic's Razorpay keys, sending a secret only when one was typed", () => {
      const component = create();
      component.settings.razorpayKeyId = ' rzp_live_AbC123xyz ';
      component.razorpaySecret = ' the-secret ';
      component.save();
      expect(service['update'].mock.calls[0][0]).toMatchObject({
        razorpayKeyId: 'rzp_live_AbC123xyz',
        razorpayKeySecret: 'the-secret',
        razorpayWebhookSecret: undefined,
      });
      // The typed secret is not kept on screen after saving.
      expect(component.razorpaySecret).toBe('');
    });

    it('refuses a malformed key id, or a key id without its secret', () => {
      const component = create();
      component.settings.razorpayKeyId = 'my-key';
      component.save();
      expect(toast.error).toHaveBeenCalledWith('Enter the Razorpay Key ID, which starts with rzp_live_ or rzp_test_.');
      component.settings.razorpayKeyId = 'rzp_live_AbC123xyz';
      component.settings.razorpayKeySecretSet = false;
      component.save();
      expect(toast.error).toHaveBeenCalledWith('Enter the Razorpay key secret for this Key ID.');
      expect(service['update']).not.toHaveBeenCalled();
    });

    it("shows the clinic's webhook address and can disconnect Razorpay", () => {
      const component = create();
      component.settings.clinicCode = 'SAI01';
      expect(component.webhookUrl).toMatch(/\/hms\/payments\/webhook\/SAI01$/);
      component.settings.razorpayKeyId = 'rzp_live_AbC123xyz';
      component.settings.razorpayKeySecretSet = true;
      component.removeRazorpay();
      component.save();
      expect(service['update'].mock.calls[0][0]).toMatchObject({ razorpayKeyId: '' });
    });

    it('uploads a logo, shows it, and can remove it', () => {
      const component = create();
      const file = new File([new Uint8Array([0x89, 0x50])], 'logo.png', { type: 'image/png' });
      component.onLogoSelected({ target: { files: [file], value: 'x' } } as unknown as Event);
      expect(service['uploadLogo']).toHaveBeenCalledWith(file);
      expect(component.logoSrc).toContain('/public/media/abc');
      component.removeLogo();
      expect(component.logoSrc).toBeNull();
    });

    it('refuses a logo over 512 KB before uploading', () => {
      const component = create();
      const big = new File([new Uint8Array(512 * 1024 + 1)], 'big.png', { type: 'image/png' });
      component.onLogoSelected({ target: { files: [big], value: 'x' } } as unknown as Event);
      expect(service['uploadLogo']).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalled();
    });
  });
});
