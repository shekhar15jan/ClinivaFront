import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { ConsultationWorkspace } from './consultation-workspace';
import { ConsultationService } from '../../../../core/services/consultation.service';
import { AppointmentService } from '../../../../core/services/appointment.service';
import { MedicineService } from '../../../../core/services/medicine.service';
import { PrescriptionService } from '../../../../core/services/prescription.service';
import { of } from 'rxjs';
import { vi } from 'vitest';

describe('ConsultationWorkspace', () => {
  const mockAppointment: any = {
    id: 'appt-1', patient: { id: 'p1', fullName: 'Test Patient' },
    doctor: { id: 'd1', fullName: 'Dr. Test', specialization: 'GP' },
    appointmentDate: '2026-01-01', appointmentTime: '10:00', tokenNumber: 5,
    status: 'APPROVED', reason: 'Checkup',
  };

  let fixture: ComponentFixture<ConsultationWorkspace>;
  let component: ConsultationWorkspace;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ConsultationWorkspace],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: vi.fn().mockReturnValue(null) } } } },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: ConsultationService, useValue: { createConsultation: vi.fn().mockReturnValue(of({ success: true, data: { id: 'c1' } })), updateConsultation: vi.fn().mockReturnValue(of({ success: true, data: { id: 'c1' } })), getByAppointment: vi.fn().mockReturnValue(of({ success: false })) } },
        { provide: AppointmentService, useValue: { getAppointmentById: vi.fn().mockReturnValue(of({ success: true, data: mockAppointment })), getAppointments: vi.fn().mockReturnValue(of({ success: true, data: { content: [], totalElements: 0 } })) } },
        { provide: MedicineService, useValue: { searchMedicines: vi.fn().mockReturnValue(of({ success: true, data: [] })) } },
        { provide: PrescriptionService, useValue: { getTemplates: vi.fn().mockReturnValue(of({ success: true, data: [] })), createPrescription: vi.fn().mockReturnValue(of({ success: true, data: { id: 'pr1' } })), updatePrescription: vi.fn().mockReturnValue(of({ success: true, data: { id: 'pr1' } })), getByAppointment: vi.fn().mockReturnValue(of({ success: false })) } },
      ],
    });
    fixture = TestBed.createComponent(ConsultationWorkspace);
    component = fixture.componentInstance;
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
});
