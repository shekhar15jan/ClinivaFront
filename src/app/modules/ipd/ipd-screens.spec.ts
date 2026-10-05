import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { fakeAuth } from '../../testing/role-permissions';
import { IpdService } from '../../core/services/ipd.service';
import { PatientService } from '../../core/services/patient.service';
import { DoctorService } from '../../core/services/doctor.service';
import { AuthService } from '../../core/services/auth.service';
import { StockService } from '../../core/services/stock.service';
import { InsuranceService } from '../../core/services/insurance.service';
import { EffectiveLicenseService } from '../../core/services/effective-license.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { AdmissionView, BedBoard, rupees } from '../../core/models/ipd.model';
import { BedBoardComponent } from './bed-board';
import { AdmissionDetailComponent } from './admission-detail';

const board: BedBoard = {
  total: 3, occupied: 1, available: 1, cleaning: 1, maintenance: 0,
  wards: [{
    id: 'w1', name: 'General', wardType: 'GENERAL', floor: '1', dailyRateInPaisa: 150000, departmentId: null, departmentName: null,
    total: 3, occupied: 1, available: 1, cleaning: 1, maintenance: 0,
    beds: [
      { id: 'b1', bedNumber: 'G-1', status: 'AVAILABLE', notes: null, occupant: null },
      { id: 'b2', bedNumber: 'G-2', status: 'OCCUPIED', notes: null, occupant: {
        admissionId: 'ad1', admissionNumber: 'IP-2026-00001', patientId: 'p1', patientName: 'Meera Joshi', patientCode: 'PAT-9',
        doctorName: 'Anita', admittedAt: '2026-10-01T10:00:00', status: 'DISCHARGE_ADVISED', days: 2 } },
      { id: 'b3', bedNumber: 'G-3', status: 'CLEANING', notes: null, occupant: null },
    ],
  }],
};

function admission(extra: Partial<AdmissionView> = {}): AdmissionView {
  return {
    id: 'ad1', admissionNumber: 'IP-2026-00001', status: 'ADMITTED', patientId: 'p1', patientName: 'Meera Joshi', patientCode: 'PAT-9',
    patientPhone: null, patientGender: 'FEMALE', patientAge: 40, doctorId: 'd1', doctorName: 'Anita', departmentId: null,
    departmentName: null, bedId: 'b2', bedNumber: 'G-2', wardId: 'w1', wardName: 'General', wardType: 'GENERAL',
    admissionType: 'EMERGENCY', admittedAt: '2026-10-01T10:00:00', reason: 'Fever', attendantName: null, attendantRelation: null,
    attendantPhone: null, clinical: true, provisionalDiagnosis: 'Pneumonia', finalDiagnosis: null, treatmentGiven: null,
    conditionAtDischarge: null, dischargeAdvice: null, followUpDate: null, dischargeType: null, advisedAt: null, advisedBy: null,
    dischargedAt: null, dischargedBy: null, duesNote: null, billId: null, billNumber: null, days: 2, stays: [], charges: [], deposits: [],
    account: { bedChargesInPaisa: 300000, otherChargesInPaisa: 50000, discountInPaisa: 0, taxInPaisa: 0, totalInPaisa: 350000,
      finalBill: false, depositsInPaisa: 500000, refundsInPaisa: 0, paidOnBillInPaisa: 0, balanceInPaisa: -150000 },
    ...extra,
  };
}

describe('BedBoardComponent', () => {
  let ipd: Record<string, ReturnType<typeof vi.fn>>;
  let router: { navigate: ReturnType<typeof vi.fn> };
  let toast: Record<string, ReturnType<typeof vi.fn>>;

  function create(role: string) {
    ipd = {
      board: vi.fn().mockReturnValue(of(board)),
      updateBed: vi.fn().mockReturnValue(of(board.wards[0].beds[2])),
      admit: vi.fn().mockReturnValue(of(admission())),
    };
    router = { navigate: vi.fn() };
    toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: IpdService, useValue: ipd },
        { provide: PatientService, useValue: { searchPatients: vi.fn(), getPatientById: vi.fn() } },
        { provide: DoctorService, useValue: { getDoctors: vi.fn().mockReturnValue(of({ data: { content: [{ id: 'd1', fullName: 'Anita', isActive: true }] } })) } },
        { provide: AuthService, useValue: fakeAuth(role) },
        { provide: ToastService, useValue: toast },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } },
      ],
    });
    const c = TestBed.runInInjectionContext(() => new BedBoardComponent());
    c.ngOnInit();
    return c;
  }

  afterEach(() => TestBed.resetTestingModule());

  it('colours beds by state, and a patient whose discharge is advised stands out', () => {
    const c = create('NURSE');
    const [free, advised, cleaning] = board.wards[0].beds;
    expect(c.tile(free)).toContain('emerald');
    expect(c.tile(advised)).toContain('violet');
    expect(c.tile(cleaning)).toContain('amber');
  });

  it('an occupied bed opens the stay; a bed being cleaned is marked ready with one tap', () => {
    const c = create('NURSE');
    const w = board.wards[0];
    c.tap(w, w.beds[1]);
    expect(router.navigate).toHaveBeenCalledWith(['admissions', 'ad1'], expect.anything());
    c.tap(w, w.beds[2]);
    expect(ipd['updateBed']).toHaveBeenCalledWith('b3', { status: 'AVAILABLE' });
  });

  it('the front desk admits to a free bed with an advance; the pharmacist cannot admit', () => {
    const pharmacist = create('PHARMACIST');
    pharmacist.tap(board.wards[0], board.wards[0].beds[0]);
    expect(pharmacist.admitBed).toBeNull();
    expect(toast['warning']).toHaveBeenCalled();
    TestBed.resetTestingModule();

    const desk = create('RECEPTIONIST');
    desk.tap(board.wards[0], board.wards[0].beds[0]);
    expect(desk.admitBed?.bedNumber).toBe('G-1');
    expect(desk.canAdmit).toBe(false);
    desk.patient = { id: 'p1', fullName: 'Meera Joshi' } as never;
    desk.doctorId = 'd1';
    desk.reason = 'Fever for 3 days';
    desk.advanceRupees = 5000;
    desk.advanceMethod = 'UPI';
    desk.admit();
    expect(ipd['admit']).toHaveBeenCalledWith(expect.objectContaining({
      patientId: 'p1', doctorId: 'd1', bedId: 'b1', deposit: { amountInPaisa: 500000, paymentMethod: 'UPI' },
    }));
    expect(router.navigate).toHaveBeenCalledWith(['admissions', 'ad1'], expect.anything());
  });

  it('a nurse admits without taking money', () => {
    const nurse = create('NURSE');
    expect(nurse.canTakeMoney).toBe(false);
    nurse.tap(board.wards[0], board.wards[0].beds[0]);
    nurse.patient = { id: 'p1' } as never;
    nurse.doctorId = 'd1';
    nurse.reason = 'Observation';
    nurse.advanceRupees = 100;
    nurse.admit();
    expect(ipd['admit']).toHaveBeenCalledWith(expect.objectContaining({ deposit: null }));
  });
});

describe('AdmissionDetailComponent', () => {
  let ipd: Record<string, ReturnType<typeof vi.fn>>;

  let stock: Record<string, ReturnType<typeof vi.fn>>;

  function create(role: string, a: AdmissionView) {
    stock = {
      issues: vi.fn().mockReturnValue(of([{ chargeId: 'c1', medicineId: 'm1', medicineName: 'Amoxicillin', issued: 10, returned: 0,
        unitPriceInPaisa: 500, issuedAt: '2026-10-04T10:00:00', issuedBy: 'Pharma' }])),
      overview: vi.fn().mockReturnValue(of([])),
      issue: vi.fn().mockReturnValue(of([])),
    };
    ipd = {
      get: vi.fn().mockReturnValue(of(a)),
      board: vi.fn().mockReturnValue(of(board)),
      writeSummary: vi.fn().mockReturnValue(of({ ...a, status: 'DISCHARGE_ADVISED', finalDiagnosis: 'Pneumonia' })),
      discharge: vi.fn().mockReturnValue(of({ ...a, status: 'DISCHARGED' })),
      transfer: vi.fn().mockReturnValue(of(a)),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: IpdService, useValue: ipd },
        { provide: AuthService, useValue: fakeAuth(role) },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'ad1' } } } },
        { provide: StockService, useValue: stock },
        { provide: InsuranceService, useValue: { forAdmission: vi.fn().mockReturnValue(of([])) } },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: EffectiveLicenseService, useValue: { activeModules: () => ['IPD', 'PHARMACY_STOCK'] } },
      ],
    });
    const c = TestBed.runInInjectionContext(() => new AdmissionDetailComponent());
    c.ngOnInit();
    return c;
  }

  afterEach(() => TestBed.resetTestingModule());

  it('shows where the stay is: admitted, then discharge advised, the final bill, discharged', () => {
    const c = create('NURSE', admission({ status: 'DISCHARGE_ADVISED', finalDiagnosis: 'Pneumonia' }));
    expect(c.steps.map((s) => s.done)).toEqual([true, true, false, false]);
    expect(c.steps[2].now).toBe(true);
  });

  it('says plainly what is owed, either way', () => {
    expect(create('ACCOUNTANT', admission()).balanceLabel).toBe(`${rupees(150000)} to give back`);
    TestBed.resetTestingModule();
    const due = create('ACCOUNTANT', admission({ account: { ...admission().account, balanceInPaisa: 20000 } }));
    expect(due.balanceLabel).toBe(`${rupees(20000)} to pay`);
  });

  it('the doctor writes the summary; the front desk, without clinical access, cannot', () => {
    expect(create('RECEPTIONIST', admission({ clinical: false })).canWriteSummary).toBe(false);
    TestBed.resetTestingModule();
    const doctor = create('DOCTOR', admission());
    expect(doctor.canWriteSummary).toBe(true);
    doctor.openPanel('summary');
    expect(doctor.finalDiagnosis).toBe('Pneumonia');
    doctor.dischargeType = 'NORMAL';
    doctor.save();
    expect(ipd['writeSummary']).toHaveBeenCalledWith('ad1', expect.objectContaining({ finalDiagnosis: 'Pneumonia', dischargeType: 'NORMAL' }));
    expect(doctor.a?.status).toBe('DISCHARGE_ADVISED');
  });

  it('leaving with dues needs the billing desk to say why', () => {
    const owing = admission({ status: 'DISCHARGE_ADVISED', billId: 'bill1', account: { ...admission().account, finalBill: true, balanceInPaisa: 20000 } });
    const nurse = create('NURSE', owing);
    nurse.openPanel('discharge');
    expect(nurse.panelReady).toBe(false);
    TestBed.resetTestingModule();
    const desk = create('RECEPTIONIST', owing);
    desk.openPanel('discharge');
    desk.duesNote = 'Insurance claim pending';
    expect(desk.panelReady).toBe(true);
    desk.save();
    expect(ipd['discharge']).toHaveBeenCalledWith('ad1', 'Insurance claim pending');
  });

  it('the pharmacist issues from stock; a pharmacy charge is returned, not removed', () => {
    const nurse = create('NURSE', admission());
    expect(nurse.canIssue).toBe(false);
    expect(nurse.issueFor('c1')?.medicineName).toBe('Amoxicillin');
    TestBed.resetTestingModule();
    const pharmacist = create('PHARMACIST', admission());
    expect(pharmacist.canIssue).toBe(true);
    pharmacist.openPanel('issue');
    expect(pharmacist.panelReady).toBe(false);
    pharmacist.issueMedicine = 'm1';
    pharmacist.issueQuantity = 4;
    pharmacist.save();
    expect(stock['issue']).toHaveBeenCalledWith('ad1', 'm1', 4);
    expect(ipd['get']).toHaveBeenCalledTimes(2);
  });

  it('a move offers only free beds', () => {
    const c = create('NURSE', admission());
    c.openPanel('move');
    expect(c.freeBeds.map((f) => f.bed.bedNumber)).toEqual(['G-1']);
    expect(c.panelReady).toBe(false);
    c.moveTo = 'b1';
    c.save();
    expect(ipd['transfer']).toHaveBeenCalledWith('ad1', 'b1', '');
  });
});
