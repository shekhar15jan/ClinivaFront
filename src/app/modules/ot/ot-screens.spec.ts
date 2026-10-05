import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { fakeAuth } from '../../testing/role-permissions';
import { OtService } from '../../core/services/ot.service';
import { DoctorService } from '../../core/services/doctor.service';
import { PatientService } from '../../core/services/patient.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { SurgeryView } from '../../core/models/ot.model';
import { OtSurgeryComponent } from './ot-surgery';
import { OtBookComponent } from './ot-book';

const surgery: SurgeryView = {
  id: 's1', surgeryNumber: 'OT-20261005-001', status: 'SCHEDULED', priority: 'ELECTIVE', patientId: 'pt1', patientName: 'Ramesh',
  patientCode: 'P1', patientAge: 52, patientGender: 'MALE', admissionId: 'ad1', admissionNumber: 'ADM-1', theatreId: 't1',
  theatreName: 'OT 1', surgeonId: 'd1', surgeonName: 'Anita', anaesthetistId: null, anaesthetistName: null, assistants: null,
  procedureName: 'Lap chole', side: 'NA', anaesthesiaType: 'GENERAL', scheduledStart: '2026-10-08T09:00:00', expectedMinutes: 90,
  startedAt: null, endedAt: null, consent: null, signIn: null, timeOut: null, signOut: null, notes: true, findings: null,
  procedureDone: null, complications: null, bloodLossMl: null, implants: null, postOpOrders: null, noteBy: null,
  surgeonFeeInPaisa: 2500000, anaesthesiaFeeInPaisa: 800000, theatreFeeInPaisa: 1200000, chargesPosted: false, billId: null,
  billNumber: null, cancelReason: null,
};

describe('OtSurgeryComponent', () => {
  let ot: Record<string, ReturnType<typeof vi.fn>>;

  function create(role: string, s: SurgeryView = surgery) {
    ot = { get: vi.fn().mockReturnValue(of(s)), step: vi.fn().mockReturnValue(of(s)), note: vi.fn().mockReturnValue(of(s)) };
    TestBed.configureTestingModule({
      providers: [
        { provide: OtService, useValue: ot },
        { provide: AuthService, useValue: fakeAuth(role) },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 's1' } } } },
      ],
    });
    const c = TestBed.runInInjectionContext(() => new OtSurgeryComponent());
    c.ngOnInit();
    return c;
  }

  afterEach(() => TestBed.resetTestingModule());

  it('lights only the next checklist step, in order', () => {
    const c = create('NURSE');
    expect(c.isNext('consent')).toBe(true);
    expect(c.isNext('sign-in')).toBe(false);
    c.s = { ...surgery, consent: { at: '2026-10-08T08:00:00', by: 'N' }, signIn: { at: '2026-10-08T08:30:00', by: 'N' } };
    expect(c.isNext('time-out')).toBe(true);
    c.s = { ...c.s, timeOut: { at: '2026-10-08T09:00:00', by: 'N' }, status: 'IN_PROGRESS' };
    expect(c.isNext('sign-out')).toBe(false);
    c.s = { ...c.s, procedureDone: 'Done' };
    expect(c.isNext('sign-out')).toBe(true);
    c.doStep('sign-out');
    expect(ot['step']).toHaveBeenCalledWith('s1', 'sign-out');
  });

  it('the note sends what was written; the desk cannot record', () => {
    const c = create('DOCTOR', { ...surgery, status: 'IN_PROGRESS' });
    c.startNote();
    c.procedureDone = 'Four-port lap chole';
    c.bloodLoss = 50;
    c.saveNote();
    expect(ot['note']).toHaveBeenCalledWith('s1', expect.objectContaining({ procedureDone: 'Four-port lap chole', bloodLossMl: 50 }));
    TestBed.resetTestingModule();
    const desk = create('RECEPTIONIST');
    expect(desk.canRecord).toBe(false);
    expect(desk.canBill).toBe(true);
  });
});

describe('OtBookComponent', () => {
  it('books with the chosen theatre, surgeon and fees in paisa', () => {
    const ot = { theatres: vi.fn().mockReturnValue(of([{ id: 't1', name: 'OT 1', active: true }])), book: vi.fn().mockReturnValue(of(surgery)) };
    const router = { navigate: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: OtService, useValue: ot },
        { provide: DoctorService, useValue: { getDoctors: vi.fn().mockReturnValue(of({ data: { content: [{ id: 'd1', fullName: 'Anita', isActive: true }] } })) } },
        { provide: PatientService, useValue: { getPatientById: vi.fn().mockReturnValue(of({ data: { fullName: 'Ramesh' } })) } },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: (k: string) => (k === 'patient' ? 'pt1' : k === 'admission' ? 'ad1' : null) } } } },
      ],
    });
    const c = TestBed.runInInjectionContext(() => new OtBookComponent());
    c.ngOnInit();
    expect(c.theatreId).toBe('t1');
    c.surgeonId = 'd1';
    c.procedureName = 'Lap chole';
    c.start = '2026-10-08T09:00';
    c.minutes = 90;
    c.surgeonFee = 25000;
    expect(c.ready).toBe(true);
    c.book();
    expect(ot.book).toHaveBeenCalledWith(expect.objectContaining({
      patientId: 'pt1', admissionId: 'ad1', theatreId: 't1', surgeonId: 'd1', scheduledStart: '2026-10-08T09:00:00',
      expectedMinutes: 90, surgeonFeeInPaisa: 2500000, anaesthetistId: null,
    }));
    expect(router.navigate).toHaveBeenCalledWith(['..', 's1'], expect.anything());
    TestBed.resetTestingModule();
  });
});
