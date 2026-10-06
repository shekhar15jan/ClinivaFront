import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { DataRequest, PrivacyService } from '../../core/services/privacy.service';
import { TenantContextService } from '../../core/services/tenant-context.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { MyPrivacy } from '../patient-portal/pages/my-privacy/my-privacy';
import { DataRequestsComponent } from './data-requests';

const request = (over: Partial<DataRequest> = {}): DataRequest => ({
  id: 'r1', patientId: null, type: 'CORRECTION', source: 'EMAIL', requesterName: 'Asha Rao', requesterContact: 'asha@test.local',
  details: 'Wrong birth date', status: 'OPEN', response: null, receivedAt: '2026-10-01T10:00:00', dueAt: '2026-10-31T10:00:00',
  closedAt: null, overdue: false, ...over,
});

function setUp(privacy: Partial<PrivacyService>) {
  const toast = { success: vi.fn(), error: vi.fn() };
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [{ provide: PrivacyService, useValue: privacy }, { provide: ToastService, useValue: toast },
    { provide: TenantContextService, useValue: { tenantCode: () => 'CITY' } }] });
  return toast;
}

describe('DataRequestsComponent', () => {
  it('lists the open requests and records a new one', () => {
    const privacy = { requests: vi.fn().mockReturnValue(of([request(), request({ id: 'r2', status: 'DONE', response: 'Fixed' })])),
      makeRequest: vi.fn().mockReturnValue(of(request())) };
    const toast = setUp(privacy);
    const c = TestBed.runInInjectionContext(() => new DataRequestsComponent());
    c.ngOnInit();
    expect(privacy.requests).toHaveBeenCalledWith(false, true);
    expect(c.rows()).toHaveLength(2);
    expect(c.status['r1']).toBe('OPEN');
    expect(c.closed(c.rows()[1])).toBe(true);
    expect(c.label('ERASURE')).toBe('Delete data no longer needed');

    c.newType = 'GRIEVANCE';
    c.newSource = 'POST';
    c.newName = ' Ravi Kumar ';
    c.add();
    expect(privacy.makeRequest).toHaveBeenCalledWith(false, { type: 'GRIEVANCE', source: 'POST', requesterName: 'Ravi Kumar',
      requesterContact: null, details: null });
    expect(toast.success).toHaveBeenCalledWith('Request recorded');
  });

  it('closes a request with the answer, and says why the server refused', () => {
    const privacy = { requests: vi.fn().mockReturnValue(of([request()])),
      updateRequest: vi.fn().mockReturnValueOnce(of(request({ status: 'DONE' })))
        .mockReturnValueOnce(throwError(() => ({ error: { message: 'Write the answer given before closing the request.' } }))) };
    const toast = setUp(privacy);
    const c = TestBed.runInInjectionContext(() => new DataRequestsComponent());
    c.ngOnInit();
    c.status['r1'] = 'DONE';
    c.answer['r1'] = ' Corrected ';
    c.update(c.rows()[0]);
    expect(privacy.updateRequest).toHaveBeenCalledWith('r1', { status: 'DONE', response: 'Corrected' });
    c.answer['r1'] = '';
    c.update(c.rows()[0]);
    expect(toast.error).toHaveBeenCalledWith('Write the answer given before closing the request.');
  });
});

describe('MyPrivacy', () => {
  it("shows the clinic's notice and officer, and sends the patient's own request", () => {
    const privacy = {
      publicView: vi.fn().mockReturnValue(of({ clinicName: 'City Clinic', consentAge: 18, purposes: [],
        officer: { name: 'Meera Iyer', email: null, phone: null }, notice: { version: 1, body: 'Notice', publishedAt: null, builtIn: false } })),
      requests: vi.fn().mockReturnValue(of([request({ status: 'IN_PROGRESS' })])),
      makeRequest: vi.fn().mockReturnValue(of(request())),
    };
    const toast = setUp(privacy);
    const page = TestBed.runInInjectionContext(() => new MyPrivacy());
    page.ngOnInit();
    expect(privacy.publicView).toHaveBeenCalledWith('CITY');
    expect(page.info()?.officer.name).toBe('Meera Iyer');
    expect(page.statusLabel(page.requests()[0])).toBe('being handled');
    expect(page.label('ACCESS')).toBe('See or get a copy of my data');

    page.type = 'ERASURE';
    page.details = ' Please delete my old phone number ';
    page.send();
    expect(privacy.makeRequest).toHaveBeenCalledWith(true, { type: 'ERASURE', details: 'Please delete my old phone number' });
    expect(toast.success).toHaveBeenCalledWith('Your request was sent');
    expect(page.details).toBe('');
  });

  it('says when a request could not be sent', () => {
    const privacy = { publicView: vi.fn().mockReturnValue(of(null)), requests: vi.fn().mockReturnValue(of([])),
      makeRequest: vi.fn().mockReturnValue(throwError(() => ({}))) };
    const toast = setUp(privacy);
    const page = TestBed.runInInjectionContext(() => new MyPrivacy());
    page.ngOnInit();
    page.send();
    expect(toast.error).toHaveBeenCalledWith('Not sent.');
  });
});
