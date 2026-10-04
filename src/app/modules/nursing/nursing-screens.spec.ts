import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { fakeAuth } from '../../testing/role-permissions';
import { NursingService } from '../../core/services/nursing.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { Chart, OrderView, RoundItem } from '../../core/models/nursing.model';
import { WardRoundComponent } from './ward-round';
import { NursingChartComponent } from './nursing-chart';

const item = (extra: Partial<RoundItem>): RoundItem => ({
  admissionId: 'a1', patientName: 'Ramesh', patientCode: 'P1', bedNumber: 'M-1', wardId: 'w1', wardName: 'Medical',
  doctorName: 'Anita', dosesDue: 0, dosesOverdue: 0, nextDoseAt: null, lastVitalsAt: null, vitalsOverdue: false, flags: [],
  dischargeAdvised: false, ...extra,
});

const tds: OrderView = {
  id: 'o1', medicineName: 'Paracetamol', dose: '650 mg', route: 'ORAL', frequency: 'TDS', startAt: '2026-10-04T08:00:00',
  endAt: null, instructions: null, status: 'ACTIVE', orderedBy: 'Dr Anita', orderedAt: '2026-10-04T08:00:00', stoppedAt: null,
  stoppedBy: null, stopReason: null,
  slots: [
    { at: '2026-10-04T08:00:00', state: 'GIVEN', outcome: 'GIVEN', givenAt: '2026-10-04T08:05:00', by: 'Nurse', note: null },
    { at: '2026-10-04T14:00:00', state: 'OVERDUE', outcome: null, givenAt: null, by: null, note: null },
  ],
};
const chart: Chart = {
  admissionId: 'a1', admissionNumber: 'IP-2026-00001', patientName: 'Ramesh', patientCode: 'P1', bedNumber: 'M-1',
  wardName: 'Medical', doctorName: 'Anita', open: true, vitals: [], orders: [tds], doses: [], notes: [],
};

describe('WardRoundComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('colours the most urgent red, then due blue, vitals amber, the rest green; filters by ward', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: NursingService, useValue: { round: vi.fn().mockReturnValue(of([
        item({ dosesOverdue: 1 }), item({ admissionId: 'a2', dosesDue: 1, wardId: 'w2', wardName: 'Surgical' }),
        item({ admissionId: 'a3', vitalsOverdue: true }), item({ admissionId: 'a4' }),
      ])) } }],
    });
    const c = TestBed.runInInjectionContext(() => new WardRoundComponent());
    c.ngOnInit();
    expect(c.items.map((i) => c.colour(i))).toEqual(['#dc2626', '#2563eb', '#d97706', '#059669']);
    expect(c.wards.map((w) => w.name)).toEqual(['Medical', 'Surgical']);
    c.ward = 'w2';
    expect(c.shown.map((i) => i.admissionId)).toEqual(['a2']);
  });
});

describe('NursingChartComponent', () => {
  let nursing: Record<string, ReturnType<typeof vi.fn>>;

  function create(role: string) {
    nursing = {
      chart: vi.fn().mockReturnValue(of(chart)),
      dose: vi.fn().mockReturnValue(of(chart)),
      vitals: vi.fn().mockReturnValue(of(chart)),
      order: vi.fn().mockReturnValue(of(chart)),
      note: vi.fn().mockReturnValue(of(chart)),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: NursingService, useValue: nursing },
        { provide: AuthService, useValue: fakeAuth(role) },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'a1' } } } },
      ],
    });
    const c = TestBed.runInInjectionContext(() => new NursingChartComponent());
    c.ngOnInit();
    return c;
  }

  afterEach(() => TestBed.resetTestingModule());

  it('a nurse gives an overdue dose with one tap; a given dose cannot be given twice', () => {
    const c = create('NURSE');
    expect(c.canGive(tds.slots[0])).toBe(false);
    c.openDose(tds, tds.slots[1]);
    c.give('GIVEN');
    expect(nursing['dose']).toHaveBeenCalledWith('o1', '2026-10-04T14:00:00', 'GIVEN', null);
    expect(c.pending).toBeNull();
  });

  it('a dose not given carries the reason', () => {
    const c = create('NURSE');
    c.openDose(tds, tds.slots[1]);
    c.outcome = 'REFUSED';
    c.doseNote = 'Vomiting';
    c.give('REFUSED');
    expect(nursing['dose']).toHaveBeenCalledWith('o1', '2026-10-04T14:00:00', 'REFUSED', 'Vomiting');
  });

  it('only the readings entered are sent; ordering is the doctor’s', () => {
    const nurse = create('NURSE');
    expect(nurse.canOrder).toBe(false);
    expect(nurse.hasReading).toBe(false);
    nurse.v = { temperatureC: 38.4, pulse: null, spo2: 95 };
    nurse.saveVitals();
    expect(nursing['vitals']).toHaveBeenCalledWith('a1', { temperatureC: 38.4, spo2: 95 });
    TestBed.resetTestingModule();

    const doctor = create('DOCTOR');
    expect(doctor.canOrder).toBe(true);
    doctor.startOrder();
    doctor.orderName = 'Ceftriaxone';
    doctor.orderDose = '1 g';
    doctor.orderRoute = 'IV';
    doctor.orderFrequency = 'BD';
    doctor.orderDays = 5;
    doctor.saveOrder();
    expect(nursing['order']).toHaveBeenCalledWith('a1', expect.objectContaining({ medicineName: 'Ceftriaxone', route: 'IV', frequency: 'BD', days: 5 }));
  });

  it('the receptionist reads nothing to record', () => {
    const c = create('RECEPTIONIST');
    expect(c.canRecord).toBe(false);
    expect(c.canGive(tds.slots[1])).toBe(false);
  });
});
