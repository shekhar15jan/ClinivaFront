import { TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ConsultationWorkspace, scheduleFlags } from './consultation-workspace';
import { Appointment } from '../../../../core/models/appointment.model';
import { ConsultationService } from '../../../../core/services/consultation.service';
import { AppointmentService } from '../../../../core/services/appointment.service';
import { MedicineService } from '../../../../core/services/medicine.service';
import { PrescriptionService } from '../../../../core/services/prescription.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { Medicine } from '../../../../core/models/medicine.model';
import { of } from 'rxjs';
import { vi } from 'vitest';

describe('ConsultationWorkspace', () => {
  const mockAppointment: Appointment = {
    id: 'appt-1', patient: { id: 'p1', fullName: 'Test Patient' },
    doctor: { id: 'd1', fullName: 'Dr. Test', specialization: 'GP' },
    appointmentDate: '2026-01-01', appointmentTime: '10:00', tokenNumber: 5,
    status: 'APPROVED', reason: 'Checkup',
  };

  let component: ConsultationWorkspace;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: vi.fn().mockReturnValue(null) }, pathFromRoot: [{ paramMap: { get: (k: string) => (k === 'hospitalCode' ? 'sai-clinic' : null) } }] } } },
        { provide: Router, useValue: { navigate: vi.fn() } },
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
});
