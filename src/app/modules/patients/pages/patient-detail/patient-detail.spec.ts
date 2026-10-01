import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { PatientService } from '../../../../core/services/patient.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { Patient } from '../../../../core/models/patient.model';
import { PatientDetail, bloodGroupLabel } from './patient-detail';

const patient: Patient = {
  id: 'p1', patientId: 'PAT-001', fullName: 'Rahul Sharma', dateOfBirth: '1990-05-17', age: 36, gender: 'MALE',
  phone: '9876543210', email: 'rahul@test.com', address: '12 Lake Road', bloodGroup: 'O_POSITIVE',
};
const ok = <T>(data: T) => ({ success: true, data, message: 'ok', timestamp: '', requestId: 'r' });

describe('bloodGroupLabel', () => {
  it('shows the usual notation and a dash when unknown', () => {
    expect(bloodGroupLabel('AB_NEGATIVE')).toBe('AB-');
    expect(bloodGroupLabel('O_POSITIVE')).toBe('O+');
    expect(bloodGroupLabel(undefined)).toBe('—');
  });
});

describe('PatientDetail', () => {
  let service: Record<string, ReturnType<typeof vi.fn>>;
  let router: { navigate: ReturnType<typeof vi.fn> };
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  function create(role = 'ADMIN') {
    service = {
      getPatientById: vi.fn().mockReturnValue(of(ok(patient))),
      getPatientVisits: vi.fn().mockReturnValue(of(ok({ patientId: 'p1', patientName: 'Rahul', visits: [{ appointmentId: 'a1', appointmentDate: '2026-09-20', appointmentTime: '09:00:00', doctorName: 'Dr. Anita', status: 'COMPLETED' }] }))),
      updatePatient: vi.fn().mockImplementation((_id: string, body: Partial<Patient>) => of(ok({ ...patient, ...body }))),
      deletePatient: vi.fn().mockReturnValue(of(ok(null))),
    };
    router = { navigate: vi.fn() };
    toast = { success: vi.fn(), error: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: PatientService, useValue: service },
        { provide: AuthService, useValue: { currentUserValue: { role } } },
        { provide: Router, useValue: router },
        { provide: ToastService, useValue: toast },
        { provide: ActivatedRoute, useValue: { params: of({ id: 'p1' }), snapshot: { pathFromRoot: [{ paramMap: { get: (k: string) => (k === 'hospitalCode' ? 'sai-clinic' : null) } }] } } },
      ],
    });
    const component = TestBed.runInInjectionContext(() => new PatientDetail());
    component.ngOnInit();
    return component;
  }

  it('loads this patient by id, not by searching the first page of everyone', () => {
    const component = create();
    expect(service['getPatientById']).toHaveBeenCalledWith('p1');
    expect(component.patient?.fullName).toBe('Rahul Sharma');
  });

  it('loads the real visit history', () => {
    const component = create();
    expect(component.visits).toHaveLength(1);
    expect(component.visits[0].doctorName).toBe('Dr. Anita');
  });

  it('says when the patient cannot be found', () => {
    const component = create();
    service['getPatientById'].mockReturnValue(throwError(() => ({ status: 404 })));
    component.load('nope');
    expect(component.loadError).toBe('This patient could not be found.');
  });

  it('shows a nurse the visit history too', () => {
    create('NURSE');
    expect(service['getPatientVisits']).toHaveBeenCalled();
  });

  it('keeps the clinical history from the front desk', () => {
    expect(create('RECEPTIONIST').seesClinical).toBe(false);
  });

  it('shows the clinical history to clinical staff', () => {
    expect(create('NURSE').seesClinical).toBe(true);
  });

  it('offers edit to the front desk and delete only to an administrator', () => {
    const admin = create('ADMIN');
    expect([admin.canEdit, admin.canDelete]).toEqual([true, true]);
  });

  it('does not offer delete to a receptionist', () => {
    const desk = create('RECEPTIONIST');
    expect([desk.canEdit, desk.canDelete]).toEqual([true, false]);
  });

  it('offers a doctor neither edit nor delete', () => {
    const doctor = create('DOCTOR');
    expect([doctor.canEdit, doctor.canDelete]).toEqual([false, false]);
  });

  describe('editing', () => {
    it('starts from the saved values and saves only what has content', () => {
      const component = create();
      component.startEdit();
      expect(component.form.fullName).toBe('Rahul Sharma');
      component.form.address = '   ';
      component.form.phone = '9000000000';
      component.save();
      expect(service['updatePatient']).toHaveBeenCalledWith('p1', expect.objectContaining({ fullName: 'Rahul Sharma', phone: '9000000000', address: undefined }));
      expect(component.editing).toBe(false);
      expect(toast.success).toHaveBeenCalledWith('Patient updated');
    });

    it('needs a name', () => {
      const component = create();
      component.startEdit();
      component.form.fullName = '  ';
      component.save();
      expect(service['updatePatient']).not.toHaveBeenCalled();
      expect(component.saveError).toContain('name');
    });

    it('explains a duplicate phone or email and stays in edit mode', () => {
      const component = create();
      service['updatePatient'].mockReturnValue(throwError(() => ({ status: 409 })));
      component.startEdit();
      component.save();
      expect(component.saveError).toBe('Another patient already has this phone number or email.');
      expect(component.editing).toBe(true);
      expect(component.isSaving).toBe(false);
    });

    it('shows the server reason for other failures', () => {
      const component = create();
      service['updatePatient'].mockReturnValue(throwError(() => ({ status: 400, error: { message: 'Phone is invalid' } })));
      component.startEdit();
      component.save();
      expect(component.saveError).toBe('Phone is invalid');
    });

    it('can be cancelled without saving', () => {
      const component = create();
      component.startEdit();
      component.cancelEdit();
      expect(component.editing).toBe(false);
      expect(service['updatePatient']).not.toHaveBeenCalled();
    });
  });

  describe('deleting', () => {
    it('only after confirmation, then returns to the clinic patient list', () => {
      const component = create();
      component.askDelete();
      expect(service['deletePatient']).not.toHaveBeenCalled();
      component.delete();
      expect(service['deletePatient']).toHaveBeenCalledWith('p1');
      expect(router.navigate).toHaveBeenCalledWith(['/', 'sai-clinic', 'patients']);
    });

    it('stays on the page and says why when the server refuses', () => {
      const component = create();
      service['deletePatient'].mockReturnValue(throwError(() => ({ error: { message: 'Patient has open bills' } })));
      component.delete();
      expect(toast.error).toHaveBeenCalledWith('Patient has open bills');
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  it('computes initials', () => {
    const component = create();
    expect(component.getInitials('Rahul Sharma')).toBe('RS');
    expect(component.getInitials('')).toBe('');
    expect(component.getInitials('A')).toBe('A');
  });
});
