import { TestBed } from '@angular/core/testing';
import { PatientList } from './patient-list';
import { PatientService } from '../../../../core/services/patient.service';
import { FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ApiResponse, PagedResponse } from '../../../../core/models/common.model';
import { Patient } from '../../../../core/models/patient.model';

describe('PatientList', () => {
  const mockPatient: Patient = {
    id: 'p1', patientId: 'CLV-001', fullName: 'Rahul Sharma',
    dateOfBirth: '1990-01-01', age: 36, gender: 'MALE', phone: '9876543210',
  };

  const mockPaged: ApiResponse<PagedResponse<Patient>> = {
    success: true,
    data: { content: [mockPatient], pageNumber: 0, pageSize: 20, totalElements: 1, totalPages: 1, last: true },
    message: 'ok', timestamp: '', requestId: 'r1',
  };

  function createComponent(overrides?: Partial<PatientService>) {
    TestBed.configureTestingModule({
      providers: [
        { provide: PatientService, useValue: { getPatients: vi.fn().mockReturnValue(of(mockPaged)), createPatient: vi.fn().mockReturnValue(of({ success: true, data: mockPatient, message: 'created', timestamp: '', requestId: 'r1' })), ...overrides } },
        FormBuilder,
      ],
    });
    return TestBed.runInInjectionContext(() => new PatientList());
  }

  it('should create with initial state', () => {
    const component = createComponent();
    expect(component).toBeTruthy();
    expect(component.patients).toEqual([]);
    expect(component.isLoading).toBe(false);
    expect(component.showAddModal).toBe(false);
    expect(component.isSubmitting).toBe(false);
  });

  it('should load patients on init', () => {
    const component = createComponent();
    component.ngOnInit();
    expect(component.patients).toEqual([mockPatient]);
    expect(component.isLoading).toBe(false);
  });

  it('should handle load patients error', () => {
    const component = createComponent({ getPatients: vi.fn().mockReturnValue(throwError(() => new Error('fail'))) });
    component.ngOnInit();
    expect(component.patients).toEqual([]);
    expect(component.isLoading).toBe(false);
  });

  it('should compute getInitials', () => {
    const component = createComponent();
    expect(component.getInitials('Rahul Sharma')).toBe('RS');
    expect(component.getInitials('John')).toBe('J');
    expect(component.getInitials('')).toBe('');
  });

  it('should toggle add modal and reset form', () => {
    const component = createComponent();
    expect(component.showAddModal).toBe(false);
    component.toggleAddModal();
    expect(component.showAddModal).toBe(true);
    component.toggleAddModal();
    expect(component.showAddModal).toBe(false);
  });

  it('should not submit invalid form', () => {
    const component = createComponent();
    const spy = vi.spyOn(component, 'toggleAddModal');
    component.onSubmitAdd();
    expect(component.isSubmitting).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });

  it('should submit and create patient', () => {
    const component = createComponent();
    component.showAddModal = true;
    component.addForm.patchValue({ fullName: 'Test', dateOfBirth: '2000-01-01', gender: 'MALE', phone: '9876543210' });
    component.onSubmitAdd();
    expect(component.isSubmitting).toBe(false);
    expect(component.showAddModal).toBe(false);
  });

  it('should handle create patient error', () => {
    const component = createComponent({ createPatient: vi.fn().mockReturnValue(throwError(() => new Error('fail'))) });
    component.addForm.patchValue({ fullName: 'Test', dateOfBirth: '2000-01-01', gender: 'MALE', phone: '9876543210' });
    component.onSubmitAdd();
    expect(component.isSubmitting).toBe(false);
  });

  describe('importing a CSV', () => {
    const file = new File(['name,phone\nA,9000000001'], 'patients.csv', { type: 'text/csv' });
    const reply = (data: unknown) => ({ success: true, data, message: 'ok', timestamp: '', requestId: 'r' });

    it('says how many were imported and how many were left out, with the reasons', () => {
      const component = createComponent({
        uploadPatients: vi.fn().mockReturnValue(of(reply({ imported: 2, skipped: 1, errors: ['Row 3: Duplicate phone 9000000001'] }))),
      } as unknown as Partial<PatientService>);
      component.csvFile = file;
      component.uploadCsv();
      expect(component.uploadResult).toBe('Imported 2 patients, skipped 1.');
      expect(component.uploadIssues).toEqual(['Row 3: Duplicate phone 9000000001']);
      expect(component.uploadFailed).toBe(false);
      expect(component.showCsvUpload).toBe(false);
    });

    it('uses the singular for one patient and mentions no skips when there were none', () => {
      const component = createComponent({
        uploadPatients: vi.fn().mockReturnValue(of(reply({ imported: 1, skipped: 0, errors: [] }))),
      } as unknown as Partial<PatientService>);
      component.csvFile = file;
      component.uploadCsv();
      expect(component.uploadResult).toBe('Imported 1 patient.');
    });

    it('shows the server reason when the file is refused', () => {
      const component = createComponent({
        uploadPatients: vi.fn().mockReturnValue(throwError(() => ({ error: { message: 'Only CSV files are accepted' } }))),
      } as unknown as Partial<PatientService>);
      component.csvFile = file;
      component.uploadCsv();
      expect(component.uploadResult).toBe('Only CSV files are accepted');
      expect(component.uploadFailed).toBe(true);
      expect(component.isUploading).toBe(false);
    });
  });
});
