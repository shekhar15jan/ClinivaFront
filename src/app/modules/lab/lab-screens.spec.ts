import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { fakeAuth } from '../../testing/role-permissions';
import { LabService } from '../../core/services/lab.service';
import { PatientService } from '../../core/services/patient.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { OrderView, ParameterView, TestView, flagOf } from '../../core/models/lab.model';
import { LabOrderComponent } from './lab-order';
import { LabNewOrderComponent } from './lab-new-order';

const hb: ParameterView = { id: 'p1', name: 'Haemoglobin', unit: 'g/dL', refLow: 12, refHigh: 17, refText: null, reference: '12 – 17' };
const ns1: ParameterView = { id: 'p2', name: 'NS1', unit: null, refLow: null, refHigh: null, refText: 'Negative', reference: 'Negative' };

const order: OrderView = {
  id: 'o1', orderNumber: 'LAB-20261005-001', status: 'COLLECTED', priority: 'URGENT', patientId: 'pt1', patientName: 'Kavita',
  patientCode: 'P1', patientAge: 45, patientGender: 'FEMALE', doctorId: 'd1', doctorName: 'Anita', admissionId: null,
  admissionNumber: null, clinicalNote: 'Fever', orderedAt: '2026-10-05T09:00:00', orderedBy: 'Dr', billId: null, billNumber: null,
  cancelReason: null, totalInPaisa: 35000, results: true,
  items: [{ id: 'i1', testId: 't1', testName: 'CBC', priceInPaisa: 35000, status: 'COLLECTED', sampleNumber: 'LAB-1', collectedAt: null,
    collectedBy: null, resultedAt: null, resultedBy: null, verifiedAt: null, verifiedBy: null, comment: null, parameters: [hb], results: [] }],
};

describe('flagOf', () => {
  it('reads numbers against the range and text against the normal answer', () => {
    expect(flagOf(hb, '9.8')).toBe('LOW');
    expect(flagOf(hb, '18')).toBe('HIGH');
    expect(flagOf(hb, '14')).toBe('NORMAL');
    expect(flagOf(hb, 'clotted')).toBe('ABNORMAL');
    expect(flagOf(ns1, 'negative')).toBe('NORMAL');
    expect(flagOf(ns1, 'Positive')).toBe('ABNORMAL');
    expect(flagOf(hb, '')).toBeNull();
  });
});

describe('LabOrderComponent', () => {
  let lab: Record<string, ReturnType<typeof vi.fn>>;

  function create(role: string) {
    lab = {
      get: vi.fn().mockReturnValue(of(order)),
      results: vi.fn().mockReturnValue(of(order)),
      verify: vi.fn().mockReturnValue(of(order)),
      bill: vi.fn().mockReturnValue(of(order)),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: LabService, useValue: lab },
        { provide: AuthService, useValue: fakeAuth(role) },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'o1' } } } },
      ],
    });
    const c = TestBed.runInInjectionContext(() => new LabOrderComponent());
    c.ngOnInit();
    return c;
  }

  afterEach(() => TestBed.resetTestingModule());

  it('the lab enters results, flagged as typed, and only the values given are sent', () => {
    const c = create('LAB_TECHNICIAN');
    expect(c.canProcess).toBe(true);
    expect(c.canVerify).toBe(false);
    c.startResults(order.items[0]);
    c.draft['p1'] = '9.8';
    expect(c.liveFlag(hb)).toBe('LOW');
    c.saveResults(order.items[0]);
    expect(lab['results']).toHaveBeenCalledWith('i1', [{ parameterId: 'p1', value: '9.8' }], null);
  });

  it('a doctor verifies; the desk bills; neither enters results', () => {
    const doctor = create('DOCTOR');
    expect(doctor.canVerify).toBe(true);
    expect(doctor.canProcess).toBe(false);
    TestBed.resetTestingModule();
    const desk = create('RECEPTIONIST');
    expect(desk.canBill).toBe(true);
    expect(desk.canProcess).toBe(false);
  });
});

describe('LabNewOrderComponent', () => {
  it('orders the chosen tests for the patient and the stay', () => {
    const tests: TestView[] = [
      { id: 't1', code: 'CBC', name: 'CBC', category: 'HAEMATOLOGY', sampleType: 'BLOOD', priceInPaisa: 35000, turnaroundHours: 6, active: true, parameters: [] },
      { id: 't2', code: 'FBS', name: 'FBS', category: 'BIOCHEMISTRY', sampleType: 'BLOOD', priceInPaisa: 8000, turnaroundHours: 2, active: true, parameters: [] },
    ];
    const lab = { tests: vi.fn().mockReturnValue(of(tests)), order: vi.fn().mockReturnValue(of(order)) };
    const router = { navigate: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: LabService, useValue: lab },
        { provide: PatientService, useValue: { getPatientById: vi.fn().mockReturnValue(of({ data: { fullName: 'Kavita' } })) } },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: (k: string) => (k === 'patient' ? 'pt1' : k === 'admission' ? 'ad1' : null) } } } },
      ],
    });
    const c = TestBed.runInInjectionContext(() => new LabNewOrderComponent());
    c.ngOnInit();
    c.toggle(tests[0]);
    c.toggle(tests[1]);
    expect(c.total).toBe(43000);
    c.priority = 'URGENT';
    c.order();
    expect(lab.order).toHaveBeenCalledWith('pt1', ['t1', 't2'], 'URGENT', null, 'ad1', null);
    expect(router.navigate).toHaveBeenCalledWith(['..', 'o1'], expect.anything());
    TestBed.resetTestingModule();
  });
});
