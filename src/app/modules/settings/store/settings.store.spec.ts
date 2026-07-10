import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { SettingsStore } from './settings.store';
import { SettingService } from '../../../core/services/setting.service';
import { ClinicSettings } from '../../../core/models/setting.model';

describe('SettingsStore', () => {
  let store: InstanceType<typeof SettingsStore>;
  let mockSettingService: Partial<SettingService>;

  const mockSettings: ClinicSettings = {
    clinicName: 'Test Clinic',
    address: '123 Main St',
    phone: '9876543210',
    email: 'clinic@test.com',
    patientIdPrefix: 'CLV',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    defaultConsultationFeeInPaisa: 50000,
    enableOnlinePayment: true,
    enableOtpLogin: true,
  };

  beforeEach(() => {
    mockSettingService = {
      get: vi.fn().mockReturnValue(of({ success: true, data: mockSettings, message: 'ok', timestamp: '', requestId: 'r1' })),
      update: vi.fn().mockReturnValue(of({ success: true, data: mockSettings, message: 'updated', timestamp: '', requestId: 'r1' })),
    };

    TestBed.configureTestingModule({
      providers: [
        SettingsStore,
        { provide: SettingService, useValue: mockSettingService },
      ],
    });

    store = TestBed.inject(SettingsStore);
  });

  it('should have initial state', () => {
    expect(store.settings()).toBeNull();
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('should load settings successfully', fakeAsync(() => {
    store.loadSettings();
    tick();
    expect(store.settings()).toEqual(mockSettings);
    expect(store.loading()).toBe(false);
    expect(mockSettingService.get).toHaveBeenCalledOnce();
  }));

  it('should handle load settings error', fakeAsync(() => {
    mockSettingService.get = vi.fn().mockReturnValue(throwError(() => new Error('Load failed')));
    const errorStore = TestBed.inject(SettingsStore);
    errorStore.loadSettings();
    tick();
    expect(errorStore.error()).toBe('Load failed');
    expect(errorStore.loading()).toBe(false);
  }));

  it('should update settings successfully', fakeAsync(() => {
    store.loadSettings();
    tick();
    const updates: Partial<ClinicSettings> = { clinicName: 'Updated Clinic' };
    store.updateSettings(updates);
    tick();
    expect(mockSettingService.update).toHaveBeenCalledWith(updates);
    expect(store.loading()).toBe(false);
  }));

  it('should handle update settings error', fakeAsync(() => {
    mockSettingService.update = vi.fn().mockReturnValue(throwError(() => new Error('Update failed')));
    const errorStore = TestBed.inject(SettingsStore);
    errorStore.updateSettings({ clinicName: 'Bad' });
    tick();
    expect(errorStore.error()).toBe('Update failed');
  }));

  it('should clear error', () => {
    store.clearError();
    expect(store.error()).toBeNull();
  });
});
