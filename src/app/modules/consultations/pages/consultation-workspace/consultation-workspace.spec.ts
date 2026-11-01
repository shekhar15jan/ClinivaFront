import { TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ConsultationWorkspace, scheduleFlags } from './consultation-workspace';
import { Appointment } from '../../../../core/models/appointment.model';
import { ConsultationService } from '../../../../core/services/consultation.service';
import { AppointmentService } from '../../../../core/services/appointment.service';
import { MedicineService } from '../../../../core/services/medicine.service';
import { PrescriptionService } from '../../../../core/services/prescription.service';
import { DrugSafetyService } from '../../../../core/services/drug-safety.service';
import { SafetyWarning } from '../../../../core/models/drug-safety.model';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { Medicine } from '../../../../core/models/medicine.model';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

describe('ConsultationWorkspace', () => {
  const mockAppointment: Appointment = {
    id: 'appt-1', patient: { id: 'p1', fullName: 'Test Patient' },
    doctor: { id: 'd1', fullName: 'Dr. Test', specialization: 'GP' },
    appointmentDate: '2026-01-01', appointmentTime: '10:00', tokenNumber: 5,
    status: 'APPROVED', reason: 'Checkup',
  };

  let component: ConsultationWorkspace;
  const drugSafety = {
    allergies: vi.fn(),
    addAllergy: vi.fn(),
    removeAllergy: vi.fn(),
    check: vi.fn(),
  };

  beforeEach(() => {
    drugSafety.allergies.mockReset().mockReturnValue(of({ success: true, data: [] }));
    drugSafety.addAllergy.mockReset().mockReturnValue(of({ success: true, data: {} }));
    drugSafety.removeAllergy.mockReset().mockReturnValue(of({ success: true }));
    drugSafety.check.mockReset().mockReturnValue(of({ success: true, data: [] }));
    TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: vi.fn().mockReturnValue(null) }, pathFromRoot: [{ paramMap: { get: (k: string) => (k === 'hospitalCode' ? 'sai-clinic' : null) } }] } } },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: DrugSafetyService, useValue: drugSafety },
        { provide: ConsultationService, useValue: { createConsultation: vi.fn().mockReturnValue(of({ success: true, data: { id: 'c1' } })), updateConsultation: vi.fn().mockReturnValue(of({ success: true, data: { id: 'c1' } })), getByAppointment: vi.fn().mockReturnValue(of({ success: false })) } },
        { provide: AppointmentService, useValue: { getAppointmentById: vi.fn().mockReturnValue(of({ success: true, data: mockAppointment })), getAppointments: vi.fn().mockReturnValue(of({ success: true, data: { content: [], totalElements: 0 } })) } },
        { provide: MedicineService, useValue: { searchMedicines: vi.fn().mockReturnValue(of({ success: true, data: [] })) } },
        { provide: PrescriptionService, useValue: { getTemplates: vi.fn().mockReturnValue(of({ success: true, data: [] })), createPrescription: vi.fn().mockReturnValue(of({ success: true, data: { id: 'pr1' } })), updatePrescription: vi.fn().mockReturnValue(of({ success: true, data: { id: 'pr1' } })), getByAppointment: vi.fn().mockReturnValue(of({ success: false })) } },
        { provide: ChangeDetectorRef, useValue: { markForCheck: vi.fn(), detach: vi.fn(), detectChanges: vi.fn(), checkNoChanges: vi.fn(), reattach: vi.fn() } },
      ],
    });
    component = TestBed.runInInjectionContext(() => new ConsultationWorkspace());
  });

  it('should create with initial state', () => {
    expect(component).toBeTruthy();
    expect(component.consultationForm).toBeDefined();
  });

  it('should show queue when no appointment param', () => {
    component.ngOnInit();
    expect(component.showQueue).toBe(true);
    expect(component.selectedAppointment).toBeNull();
  });

  it('should have empty medicines array initially', () => {
    expect(component.medicines.length).toBe(0);
  });

  it('should get medicines form array', () => {
    component.addMedicine();
    expect(component.medicines.length).toBe(1);
  });

  it('should add and remove medicine', () => {
    component.addMedicine();
    component.addMedicine();
    expect(component.medicines.length).toBe(2);
    component.removeMedicine(0);
    expect(component.medicines.length).toBe(1);
  });

  it('should create medicine form group with defaults', () => {
    const fg = component.createMedicineFormGroup();
    expect(fg.get('name')?.value).toBe('');
    expect(fg.get('frequency')?.value).toBe('1-0-1');
    expect(fg.get('duration')?.value).toBe(3);
  });

  it('should calculate total tabs', () => {
    expect(component.calculateTotal('1-0-1', 5)).toBe('10 Tabs');
    expect(component.calculateTotal('1-1-1', 7)).toBe('21 Tabs');
    expect(component.calculateTotal('SOS', 3)).toBe('3 Tabs');
    expect(component.calculateTotal('', 0)).toBe('0 Tabs');
  });

  it('should show error when finishAndPrint called without appointment', () => {
    component.finishAndPrint();
    expect(component.error).toBe('Please select an appointment first');
  });

  it('should submit consultation with appointment selected', () => {
    component.selectedAppointment = mockAppointment;
    component.addMedicine();
    component.medicines.at(0).patchValue({ name: 'Paracetamol', frequency: '1-0-1', duration: 3 });
    component.finishAndPrint();
    expect(component.isSubmitting).toBe(false);
  });

  describe('prescribing from the catalog', () => {
    const catalogMedicine = { id: 'med-9', medicineName: 'Amoxil 500', manufacturer: 'Acme' } as Medicine;

    function fillAndSave(): { createPrescription: ReturnType<typeof vi.fn>; router: { navigate: ReturnType<typeof vi.fn> } } {
      const prescriptions = TestBed.inject(PrescriptionService) as unknown as { createPrescription: ReturnType<typeof vi.fn> };
      const router = TestBed.inject(Router) as unknown as { navigate: ReturnType<typeof vi.fn> };
      component.selectedAppointment = mockAppointment;
      component.addMedicine();
      return { createPrescription: prescriptions.createPrescription, router };
    }

    it('keeps the id of the medicine picked from the suggestions', () => {
      component.addMedicine();
      component.selectMedicine(0, catalogMedicine);
      expect(component.medicines.at(0).get('medicineId')?.value).toBe('med-9');
      expect(component.medicines.at(0).get('name')?.value).toBe('Amoxil 500');
    });

    it('drops that id when the doctor types over the name, so a stale medicine is not billed', () => {
      component.addMedicine();
      component.selectMedicine(0, catalogMedicine);
      component.onMedicineTyped(0, 'Something else');
      expect(component.medicines.at(0).get('medicineId')?.value).toBe('');
    });

    it('sends the medicine id with the prescription, which is what lets the bill price it', () => {
      const { createPrescription } = fillAndSave();
      component.selectMedicine(0, catalogMedicine);
      component.consultationForm.patchValue({ notes: { diagnosis: 'Viral fever' } });
      component.finishAndPrint();
      expect(createPrescription).toHaveBeenCalledWith(
        expect.objectContaining({ medicines: [expect.objectContaining({ medicineId: 'med-9', medicineName: 'Amoxil 500' })] }),
      );
    });

    it('sends no id for a medicine that is not in the catalog', () => {
      const { createPrescription } = fillAndSave();
      component.medicines.at(0).patchValue({ name: 'Home remedy' });
      component.finishAndPrint();
      expect(createPrescription.mock.calls[0][0].medicines[0].medicineId).toBeUndefined();
    });

    it('tells the doctor it was saved and opens the prescription inside the clinic', () => {
      const { router } = fillAndSave();
      const toast = TestBed.inject(ToastService);
      const success = vi.spyOn(toast, 'success');
      component.selectMedicine(0, catalogMedicine);
      component.finishAndPrint();
      expect(success).toHaveBeenCalledWith('Consultation and prescription saved');
      expect(router.navigate).toHaveBeenCalledWith(['/', 'sai-clinic', 'prescriptions', 'pr1']);
    });
  });

  describe('the dose schedule the bill relies on', () => {
    it('reads morning, afternoon and night from the frequency', () => {
      expect(scheduleFlags('1-0-1')).toEqual({ morning: true, afternoon: false, night: true });
      expect(scheduleFlags('1-1-1')).toEqual({ morning: true, afternoon: true, night: true });
      expect(scheduleFlags('0-0-1')).toEqual({ morning: false, afternoon: false, night: true });
    });

    it('sets none for as-needed or unreadable frequencies', () => {
      expect(scheduleFlags('SOS')).toEqual({ morning: false, afternoon: false, night: false });
      expect(scheduleFlags('')).toEqual({ morning: false, afternoon: false, night: false });
      expect(scheduleFlags(undefined as unknown as string)).toEqual({ morning: false, afternoon: false, night: false });
    });

    it('sends the flags and the unit with each medicine so 1-0-1 for 5 days is 10 doses', () => {
      const prescriptions = TestBed.inject(PrescriptionService) as unknown as { createPrescription: ReturnType<typeof vi.fn> };
      component.selectedAppointment = mockAppointment;
      component.addMedicine();
      component.medicines.at(0).patchValue({ name: 'Amoxil 500', frequency: '1-0-1', duration: 5 });
      component.finishAndPrint();
      expect(prescriptions.createPrescription.mock.calls[0][0].medicines[0]).toMatchObject({
        morning: true,
        afternoon: false,
        night: true,
        duration: 5,
        durationUnit: 'DAYS',
      });
    });
  });

  describe('drug safety', () => {
    const allergyWarning: SafetyWarning = {
      type: 'ALLERGY', severity: 'SEVERE', medicine: 'Amoxicillin',
      message: 'The patient is allergic to Penicillin (severe).', blocking: true,
    };
    const duplicateWarning: SafetyWarning = {
      type: 'DUPLICATE', severity: 'MODERATE', medicine: 'Paracetamol', other: 'Paracetamol',
      message: 'The same drug (paracetamol) is prescribed twice.', blocking: false,
    };

    function prescribe(name = 'Amoxicillin 500') {
      component.selectedAppointment = mockAppointment;
      component.addMedicine();
      component.medicines.at(0).patchValue({ name, frequency: '1-0-1', duration: 5 });
    }

    const prescriptionApi = () => TestBed.inject(PrescriptionService) as unknown as { createPrescription: ReturnType<typeof vi.fn> };
    const consultationApi = () => TestBed.inject(ConsultationService) as unknown as { createConsultation: ReturnType<typeof vi.fn> };

    it('loads the patient allergies', () => {
      drugSafety.allergies.mockReturnValue(of({ success: true, data: [{ id: 'a1', substance: 'Penicillin', severity: 'SEVERE', recordedAt: '2026-11-01' }] }));
      component.selectedAppointment = mockAppointment;

      component.loadAllergies();

      expect(drugSafety.allergies).toHaveBeenCalledWith('p1');
      expect(component.allergies.map((a) => a.substance)).toEqual(['Penicillin']);
    });

    it('records an allergy with its severity and reloads the list', () => {
      component.selectedAppointment = mockAppointment;

      component.addAllergy('  Penicillin ', 'SEVERE', 'Rash');

      expect(drugSafety.addAllergy).toHaveBeenCalledWith('p1', 'Penicillin', 'SEVERE', 'Rash');
      expect(drugSafety.allergies).toHaveBeenCalled();
    });

    it('asks for the drug when the allergy field is empty', () => {
      component.selectedAppointment = mockAppointment;

      component.addAllergy('   ', 'MILD', '');

      expect(component.allergyError).toContain('Type the drug');
      expect(drugSafety.addAllergy).not.toHaveBeenCalled();
    });

    it('checks the drugs before saving anything, and saves when there is no warning', () => {
      prescribe('Paracetamol');

      component.finishAndPrint();

      expect(drugSafety.check).toHaveBeenCalledWith('p1', [{ medicineId: undefined, medicineName: 'Paracetamol' }]);
      expect(consultationApi().createConsultation).toHaveBeenCalled();
    });

    it('holds a serious warning: nothing is saved until the doctor acknowledges it with a reason', () => {
      drugSafety.check.mockReturnValue(of({ success: true, data: [allergyWarning] }));
      prescribe();

      component.finishAndPrint();

      expect(component.safetyWarnings).toEqual([allergyWarning]);
      expect(component.safetyBlocking).toBe(true);
      expect(consultationApi().createConsultation).not.toHaveBeenCalled();
      expect(component.isSubmitting).toBe(false);
    });

    it('still holds it when the box is ticked but no reason is given', () => {
      drugSafety.check.mockReturnValue(of({ success: true, data: [allergyWarning] }));
      prescribe();
      component.finishAndPrint();
      component.safetyAcknowledged = true;
      component.safetyReason = '   ';

      component.finishAndPrint();

      expect(consultationApi().createConsultation).not.toHaveBeenCalled();
    });

    it('goes ahead once acknowledged with a reason, and sends the reason with the prescription', () => {
      drugSafety.check.mockReturnValue(of({ success: true, data: [allergyWarning] }));
      prescribe();
      component.finishAndPrint();
      component.safetyAcknowledged = true;
      component.safetyReason = '  Supervised first dose, no alternative  ';

      component.finishAndPrint();

      expect(consultationApi().createConsultation).toHaveBeenCalled();
      expect(prescriptionApi().createPrescription).toHaveBeenCalledWith(
        expect.objectContaining({ acknowledgeWarnings: true, overrideReason: 'Supervised first dose, no alternative' }));
    });

    it('does not send an acknowledgement when there was no serious warning', () => {
      drugSafety.check.mockReturnValue(of({ success: true, data: [duplicateWarning] }));
      prescribe('Paracetamol');
      component.safetyAcknowledged = true;
      component.safetyReason = 'left ticked from before';

      component.finishAndPrint();

      const sent = prescriptionApi().createPrescription.mock.calls[0][0];
      expect(sent.acknowledgeWarnings).toBeUndefined();
      expect(sent.overrideReason).toBeUndefined();
    });

    it('saves with a mild warning, and keeps showing it', () => {
      drugSafety.check.mockReturnValue(of({ success: true, data: [duplicateWarning] }));
      prescribe('Paracetamol');

      component.finishAndPrint();

      expect(component.safetyBlocking).toBe(false);
      expect(consultationApi().createConsultation).toHaveBeenCalled();
    });

    it('forgets an acknowledgement when the drugs change', () => {
      component.ngOnInit();
      drugSafety.check.mockReturnValue(of({ success: true, data: [allergyWarning] }));
      prescribe();
      component.finishAndPrint();
      component.safetyAcknowledged = true;
      component.safetyReason = 'because';

      component.medicines.at(0).patchValue({ name: 'Azithromycin' });

      expect(component.safetyWarnings).toEqual([]);
      expect(component.safetyAcknowledged).toBe(false);
      expect(component.safetyReason).toBe('');
    });

    it('saves anyway if the check itself cannot be reached (the server checks again)', () => {
      drugSafety.check.mockReturnValue(throwError(() => new Error('offline')));
      prescribe();

      component.finishAndPrint();

      expect(consultationApi().createConsultation).toHaveBeenCalled();
    });

    it('shows the server message when it refuses a serious warning', () => {
      prescribe();
      prescriptionApi().createPrescription.mockReturnValue(throwError(() => ({
        error: { errorCode: 'DRUG_SAFETY_WARNING', message: 'The patient is allergic to Penicillin.' },
      })));

      component.finishAndPrint();

      expect(component.error).toBe('The patient is allergic to Penicillin.');
    });
  });
});
