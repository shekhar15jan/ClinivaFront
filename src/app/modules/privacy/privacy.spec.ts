import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { PatientConsents, PrivacyService, PrivacySettings, isMinor } from '../../core/services/privacy.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { PatientConsentsComponent } from './patient-consents';
import { PrivacyPageComponent } from './privacy-page';

const settings: PrivacySettings = {
  officer: { name: 'Meera Iyer', email: 'privacy@clinic.test', phone: null },
  consentAge: 18,
  notice: { version: 2, body: 'Second notice', publishedAt: '2026-10-01T10:00:00', builtIn: false },
  versions: [{ version: 2, publishedAt: '2026-10-01T10:00:00' }, { version: 1, publishedAt: '2026-09-01T10:00:00' }],
  purposes: [],
};

const consents = (minor = false): PatientConsents => ({
  minor, consentAge: 18, noticeVersion: 2,
  current: [
    { purpose: 'CARE', label: 'Care', core: true, granted: true, noticeVersion: 2, method: 'IN_PERSON', givenBy: 'SELF',
      guardianName: null, guardianRelation: null, recordedAt: '2026-10-01T10:00:00' },
    { purpose: 'REMINDERS', label: 'Reminders', core: false, granted: null, noticeVersion: null, method: null, givenBy: null,
      guardianName: null, guardianRelation: null, recordedAt: null },
  ],
  history: [],
});

function setUp(privacy: Partial<PrivacyService>) {
  const toast = { success: vi.fn(), error: vi.fn() };
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [{ provide: PrivacyService, useValue: privacy }, { provide: ToastService, useValue: toast }] });
  return toast;
}

describe('isMinor', () => {
  it('counts whole years against the consent age', () => {
    const year = new Date().getFullYear();
    expect(isMinor(`${year - 10}-01-01`, 18)).toBe(true);
    expect(isMinor(`${year - 40}-01-01`, 18)).toBe(false);
    expect(isMinor(`${year - 16}-01-01`, 16)).toBe(false);
    expect(isMinor(null, 18)).toBe(false);
    expect(isMinor('not a date', 18)).toBe(false);
  });
});

describe('PrivacyPageComponent', () => {
  it('shows the officer and notice, and publishes the next version', () => {
    const privacy = { settings: vi.fn().mockReturnValue(of(settings)), publish: vi.fn().mockReturnValue(of({ ...settings.notice, version: 3 })),
      saveSettings: vi.fn().mockReturnValue(of(settings)), notice: vi.fn().mockReturnValue(of({ ...settings.notice, version: 1, body: 'First' })) };
    const toast = setUp(privacy);
    const page = TestBed.runInInjectionContext(() => new PrivacyPageComponent());
    page.ngOnInit();
    expect(page.officerName).toBe('Meera Iyer');
    expect(page.draft).toBe('Second notice');
    expect(page.nextVersion).toBe(3);

    page.draft = 'Third notice';
    page.publish();
    expect(privacy.publish).toHaveBeenCalledWith('Third notice');
    expect(toast.success).toHaveBeenCalledWith('Version 3 published');

    page.open(1);
    expect(page.shown()?.body).toBe('First');
    page.open(1);
    expect(page.shown()).toBeNull();
  });

  it('saves the officer and keeps a draft being written', () => {
    const privacy = { settings: vi.fn().mockReturnValue(of(settings)), saveSettings: vi.fn().mockReturnValue(of(settings)) };
    const toast = setUp(privacy);
    const page = TestBed.runInInjectionContext(() => new PrivacyPageComponent());
    page.ngOnInit();
    page.officerPhone = ' ';
    page.consentAge = 16;
    page.draft = 'My own words';
    page.save();
    expect(privacy.saveSettings).toHaveBeenCalledWith({ officerName: 'Meera Iyer', officerEmail: 'privacy@clinic.test', officerPhone: null, consentAge: 16 });
    expect(page.draft).toBe('My own words');
    expect(toast.success).toHaveBeenCalled();
  });

  it('says why a save was refused', () => {
    const privacy = { settings: vi.fn().mockReturnValue(of(settings)),
      saveSettings: vi.fn().mockReturnValue(throwError(() => ({ error: { message: 'The consent age is 13 to 18' } }))),
      publish: vi.fn().mockReturnValue(throwError(() => ({}))) };
    const toast = setUp(privacy);
    const page = TestBed.runInInjectionContext(() => new PrivacyPageComponent());
    page.ngOnInit();
    page.save();
    expect(toast.error).toHaveBeenCalledWith('The consent age is 13 to 18');
    page.publish();
    expect(toast.error).toHaveBeenCalledWith('Not published.');
  });
});

describe('PatientConsentsComponent', () => {
  it('shows each purpose and records a staff change with how it was given', () => {
    const privacy = { consents: vi.fn().mockReturnValue(of(consents())), record: vi.fn().mockReturnValue(of(consents())) };
    const toast = setUp(privacy);
    const panel = TestBed.runInInjectionContext(() => new PatientConsentsComponent());
    panel.patientId = 'p1';
    panel.canEdit = true;
    panel.ngOnChanges();
    const [care, reminders] = panel.data()!.current;
    expect(panel.state(care)).toBe('yes');
    expect(panel.state(reminders)).toBe('not-asked');
    expect(panel.describe(care)).toBe('Given by the patient, in person, notice v2');
    expect(panel.describe(reminders)).toBe('Not asked yet');

    panel.method = 'PAPER';
    panel.change(reminders);
    expect(privacy.record).toHaveBeenCalledWith('p1', { purpose: 'REMINDERS', granted: true, method: 'PAPER', givenBy: 'SELF',
      guardianName: null, guardianRelation: null });
    panel.change(care);
    expect(privacy.record).toHaveBeenLastCalledWith('p1', expect.objectContaining({ purpose: 'CARE', granted: false }));
    expect(toast.success).toHaveBeenCalledWith('Consent withdrawn');
  });

  it("needs the guardian's name for a child, and the portal never sends a method", () => {
    const privacy = { consents: vi.fn().mockReturnValue(of(consents(true))), record: vi.fn().mockReturnValue(of(consents(true))) };
    const toast = setUp(privacy);
    const panel = TestBed.runInInjectionContext(() => new PatientConsentsComponent());
    panel.canEdit = true;
    panel.ngOnChanges();
    expect(panel.self).toBe(true);
    const reminders = panel.data()!.current[1];
    panel.change(reminders);
    expect(privacy.record).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalled();

    panel.guardianName = 'Sunita Rao';
    panel.guardianRelation = 'Mother';
    panel.change(reminders);
    expect(privacy.record).toHaveBeenCalledWith(null, { purpose: 'REMINDERS', granted: true, method: undefined, givenBy: 'GUARDIAN',
      guardianName: 'Sunita Rao', guardianRelation: 'Mother' });
    expect(panel.describe({ ...reminders, granted: true, method: 'PORTAL', givenBy: 'GUARDIAN', guardianName: 'Sunita Rao',
      guardianRelation: 'Mother', recordedAt: 'x', noticeVersion: 2 })).toBe('Given by Sunita Rao (Mother), in the portal, notice v2');
  });

  it('says why a change was refused', () => {
    const privacy = { consents: vi.fn().mockReturnValue(of(consents())),
      record: vi.fn().mockReturnValue(throwError(() => ({ error: { message: 'Not allowed' } }))) };
    const toast = setUp(privacy);
    const panel = TestBed.runInInjectionContext(() => new PatientConsentsComponent());
    panel.patientId = 'p1';
    panel.ngOnChanges();
    panel.change(panel.data()!.current[1]);
    expect(toast.error).toHaveBeenCalledWith('Not allowed');
  });
});
