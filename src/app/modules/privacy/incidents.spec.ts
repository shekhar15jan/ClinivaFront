import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { ToastService } from '../../shared/components/toast/toast.service';
import { Incident, IncidentsComponent, nowLocal } from './incidents';

const incident = (over: Partial<Incident> = {}): Incident => ({
  id: 'i1', title: 'Laptop stolen', description: null, category: 'LOST_OR_STOLEN_DEVICE', severity: 'HIGH', occurredAt: null,
  discoveredAt: '2026-10-01T10:00:00', containedAt: null, affectedCount: 120, dataKinds: 'Names', actions: null, status: 'OPEN',
  regulatorDueAt: '2026-10-04T10:00:00', regulatorNotifiedAt: null, regulatorReference: null, individualsDueAt: '2026-11-30T10:00:00',
  individualsNotifiedAt: null, notNotifiableReason: null, regulatorOverdue: true, individualsOverdue: false, closedAt: null, ...over,
});

describe('IncidentsComponent', () => {
  let http: HttpTestingController;
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  function create(): IncidentsComponent {
    toast = { success: vi.fn(), error: vi.fn() };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: ToastService, useValue: toast }] });
    http = TestBed.inject(HttpTestingController);
    const c = TestBed.runInInjectionContext(() => new IncidentsComponent());
    c.ngOnInit();
    http.expectOne((r) => r.url.endsWith('/hms/privacy/incidents')).flush({ success: true, data: [incident()] });
    return c;
  }

  it('lists breaches and records a new one with the time found', () => {
    const c = create();
    expect(c.rows()[0].regulatorOverdue).toBe(true);
    c.title = ' Email sent to the wrong patient ';
    c.category = 'SENT_TO_WRONG_PERSON';
    c.discoveredAt = '2026-10-06T09:30';
    c.affectedCount = 1;
    c.add();
    const post = http.expectOne((r) => r.method === 'POST');
    expect(post.request.body).toEqual({ title: 'Email sent to the wrong patient', category: 'SENT_TO_WRONG_PERSON', severity: 'MEDIUM',
      discoveredAt: new Date('2026-10-06T09:30').toISOString(), affectedCount: 1, dataKinds: null });
    post.flush({ success: true, data: incident() });
    http.expectOne((r) => r.method === 'GET').flush({ success: true, data: [] });
    expect(toast.success).toHaveBeenCalledWith('Breach recorded');
  });

  it('sends progress and shows why closing was refused', () => {
    const c = create();
    c.update(c.rows()[0], { regulatorNotifiedAt: '2026-10-02T10:00:00', regulatorReference: 'DPB-1' });
    const put = http.expectOne((r) => r.method === 'PUT' && r.url.endsWith('/incidents/i1'));
    expect(put.request.body).toEqual({ regulatorNotifiedAt: '2026-10-02T10:00:00', regulatorReference: 'DPB-1' });
    put.flush({ success: true, data: incident() });
    http.expectOne((r) => r.method === 'GET').flush({ success: true, data: [] });

    c.update(incident(), { close: true });
    http.expectOne((r) => r.method === 'PUT').flush({ message: 'Record when the breach was contained before closing it.' },
      { status: 400, statusText: 'Bad Request' });
    expect(toast.error).toHaveBeenCalledWith('Record when the breach was contained before closing it.');
  });

  it('gives the current local time to the minute for date inputs', () => {
    expect(nowLocal()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });
});
