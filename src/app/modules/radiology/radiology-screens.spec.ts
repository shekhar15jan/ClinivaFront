import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { fakeAuth } from '../../testing/role-permissions';
import { RadiologyService } from '../../core/services/radiology.service';
import { PatientService } from '../../core/services/patient.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { ImagingItemView, ImagingOrderView, StudyView } from '../../core/models/radiology.model';
import { RadiologyOrderComponent } from './radiology-order';
import { RadiologyNewOrderComponent } from './radiology-new-order';

const scan: ImagingItemView = {
  id: 'i1', studyId: 's1', studyName: 'Ultrasound Obstetric', modality: 'ULTRASOUND', priceInPaisa: 150000, status: 'ORDERED',
  preparation: 'Full bladder', formFRequired: true, formFNumber: null, scheduledAt: null, performedAt: null, performedBy: null,
  technicianNote: null, imageLink: null, findings: null, impression: null, reportedAt: null, reportedBy: null, addendum: null,
  addendumAt: null, addendumBy: null, comment: null,
};

const order: ImagingOrderView = {
  id: 'o1', orderNumber: 'IMG-20261005-001', status: 'ORDERED', priority: 'ROUTINE', patientId: 'pt1', patientName: 'Meena',
  patientCode: 'P1', patientAge: 29, patientGender: 'FEMALE', doctorId: 'd1', doctorName: 'Anita', admissionId: null,
  admissionNumber: null, clinicalNote: '20 weeks', orderedAt: '2026-10-05T09:00:00', orderedBy: 'Dr', billId: null, billNumber: null,
  cancelReason: null, totalInPaisa: 150000, reports: true, items: [scan],
};

describe('RadiologyOrderComponent', () => {
  let radiology: Record<string, ReturnType<typeof vi.fn>>;

  function create(role: string) {
    radiology = {
      get: vi.fn().mockReturnValue(of(order)),
      done: vi.fn().mockReturnValue(of(order)),
      report: vi.fn().mockReturnValue(of(order)),
      schedule: vi.fn().mockReturnValue(of(order)),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: RadiologyService, useValue: radiology },
        { provide: AuthService, useValue: fakeAuth(role) },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'o1' } } } },
      ],
    });
    const c = TestBed.runInInjectionContext(() => new RadiologyOrderComponent());
    c.ngOnInit();
    return c;
  }

  afterEach(() => TestBed.resetTestingModule());

  it('an obstetric scan is not marked done without its Form F number', () => {
    const c = create('ADMIN');
    c.start(scan, 'done');
    expect(c.ready).toBe(false);
    c.formF = 'F-118';
    c.link = 'https://pacs.example/1';
    expect(c.ready).toBe(true);
    c.save(scan);
    expect(radiology['done']).toHaveBeenCalledWith('i1', 'https://pacs.example/1', null, 'F-118');
  });

  it('a doctor reports but does not do studies; the desk only bills', () => {
    const doctor = create('DOCTOR');
    expect(doctor.canReport).toBe(true);
    expect(doctor.canPerform).toBe(false);
    doctor.start({ ...scan, status: 'DONE' }, 'report');
    expect(doctor.ready).toBe(false);
    doctor.findings = 'Single live fetus.';
    doctor.impression = 'Live pregnancy.';
    doctor.save(scan);
    expect(radiology['report']).toHaveBeenCalledWith('i1', 'Single live fetus.', 'Live pregnancy.');
    TestBed.resetTestingModule();
    const desk = create('RECEPTIONIST');
    expect(desk.canBill).toBe(true);
    expect(desk.canReport).toBe(false);
    expect(desk.canPerform).toBe(false);
  });
});

describe('RadiologyNewOrderComponent', () => {
  it('orders the chosen studies for the patient and the stay', () => {
    const studies: StudyView[] = [
      { id: 's1', code: 'XR-CHEST', name: 'X-ray Chest', modality: 'XRAY', bodyPart: 'Chest', priceInPaisa: 40000, preparation: null, formFRequired: false, active: true },
      { id: 's2', code: 'CT-BRAIN', name: 'CT Brain', modality: 'CT', bodyPart: 'Brain', priceInPaisa: 250000, preparation: null, formFRequired: false, active: true },
    ];
    const radiology = { studies: vi.fn().mockReturnValue(of(studies)), order: vi.fn().mockReturnValue(of(order)) };
    const router = { navigate: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: RadiologyService, useValue: radiology },
        { provide: PatientService, useValue: { getPatientById: vi.fn().mockReturnValue(of({ data: { fullName: 'Meena' } })) } },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: (k: string) => (k === 'patient' ? 'pt1' : k === 'admission' ? 'ad1' : null) } } } },
      ],
    });
    const c = TestBed.runInInjectionContext(() => new RadiologyNewOrderComponent());
    c.ngOnInit();
    expect(c.inModality('CT').map((s) => s.code)).toEqual(['CT-BRAIN']);
    c.toggle(studies[0]);
    c.toggle(studies[1]);
    expect(c.total).toBe(290000);
    c.priority = 'URGENT';
    c.order();
    expect(radiology.order).toHaveBeenCalledWith('pt1', ['s1', 's2'], 'URGENT', null, 'ad1');
    expect(router.navigate).toHaveBeenCalledWith(['..', 'o1'], expect.anything());
    TestBed.resetTestingModule();
  });
});
